import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DroneStatus, Prisma } from '@prisma/client';
import { AuthUser } from '../domain';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FleetService {
  constructor(private readonly prisma: PrismaService) {}

  async findDrones(user: AuthUser) {
    this.assertOrganizationFleetAccess(user);

    const drones = await this.prisma.drone.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return drones.map((drone) => this.toResponse(drone));
  }

  async findDrone(user: AuthUser, id: string) {
    this.assertOrganizationFleetAccess(user);

    const drone = await this.prisma.drone.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!drone) {
      throw new NotFoundException(`Drone ${id} was not found`);
    }

    return this.toResponse(drone);
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
    this.assertOrganizationFleetAccess(user);

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
      });

      return this.toResponse(drone);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('A drone with this serial number already exists');
      }

      throw error;
    }
  }

  private assertOrganizationFleetAccess(user: AuthUser) {
    if (!['org_owner', 'org_admin', 'maintenance'].includes(user.role)) {
      throw new ForbiddenException('This account cannot manage organization fleet');
    }
  }

  private normalizeNumber(value?: number) {
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
      return null;
    }

    return Number(value);
  }

  private isUniqueConstraintError(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
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
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...drone,
      status: drone.status.toString().toLowerCase(),
    };
  }
}
