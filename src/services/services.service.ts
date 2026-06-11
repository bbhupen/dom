import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ServiceCategory, ServicePricingUnit, ServiceStatus } from '@prisma/client';
import { AuthUser } from '../domain';
import { PrismaService } from '../prisma/prisma.service';

type ServiceInput = {
  name?: string;
  category?: string;
  description?: string;
  pricingUnit?: string;
  basePrice?: number;
  currency?: string;
  estimatedDurationMinutes?: number;
  deliverables?: string;
  notes?: string;
};

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findServices(
    user: AuthUser,
    options: {
      page?: string;
      pageSize?: string;
      search?: string;
      category?: string;
      status?: string;
    } = {},
  ) {
    this.assertOrganizationServiceAccess(user);
    const page = this.parsePositiveInt(options.page, 1);
    const pageSize = Math.min(this.parsePositiveInt(options.pageSize, 10), 100);
    const search = options.search?.trim();
    const category = options.category ? this.parseServiceCategory(options.category) : undefined;
    const status = options.status ? this.parseServiceStatus(options.status) : undefined;
    const where: Prisma.ServiceWhereInput = {
      organizationId: user.organizationId,
      ...(category ? { category } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { deliverables: { contains: search, mode: 'insensitive' } },
              { notes: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [services, total, activeCount, inactiveCount] = await Promise.all([
      this.prisma.service.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.service.count({ where }),
      this.prisma.service.count({
        where: { organizationId: user.organizationId, status: ServiceStatus.ACTIVE },
      }),
      this.prisma.service.count({
        where: { organizationId: user.organizationId, status: ServiceStatus.INACTIVE },
      }),
    ]);

    return {
      items: services.map((service) => this.toResponse(service)),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
      summary: {
        activeCount,
        inactiveCount,
      },
    };
  }

  async findService(user: AuthUser, id: string) {
    this.assertOrganizationServiceAccess(user);

    const service = await this.prisma.service.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!service) {
      throw new NotFoundException(`Service ${id} was not found`);
    }

    return this.toResponse(service);
  }

  async createService(user: AuthUser, input: ServiceInput) {
    this.assertOrganizationServiceAccess(user);
    const data = this.toServiceData(input);

    try {
      const service = await this.prisma.service.create({
        data: {
          ...data,
          organizationId: user.organizationId,
        },
      });

      return this.toResponse(service);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('A service with this name already exists');
      }

      throw error;
    }
  }

  async updateService(user: AuthUser, id: string, input: ServiceInput) {
    this.assertOrganizationServiceAccess(user);
    await this.findService(user, id);
    const data = this.toServiceData(input);

    try {
      const service = await this.prisma.service.update({
        where: { id },
        data,
      });

      return this.toResponse(service);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('A service with this name already exists');
      }

      throw error;
    }
  }

  async updateServiceStatus(user: AuthUser, id: string, status: string) {
    this.assertOrganizationServiceAccess(user);
    await this.findService(user, id);

    const serviceStatus = this.parseServiceStatus(status);
    const service = await this.prisma.service.update({
      where: { id },
      data: { status: serviceStatus },
    });

    return this.toResponse(service);
  }

  private assertOrganizationServiceAccess(user: AuthUser) {
    if (!['org_owner', 'org_admin'].includes(user.role)) {
      throw new ForbiddenException('This account cannot manage organization services');
    }
  }

  private toServiceData(input: ServiceInput) {
    const name = input.name?.trim();

    if (!name) {
      throw new BadRequestException('Service name is required');
    }

    return {
      name,
      category: this.parseServiceCategory(input.category ?? 'custom'),
      description: input.description?.trim() || null,
      pricingUnit: this.parsePricingUnit(input.pricingUnit ?? 'per_project'),
      basePrice: this.normalizeNumber(input.basePrice),
      currency: input.currency?.trim().toUpperCase() || 'INR',
      estimatedDurationMinutes: this.normalizeInteger(input.estimatedDurationMinutes),
      deliverables: input.deliverables?.trim() || null,
      notes: input.notes?.trim() || null,
    };
  }

  private normalizeNumber(value?: number) {
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
      return null;
    }

    return Number(value);
  }

  private normalizeInteger(value?: number) {
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
      return null;
    }

    const parsedValue = Number(value);

    if (!Number.isInteger(parsedValue) || parsedValue < 1) {
      throw new BadRequestException('Estimated duration must be a positive number of minutes');
    }

    return parsedValue;
  }

  private parsePositiveInt(value: string | undefined, fallback: number) {
    const parsedValue = Number(value);

    if (!Number.isInteger(parsedValue) || parsedValue < 1) {
      return fallback;
    }

    return parsedValue;
  }

  private parseServiceCategory(category: string) {
    const normalizedCategory = category.trim().replace(/[\s-]+/g, '_').toUpperCase();

    if (!Object.values(ServiceCategory).includes(normalizedCategory as ServiceCategory)) {
      throw new BadRequestException('Invalid service category');
    }

    return normalizedCategory as ServiceCategory;
  }

  private parsePricingUnit(pricingUnit: string) {
    const normalizedPricingUnit = pricingUnit.trim().replace(/[\s-]+/g, '_').toUpperCase();

    if (!Object.values(ServicePricingUnit).includes(normalizedPricingUnit as ServicePricingUnit)) {
      throw new BadRequestException('Invalid pricing unit');
    }

    return normalizedPricingUnit as ServicePricingUnit;
  }

  private parseServiceStatus(status: string) {
    const normalizedStatus = status.trim().replace(/[\s-]+/g, '_').toUpperCase();

    if (!Object.values(ServiceStatus).includes(normalizedStatus as ServiceStatus)) {
      throw new BadRequestException('Invalid service status');
    }

    return normalizedStatus as ServiceStatus;
  }

  private isUniqueConstraintError(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }

  private toResponse(service: {
    id: string;
    organizationId: string;
    name: string;
    category: ServiceCategory;
    description: string | null;
    status: ServiceStatus;
    pricingUnit: ServicePricingUnit;
    basePrice: number | null;
    currency: string;
    estimatedDurationMinutes: number | null;
    deliverables: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...service,
      category: service.category.toString().toLowerCase(),
      status: service.status.toString().toLowerCase(),
      pricingUnit: service.pricingUnit.toString().toLowerCase(),
    };
  }
}
