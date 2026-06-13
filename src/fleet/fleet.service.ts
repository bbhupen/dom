import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DroneStatus, Prisma } from '@prisma/client';
import { AuthUser } from '../domain';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FleetService {
  constructor(private readonly prisma: PrismaService) {}

  async findDrones(
    user: AuthUser,
    options: {
      page?: string;
      pageSize?: string;
      search?: string;
      pilotId?: string;
    } = {},
  ) {
    this.assertFleetReadAccess(user);
    const page = this.parsePositiveInt(options.page, 1);
    const pageSize = Math.min(this.parsePositiveInt(options.pageSize, 10), 100);
    const search = options.search?.trim();
    const searchStatus = search ? this.tryParseDroneStatus(search) : null;

    // pilots can only see their own inventory
    let pilotInventoryId: string | null | undefined;
    if (user.role === 'pilot') {
      const pilotProfile = await this.prisma.pilot.findFirst({
        where: { organizationId: user.organizationId, email: user.email },
        select: { id: true },
      });
      pilotInventoryId = pilotProfile?.id ?? null;
    } else if (options.pilotId) {
      pilotInventoryId = options.pilotId;
    }

    const where: Prisma.DroneWhereInput = {
      organizationId: user.organizationId,
      ...(pilotInventoryId !== undefined ? { pilotId: pilotInventoryId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { manufacturer: { contains: search, mode: 'insensitive' } },
              { model: { contains: search, mode: 'insensitive' } },
              { serialNumber: { contains: search, mode: 'insensitive' } },
              { uin: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
              ...(searchStatus ? [{ status: searchStatus }] : []),
            ],
          }
        : {}),
    };

    const [drones, total, activeCount, maintenanceCount, totalFlightHours] = await Promise.all([
      this.prisma.drone.findMany({
        where,
        include: { inventoryPilot: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.drone.count({ where }),
      this.prisma.drone.count({
        where: { organizationId: user.organizationId, status: DroneStatus.ACTIVE },
      }),
      this.prisma.drone.count({
        where: { organizationId: user.organizationId, status: DroneStatus.UNDER_MAINTENANCE },
      }),
      this.prisma.drone.aggregate({
        where: { organizationId: user.organizationId },
        _sum: { totalFlightHours: true },
      }),
    ]);

    return {
      items: drones.map((drone) => this.toResponse(drone)),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
      summary: {
        activeCount,
        maintenanceCount,
        totalFlightHours: totalFlightHours._sum.totalFlightHours ?? 0,
      },
    };
  }

  async findDrone(user: AuthUser, id: string) {
    this.assertFleetReadAccess(user);

    const drone = await this.prisma.drone.findFirst({
      where: { id, organizationId: user.organizationId },
      include: { inventoryPilot: { select: { id: true, name: true } } },
    });

    if (!drone) {
      throw new NotFoundException(`Drone ${id} was not found`);
    }

    return this.toResponse(drone);
  }

  async assignDroneToPilot(user: AuthUser, droneId: string, pilotId: string) {
    this.assertAdminFleetAccess(user);

    const drone = await this.prisma.drone.findFirst({
      where: { id: droneId, organizationId: user.organizationId },
    });
    if (!drone) throw new NotFoundException(`Drone ${droneId} was not found`);
    if (drone.pilotId) throw new BadRequestException('Drone is already assigned to a pilot — unassign it first');

    const pilot = await this.prisma.pilot.findFirst({
      where: { id: pilotId, organizationId: user.organizationId },
    });
    if (!pilot) throw new NotFoundException(`Pilot ${pilotId} was not found`);

    const updated = await this.prisma.drone.update({
      where: { id: droneId },
      data: { pilotId },
      include: { inventoryPilot: { select: { id: true, name: true } } },
    });

    return this.toResponse(updated);
  }

  async unassignDroneFromPilot(user: AuthUser, droneId: string) {
    this.assertAdminFleetAccess(user);

    const drone = await this.prisma.drone.findFirst({
      where: { id: droneId, organizationId: user.organizationId },
    });
    if (!drone) throw new NotFoundException(`Drone ${droneId} was not found`);

    const updated = await this.prisma.drone.update({
      where: { id: droneId },
      data: { pilotId: null },
      include: { inventoryPilot: { select: { id: true, name: true } } },
    });

    return this.toResponse(updated);
  }

  async createDrone(
    user: AuthUser,
    input: {
      name?: string;
      manufacturer?: string;
      model?: string;
      serialNumber?: string;
      uin?: string;
      category?: string;
      weightKg?: number;
      payloadCapacityKg?: number;
      notes?: string;
    },
  ) {
    this.assertAdminFleetAccess(user);

    const name = input.name?.trim();
    const manufacturer = input.manufacturer?.trim();
    const model = input.model?.trim();
    const serialNumber = input.serialNumber?.trim();

    if (!name || !manufacturer || !model || !serialNumber) {
      throw new BadRequestException('Name, manufacturer, model, and serial number are required');
    }

    try {
      const drone = await this.prisma.drone.create({
        data: {
          organizationId: user.organizationId,
          name,
          manufacturer,
          model,
          serialNumber,
          uin: input.uin?.trim() || null,
          category: input.category?.trim() || null,
          weightKg: this.normalizeNumber(input.weightKg),
          payloadCapacityKg: this.normalizeNumber(input.payloadCapacityKg),
          notes: input.notes?.trim() || null,
        },
        include: { inventoryPilot: { select: { id: true, name: true } } },
      });

      return this.toResponse(drone);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('A drone with this serial number already exists');
      }

      throw error;
    }
  }

  async updateDrone(
    user: AuthUser,
    id: string,
    input: {
      name?: string;
      manufacturer?: string;
      model?: string;
      serialNumber?: string;
      uin?: string;
      category?: string;
      weightKg?: number;
      payloadCapacityKg?: number;
      notes?: string;
    },
  ) {
    this.assertAdminFleetAccess(user);
    await this.findDrone(user, id);

    const name = input.name?.trim();
    const manufacturer = input.manufacturer?.trim();
    const model = input.model?.trim();
    const serialNumber = input.serialNumber?.trim();

    if (!name || !manufacturer || !model || !serialNumber) {
      throw new BadRequestException('Name, manufacturer, model, and serial number are required');
    }

    try {
      const drone = await this.prisma.drone.update({
        where: { id },
        data: {
          name,
          manufacturer,
          model,
          serialNumber,
          uin: input.uin?.trim() || null,
          category: input.category?.trim() || null,
          weightKg: this.normalizeNumber(input.weightKg),
          payloadCapacityKg: this.normalizeNumber(input.payloadCapacityKg),
          notes: input.notes?.trim() || null,
        },
        include: { inventoryPilot: { select: { id: true, name: true } } },
      });

      return this.toResponse(drone);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('A drone with this serial number already exists');
      }

      throw error;
    }
  }

  async updateDroneStatus(user: AuthUser, id: string, status: string) {
    this.assertAdminFleetAccess(user);
    await this.findDrone(user, id);

    const droneStatus = this.parseDroneStatus(status);
    const drone = await this.prisma.drone.update({
      where: { id },
      data: { status: droneStatus },
      include: { inventoryPilot: { select: { id: true, name: true } } },
    });

    return this.toResponse(drone);
  }

  private assertFleetReadAccess(user: AuthUser) {
    if (!['super_admin', 'org_owner', 'org_admin', 'maintenance', 'pilot'].includes(user.role)) {
      throw new ForbiddenException('This account cannot access fleet');
    }
  }

  private assertAdminFleetAccess(user: AuthUser) {
    if (!['super_admin', 'org_owner', 'org_admin', 'maintenance'].includes(user.role)) {
      throw new ForbiddenException('This account cannot manage fleet');
    }
  }

  private normalizeNumber(value?: number) {
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
      return null;
    }

    return Number(value);
  }

  private parsePositiveInt(value: string | undefined, fallback: number) {
    const parsedValue = Number(value);

    if (!Number.isInteger(parsedValue) || parsedValue < 1) {
      return fallback;
    }

    return parsedValue;
  }

  private isUniqueConstraintError(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }

  private parseDroneStatus(status: string) {
    const normalizedStatus = status.trim().toUpperCase();

    if (!this.isDroneStatus(normalizedStatus)) {
      throw new BadRequestException('Invalid drone status');
    }

    return normalizedStatus as DroneStatus;
  }

  private tryParseDroneStatus(status: string) {
    const normalizedStatus = status.trim().replace(/\s+/g, '_').toUpperCase();

    if (!this.isDroneStatus(normalizedStatus)) {
      return null;
    }

    return normalizedStatus as DroneStatus;
  }

  private isDroneStatus(status: string) {
    return Object.values(DroneStatus).includes(status as DroneStatus);
  }

  private toResponse(drone: {
    id: string;
    organizationId: string;
    name: string;
    manufacturer: string;
    model: string;
    serialNumber: string;
    uin: string | null;
    category: string | null;
    weightKg: number | null;
    payloadCapacityKg: number | null;
    status: DroneStatus;
    totalFlightHours: number;
    pilotId: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    inventoryPilot?: { id: string; name: string } | null;
  }) {
    return {
      ...drone,
      status: drone.status.toString().toLowerCase(),
      inventoryPilot: drone.inventoryPilot ?? null,
    };
  }
}
