import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RequestSource, RequestStatus, RequestUrgency } from '@prisma/client';
import { AuthUser } from '../domain';
import { PrismaService } from '../prisma/prisma.service';

type RequestInput = {
  serviceId?: string;
  source?: string;
  customerName?: string;
  contactPhone?: string;
  serviceType?: string;
  siteLocation?: string;
  preferredDate?: string;
  description?: string;
  urgency?: string;
  status?: string;
  quoteAmount?: number;
  notes?: string;
};

@Injectable()
export class RequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    user: AuthUser,
    options: {
      page?: string;
      pageSize?: string;
      search?: string;
      status?: string;
      urgency?: string;
    } = {},
  ) {
    this.assertOrganizationRequestAccess(user);
    const page = this.parsePositiveInt(options.page, 1);
    const pageSize = Math.min(this.parsePositiveInt(options.pageSize, 10), 100);
    const search = options.search?.trim();
    const status = options.status ? this.parseRequestStatus(options.status) : undefined;
    const urgency = options.urgency ? this.parseRequestUrgency(options.urgency) : undefined;
    const where: Prisma.ServiceRequestWhereInput = {
      organizationId: user.organizationId,
      ...(status ? { status } : {}),
      ...(urgency ? { urgency } : {}),
      ...(search
        ? {
            OR: [
              { customerName: { contains: search, mode: 'insensitive' } },
              { contactPhone: { contains: search, mode: 'insensitive' } },
              { serviceType: { contains: search, mode: 'insensitive' } },
              { siteLocation: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { notes: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [requests, total, openCount, urgentCount, quotedCount] = await Promise.all([
      this.prisma.serviceRequest.findMany({
        where,
        include: { service: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.serviceRequest.count({ where }),
      this.prisma.serviceRequest.count({
        where: {
          organizationId: user.organizationId,
          status: { in: [RequestStatus.SUBMITTED, RequestStatus.UNDER_REVIEW, RequestStatus.MORE_INFO_REQUIRED] },
        },
      }),
      this.prisma.serviceRequest.count({
        where: { organizationId: user.organizationId, urgency: RequestUrgency.URGENT },
      }),
      this.prisma.serviceRequest.count({
        where: { organizationId: user.organizationId, status: RequestStatus.QUOTE_SENT },
      }),
    ]);

    return {
      items: requests.map((request) => this.toResponse(request)),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
      summary: {
        openCount,
        urgentCount,
        quotedCount,
      },
    };
  }

  async findOne(user: AuthUser, id: string) {
    this.assertOrganizationRequestAccess(user);

    const request = await this.prisma.serviceRequest.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: { service: true },
    });

    if (!request) {
      throw new NotFoundException(`Request ${id} was not found`);
    }

    return this.toResponse(request);
  }

  async create(user: AuthUser, input: RequestInput) {
    this.assertOrganizationRequestAccess(user);
    const data = await this.toRequestData(user, input);
    const request = await this.prisma.serviceRequest.create({
      data: {
        ...data,
        organizationId: user.organizationId,
      },
      include: { service: true },
    });

    return this.toResponse(request);
  }

  async update(user: AuthUser, id: string, input: RequestInput) {
    this.assertOrganizationRequestAccess(user);
    await this.findOne(user, id);
    const data = await this.toRequestData(user, input);
    const request = await this.prisma.serviceRequest.update({
      where: { id },
      data,
      include: { service: true },
    });

    return this.toResponse(request);
  }

  async updateStatus(user: AuthUser, id: string, status: string) {
    this.assertOrganizationRequestAccess(user);
    await this.findOne(user, id);

    const requestStatus = this.parseRequestStatus(status);
    const request = await this.prisma.serviceRequest.update({
      where: { id },
      data: { status: requestStatus },
      include: { service: true },
    });

    return this.toResponse(request);
  }

  private assertOrganizationRequestAccess(user: AuthUser) {
    if (!['org_owner', 'org_admin', 'maintenance', 'pilot'].includes(user.role)) {
      throw new ForbiddenException('This account cannot manage organization requests');
    }
  }

  private async toRequestData(user: AuthUser, input: RequestInput) {
    const customerName = input.customerName?.trim();
    const contactPhone = input.contactPhone?.trim();
    const siteLocation = input.siteLocation?.trim();
    const description = input.description?.trim();
    let serviceType = input.serviceType?.trim();
    const serviceId = input.serviceId?.trim() || null;

    if (serviceId) {
      const service = await this.prisma.service.findFirst({
        where: { id: serviceId, organizationId: user.organizationId },
      });

      if (!service) {
        throw new BadRequestException('Selected service was not found');
      }

      serviceType = serviceType || service.name;
    }

    if (!customerName || !contactPhone || !siteLocation || !description) {
      throw new BadRequestException('Customer name, contact phone, site location, and description are required');
    }

    if (!serviceType) {
      throw new BadRequestException('Service type is required');
    }

    return {
      serviceId,
      source: this.parseRequestSource(input.source ?? 'admin_created'),
      customerName,
      contactPhone,
      serviceType,
      siteLocation,
      preferredDate: this.parseDate(input.preferredDate),
      description,
      urgency: this.parseRequestUrgency(input.urgency ?? 'normal'),
      status: input.status ? this.parseRequestStatus(input.status) : RequestStatus.SUBMITTED,
      quoteAmount: this.normalizeNumber(input.quoteAmount),
      notes: input.notes?.trim() || null,
    };
  }

  private normalizeNumber(value?: number) {
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
      return null;
    }

    return Number(value);
  }

  private parseDate(value?: string) {
    if (!value?.trim()) {
      return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Preferred date is invalid');
    }

    return date;
  }

  private parsePositiveInt(value: string | undefined, fallback: number) {
    const parsedValue = Number(value);

    if (!Number.isInteger(parsedValue) || parsedValue < 1) {
      return fallback;
    }

    return parsedValue;
  }

  private parseRequestSource(source: string) {
    const normalizedSource = source.trim().replace(/[\s-]+/g, '_').toUpperCase();

    if (!Object.values(RequestSource).includes(normalizedSource as RequestSource)) {
      throw new BadRequestException('Invalid request source');
    }

    return normalizedSource as RequestSource;
  }

  private parseRequestStatus(status: string) {
    const normalizedStatus = status.trim().replace(/[\s-]+/g, '_').toUpperCase();

    if (!Object.values(RequestStatus).includes(normalizedStatus as RequestStatus)) {
      throw new BadRequestException('Invalid request status');
    }

    return normalizedStatus as RequestStatus;
  }

  private parseRequestUrgency(urgency: string) {
    const normalizedUrgency = urgency.trim().replace(/[\s-]+/g, '_').toUpperCase();

    if (!Object.values(RequestUrgency).includes(normalizedUrgency as RequestUrgency)) {
      throw new BadRequestException('Invalid request urgency');
    }

    return normalizedUrgency as RequestUrgency;
  }

  private toResponse(request: {
    id: string;
    organizationId: string;
    serviceId: string | null;
    source: RequestSource;
    customerName: string;
    contactPhone: string;
    serviceType: string;
    siteLocation: string;
    preferredDate: Date | null;
    description: string;
    urgency: RequestUrgency;
    status: RequestStatus;
    quoteAmount: number | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    service?: { id: string; name: string; category: string } | null;
  }) {
    return {
      ...request,
      source: request.source.toString().toLowerCase(),
      urgency: request.urgency.toString().toLowerCase(),
      status: request.status.toString().toLowerCase(),
      service: request.service
        ? {
            id: request.service.id,
            name: request.service.name,
            category: request.service.category.toString().toLowerCase(),
          }
        : null,
    };
  }
}
