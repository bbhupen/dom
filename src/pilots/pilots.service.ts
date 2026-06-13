import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PilotStatus, Prisma } from '@prisma/client';
import { AuthUser } from '../domain';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PilotsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    user: AuthUser,
    options: {
      page?: string;
      pageSize?: string;
      search?: string;
      status?: string;
    } = {},
  ) {
    this.assertOrganizationPilotAccess(user);
    const page = this.parsePositiveInt(options.page, 1);
    const pageSize = Math.min(this.parsePositiveInt(options.pageSize, 10), 100);
    const search = options.search?.trim();
    const status = options.status ? this.parsePilotStatus(options.status) : undefined;
    const where: Prisma.PilotWhereInput = {
      organizationId: user.organizationId,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { licenseNumber: { contains: search, mode: 'insensitive' } },
              { notes: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [pilots, total, availableCount, assignedCount] = await Promise.all([
      this.prisma.pilot.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.pilot.count({ where }),
      this.prisma.pilot.count({
        where: { organizationId: user.organizationId, status: PilotStatus.AVAILABLE },
      }),
      this.prisma.pilot.count({
        where: { organizationId: user.organizationId, status: PilotStatus.ASSIGNED },
      }),
    ]);

    return {
      items: pilots.map((pilot) => this.toResponse(pilot)),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
      summary: {
        availableCount,
        assignedCount,
      },
    };
  }

  async findOne(user: AuthUser, id: string) {
    this.assertOrganizationPilotAccess(user);

    const pilot = await this.prisma.pilot.findFirst({
      where: { id, organizationId: user.organizationId },
    });

    if (!pilot) {
      throw new NotFoundException(`Pilot ${id} was not found`);
    }

    return this.toResponse(pilot);
  }

  async createPilot(
    user: AuthUser,
    input: {
      name?: string;
      phone?: string;
      email?: string;
      licenseNumber?: string;
      status?: string;
      notes?: string;
    },
  ) {
    this.assertOrganizationPilotManageAccess(user);
    const data = this.toPilotData(input);

    try {
      const pilot = await this.prisma.pilot.create({
        data: {
          ...data,
          organizationId: user.organizationId,
        },
      });

      return this.toResponse(pilot);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('A pilot with this phone number already exists');
      }

      throw error;
    }
  }

  async updatePilot(
    user: AuthUser,
    id: string,
    input: {
      name?: string;
      phone?: string;
      email?: string;
      licenseNumber?: string;
      status?: string;
      notes?: string;
    },
  ) {
    this.assertOrganizationPilotManageAccess(user);
    await this.findOne(user, id);
    const data = this.toPilotData(input);

    try {
      const pilot = await this.prisma.pilot.update({
        where: { id },
        data,
      });

      return this.toResponse(pilot);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('A pilot with this phone number already exists');
      }

      throw error;
    }
  }

  async updatePilotStatus(user: AuthUser, id: string, status: string) {
    this.assertOrganizationPilotManageAccess(user);
    await this.findOne(user, id);

    const pilotStatus = this.parsePilotStatus(status);
    const pilot = await this.prisma.pilot.update({
      where: { id },
      data: { status: pilotStatus },
    });

    return this.toResponse(pilot);
  }

  private assertOrganizationPilotAccess(user: AuthUser) {
    if (!['org_owner', 'org_admin', 'maintenance', 'pilot'].includes(user.role)) {
      throw new ForbiddenException('This account cannot view organization pilots');
    }
  }

  private assertOrganizationPilotManageAccess(user: AuthUser) {
    if (!['org_owner', 'org_admin', 'maintenance'].includes(user.role)) {
      throw new ForbiddenException('This account cannot manage organization pilots');
    }
  }

  private toPilotData(input: {
    name?: string;
    phone?: string;
    email?: string;
    licenseNumber?: string;
    status?: string;
    notes?: string;
  }) {
    const name = input.name?.trim();
    const phone = input.phone?.trim();

    if (!name || !phone) {
      throw new BadRequestException('Pilot name and phone are required');
    }

    return {
      name,
      phone,
      email: input.email?.trim() || null,
      licenseNumber: input.licenseNumber?.trim() || null,
      status: input.status ? this.parsePilotStatus(input.status) : PilotStatus.AVAILABLE,
      notes: input.notes?.trim() || null,
    };
  }

  private parsePositiveInt(value: string | undefined, fallback: number) {
    const parsedValue = Number(value);

    if (!Number.isInteger(parsedValue) || parsedValue < 1) {
      return fallback;
    }

    return parsedValue;
  }

  private parsePilotStatus(status: string) {
    const normalizedStatus = status.trim().replace(/[\s-]+/g, '_').toUpperCase();

    if (!Object.values(PilotStatus).includes(normalizedStatus as PilotStatus)) {
      throw new BadRequestException('Invalid pilot status');
    }

    return normalizedStatus as PilotStatus;
  }

  private isUniqueConstraintError(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }

  private toResponse(pilot: {
    id: string;
    organizationId: string;
    name: string;
    phone: string;
    email: string | null;
    licenseNumber: string | null;
    status: PilotStatus;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...pilot,
      status: pilot.status.toString().toLowerCase(),
    };
  }
}
