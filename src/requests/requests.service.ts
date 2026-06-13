import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DroneStatus, PilotStatus, Prisma, RequestSource, RequestStatus, RequestUrgency } from '@prisma/client';
import { AuthUser } from '../domain';
import { PrismaService } from '../prisma/prisma.service';

type RequestInput = {
  serviceId?: string;
  source?: string;
  customerName?: string;
  contactPhone?: string;
  serviceType?: string;
  siteLocation?: string;
  siteLat?: number;
  siteLng?: number;
  preferredDate?: string;
  description?: string;
  urgency?: string;
  status?: string;
  quoteAmount?: number;
  invoiceNumber?: string;
  invoiceReady?: boolean;
  assignedPilotId?: string;
  assignedDroneId?: string;
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
      assignedToMe?: string;
    } = {},
  ) {
    this.assertOrganizationRequestAccess(user);
    const page = this.parsePositiveInt(options.page, 1);
    const pageSize = Math.min(this.parsePositiveInt(options.pageSize, 10), 100);
    const search = options.search?.trim();
    const status = options.status ? this.parseRequestStatus(options.status) : undefined;
    const urgency = options.urgency ? this.parseRequestUrgency(options.urgency) : undefined;
    // pilots can only see their own assigned requests — resolve User → Pilot by email
    let pilotFilter: Prisma.ServiceRequestWhereInput = {};
    if (user.role === 'pilot' || options.assignedToMe === 'true') {
      const pilotProfile = await this.prisma.pilot.findFirst({
        where: { organizationId: user.organizationId, email: user.email },
        select: { id: true },
      });
      pilotFilter = { assignedPilotId: pilotProfile?.id ?? '__no_match__' };
    }
    const where: Prisma.ServiceRequestWhereInput = {
      organizationId: user.organizationId,
      ...pilotFilter,
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

    const [requests, total, pendingCount, invoiceReadyCount, assignedCount, urgentCount, inProgressCount] = await Promise.all([
      this.prisma.serviceRequest.findMany({
        where,
        include: { service: true, assignedPilot: true, assignedDrone: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.serviceRequest.count({ where }),
      this.prisma.serviceRequest.count({
        where: { organizationId: user.organizationId, status: RequestStatus.PENDING },
      }),
      this.prisma.serviceRequest.count({
        where: { organizationId: user.organizationId, invoiceReady: true },
      }),
      this.prisma.serviceRequest.count({
        where: { organizationId: user.organizationId, status: RequestStatus.ASSIGNED_TO_PILOT },
      }),
      this.prisma.serviceRequest.count({
        where: { organizationId: user.organizationId, urgency: RequestUrgency.URGENT },
      }),
      this.prisma.serviceRequest.count({
        where: { organizationId: user.organizationId, status: RequestStatus.IN_PROGRESS },
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
        openCount: pendingCount,
        pendingCount,
        inProgressCount,
        invoiceReadyCount,
        assignedCount,
        urgentCount,
        quotedCount: invoiceReadyCount,
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
      include: { service: true, assignedPilot: true, assignedDrone: true },
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
      include: { service: true, assignedPilot: true, assignedDrone: true },
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
      include: { service: true, assignedPilot: true, assignedDrone: true },
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
      include: { service: true, assignedPilot: true, assignedDrone: true },
    });

    return this.toResponse(request);
  }

  async assignPilot(user: AuthUser, id: string, pilotId: string) {
    this.assertAdminAccess(user);
    const existing = await this.findOne(user, id);

    if (!['pending', 'price_calculated'].includes(existing.status as string)) {
      throw new BadRequestException('Request must be in pending or price_calculated status to assign a pilot');
    }

    const pilot = await this.prisma.pilot.findFirst({
      where: { id: pilotId, organizationId: user.organizationId, status: { not: 'SUSPENDED' } },
    });

    if (!pilot) {
      throw new BadRequestException('Selected pilot was not found or is suspended');
    }

    const request = await this.prisma.serviceRequest.update({
      where: { id },
      data: { assignedPilotId: pilotId, status: RequestStatus.ASSIGNED_TO_PILOT },
      include: { service: true, assignedPilot: true, assignedDrone: true },
    });

    return this.toResponse(request);
  }

  async pilotAcceptWithDrone(user: AuthUser, id: string, droneId: string) {
    if (user.role !== 'pilot') {
      throw new ForbiddenException('Only pilots can accept requests');
    }

    const existing = await this.prisma.serviceRequest.findFirst({
      where: { id, organizationId: user.organizationId },
      include: { service: true, assignedPilot: true, assignedDrone: true },
    });

    if (!existing) throw new NotFoundException(`Request ${id} was not found`);

    if (existing.status !== RequestStatus.ASSIGNED_TO_PILOT) {
      throw new BadRequestException('Request must be in assigned_to_pilot status for pilot to accept');
    }

    const pilotProfile = await this.prisma.pilot.findFirst({
      where: { organizationId: user.organizationId, email: user.email },
      select: { id: true },
    });

    const drone = await this.prisma.drone.findFirst({
      where: {
        id: droneId,
        organizationId: user.organizationId,
        status: 'ACTIVE',
        // must be in this pilot's inventory (or unassigned if pilot has no profile yet)
        ...(pilotProfile ? { pilotId: pilotProfile.id } : {}),
      },
    });

    if (!drone) {
      throw new BadRequestException('Selected drone was not found, is not active, or is not in your inventory');
    }

    const now = new Date();
    const request = await this.prisma.serviceRequest.update({
      where: { id },
      data: {
        assignedDroneId: droneId,
        status: RequestStatus.DRONE_ALLOCATED,
        pilotAcceptedAt: now,
        droneAllocatedAt: now,
      },
      include: { service: true, assignedPilot: true, assignedDrone: true },
    });

    return this.toResponse(request);
  }

  async startOperation(user: AuthUser, id: string) {
    if (!['pilot', 'org_admin', 'org_owner', 'super_admin'].includes(user.role)) {
      throw new ForbiddenException('Only pilots or admins can start an operation');
    }

    const existing = await this.prisma.serviceRequest.findFirst({
      where: { id, organizationId: user.organizationId },
      include: { service: true, assignedPilot: true, assignedDrone: true },
    });

    if (!existing) throw new NotFoundException(`Request ${id} was not found`);

    if (existing.status !== RequestStatus.DRONE_ALLOCATED) {
      throw new BadRequestException('Drone must be allocated before starting the operation');
    }

    const request = await this.prisma.serviceRequest.update({
      where: { id },
      data: { status: RequestStatus.IN_PROGRESS, operationStartedAt: new Date() },
      include: { service: true, assignedPilot: true, assignedDrone: true },
    });

    return this.toResponse(request);
  }

  async completeOperation(user: AuthUser, id: string) {
    if (!['pilot', 'org_admin', 'org_owner', 'super_admin'].includes(user.role)) {
      throw new ForbiddenException('Only pilots or admins can complete an operation');
    }

    const existing = await this.prisma.serviceRequest.findFirst({
      where: { id, organizationId: user.organizationId },
      include: { service: true, assignedPilot: true, assignedDrone: true },
    });

    if (!existing) throw new NotFoundException(`Request ${id} was not found`);

    if (existing.status !== RequestStatus.IN_PROGRESS) {
      throw new BadRequestException('Operation must be in progress to complete it');
    }

    const request = await this.prisma.serviceRequest.update({
      where: { id },
      data: { status: RequestStatus.OPERATION_COMPLETED, operationCompletedAt: new Date() },
      include: { service: true, assignedPilot: true, assignedDrone: true },
    });

    return this.toResponse(request);
  }

  async submitReport(user: AuthUser, id: string, reportNotes: string) {
    if (!['pilot', 'org_admin', 'org_owner', 'super_admin'].includes(user.role)) {
      throw new ForbiddenException('Only pilots or admins can submit a report');
    }

    const existing = await this.prisma.serviceRequest.findFirst({
      where: { id, organizationId: user.organizationId },
      include: { service: true, assignedPilot: true, assignedDrone: true },
    });

    if (!existing) throw new NotFoundException(`Request ${id} was not found`);

    if (existing.status !== RequestStatus.OPERATION_COMPLETED) {
      throw new BadRequestException('Operation must be completed before submitting a report');
    }

    if (!reportNotes?.trim()) {
      throw new BadRequestException('Report notes are required');
    }

    const request = await this.prisma.serviceRequest.update({
      where: { id },
      data: {
        status: RequestStatus.REPORT_SUBMITTED,
        reportNotes: reportNotes.trim(),
        reportSubmittedAt: new Date(),
      },
      include: { service: true, assignedPilot: true, assignedDrone: true },
    });

    return this.toResponse(request);
  }

  async generateInvoice(user: AuthUser, id: string, invoiceNumber: string, quoteAmount?: number) {
    this.assertAdminAccess(user);

    const existing = await this.prisma.serviceRequest.findFirst({
      where: { id, organizationId: user.organizationId },
      include: { service: true, assignedPilot: true, assignedDrone: true },
    });

    if (!existing) throw new NotFoundException(`Request ${id} was not found`);

    if (existing.status !== RequestStatus.REPORT_SUBMITTED) {
      throw new BadRequestException('Report must be submitted before generating an invoice');
    }

    if (!invoiceNumber?.trim()) {
      throw new BadRequestException('Invoice number is required');
    }

    const request = await this.prisma.serviceRequest.update({
      where: { id },
      data: {
        status: RequestStatus.INVOICE_GENERATED,
        invoiceNumber: invoiceNumber.trim(),
        invoiceGeneratedAt: new Date(),
        ...(quoteAmount !== undefined ? { quoteAmount: this.normalizeNumber(quoteAmount) } : {}),
      },
      include: { service: true, assignedPilot: true, assignedDrone: true },
    });

    return this.toResponse(request);
  }

  async reviewInvoice(user: AuthUser, id: string) {
    if (!['org_owner', 'super_admin'].includes(user.role)) {
      throw new ForbiddenException('Only the org owner can review invoices');
    }

    const existing = await this.prisma.serviceRequest.findFirst({
      where: { id, organizationId: user.organizationId },
      include: { service: true, assignedPilot: true, assignedDrone: true },
    });

    if (!existing) throw new NotFoundException(`Request ${id} was not found`);

    if (existing.status !== RequestStatus.INVOICE_GENERATED) {
      throw new BadRequestException('Invoice must be generated before it can be reviewed');
    }

    const request = await this.prisma.serviceRequest.update({
      where: { id },
      data: { status: RequestStatus.INVOICE_REVIEWED, invoiceReviewedAt: new Date() },
      include: { service: true, assignedPilot: true, assignedDrone: true },
    });

    return this.toResponse(request);
  }

  async sendInvoice(user: AuthUser, id: string) {
    this.assertAdminAccess(user);

    const existing = await this.prisma.serviceRequest.findFirst({
      where: { id, organizationId: user.organizationId },
      include: { service: true, assignedPilot: true, assignedDrone: true },
    });

    if (!existing) throw new NotFoundException(`Request ${id} was not found`);

    if (existing.status !== RequestStatus.INVOICE_REVIEWED) {
      throw new BadRequestException('Invoice must be reviewed before it can be sent');
    }

    const request = await this.prisma.serviceRequest.update({
      where: { id },
      data: { status: RequestStatus.INVOICE_SENT, invoiceSentAt: new Date() },
      include: { service: true, assignedPilot: true, assignedDrone: true },
    });

    return this.toResponse(request);
  }

  async recordPayment(user: AuthUser, id: string) {
    this.assertAdminAccess(user);

    const existing = await this.prisma.serviceRequest.findFirst({
      where: { id, organizationId: user.organizationId },
      include: { service: true, assignedPilot: true, assignedDrone: true },
    });

    if (!existing) throw new NotFoundException(`Request ${id} was not found`);

    if (existing.status !== RequestStatus.INVOICE_SENT) {
      throw new BadRequestException('Invoice must be sent before recording payment');
    }

    const request = await this.prisma.serviceRequest.update({
      where: { id },
      data: { status: RequestStatus.PAYMENT_RECEIVED, paymentReceivedAt: new Date() },
      include: { service: true, assignedPilot: true, assignedDrone: true },
    });

    return this.toResponse(request);
  }

  async closeRequest(user: AuthUser, id: string) {
    this.assertAdminAccess(user);

    const existing = await this.prisma.serviceRequest.findFirst({
      where: { id, organizationId: user.organizationId },
      include: { service: true, assignedPilot: true, assignedDrone: true },
    });

    if (!existing) throw new NotFoundException(`Request ${id} was not found`);

    if (existing.status !== RequestStatus.PAYMENT_RECEIVED) {
      throw new BadRequestException('Payment must be received before closing the request');
    }

    const request = await this.prisma.serviceRequest.update({
      where: { id },
      data: { status: RequestStatus.CLOSED, closedAt: new Date() },
      include: { service: true, assignedPilot: true, assignedDrone: true },
    });

    return this.toResponse(request);
  }

  private assertOrganizationRequestAccess(user: AuthUser) {
    if (!['super_admin', 'org_owner', 'org_admin', 'maintenance', 'pilot'].includes(user.role)) {
      throw new ForbiddenException('This account cannot manage organization requests');
    }
  }

  private assertAdminAccess(user: AuthUser) {
    if (!['super_admin', 'org_owner', 'org_admin'].includes(user.role)) {
      throw new ForbiddenException('Only admins can perform this action');
    }
  }

  private async toRequestData(user: AuthUser, input: RequestInput) {
    const customerName = input.customerName?.trim();
    const contactPhone = input.contactPhone?.trim();
    const siteLocation = input.siteLocation?.trim();
    const description = input.description?.trim();
    let serviceType = input.serviceType?.trim();
    const serviceId = input.serviceId?.trim() || null;
    const assignedPilotId = input.assignedPilotId?.trim() || null;
    const assignedDroneId = input.assignedDroneId?.trim() || null;

    if (serviceId) {
      const service = await this.prisma.service.findFirst({
        where: { id: serviceId, organizationId: user.organizationId },
      });

      if (!service) {
        throw new BadRequestException('Selected service was not found');
      }

      serviceType = serviceType || service.name;
    }

    if (assignedPilotId) {
      const pilot = await this.prisma.pilot.findFirst({
        where: {
          id: assignedPilotId,
          organizationId: user.organizationId,
          status: { not: PilotStatus.SUSPENDED },
        },
      });

      if (!pilot) {
        throw new BadRequestException('Selected pilot was not found');
      }
    }

    if (assignedDroneId) {
      const drone = await this.prisma.drone.findFirst({
        where: {
          id: assignedDroneId,
          organizationId: user.organizationId,
          status: DroneStatus.ACTIVE,
        },
      });

      if (!drone) {
        throw new BadRequestException('Selected drone was not found');
      }
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
      siteLat: input.siteLat ?? null,
      siteLng: input.siteLng ?? null,
      preferredDate: this.parseDate(input.preferredDate),
      description,
      urgency: this.parseRequestUrgency(input.urgency ?? 'normal'),
      status: input.status ? this.parseRequestStatus(input.status) : RequestStatus.PENDING,
      quoteAmount: this.normalizeNumber(input.quoteAmount),
      invoiceNumber: input.invoiceNumber?.trim() || null,
      invoiceReady: input.invoiceReady ?? false,
      assignedPilotId,
      assignedDroneId,
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
    siteLat: number | null;
    siteLng: number | null;
    preferredDate: Date | null;
    description: string;
    urgency: RequestUrgency;
    status: RequestStatus;
    quoteAmount: number | null;
    invoiceNumber: string | null;
    invoiceReady: boolean;
    assignedPilotId: string | null;
    assignedDroneId: string | null;
    notes: string | null;
    pilotAcceptedAt: Date | null;
    droneAllocatedAt: Date | null;
    operationStartedAt: Date | null;
    operationCompletedAt: Date | null;
    reportNotes: string | null;
    reportSubmittedAt: Date | null;
    invoiceGeneratedAt: Date | null;
    invoiceReviewedAt: Date | null;
    invoiceSentAt: Date | null;
    paymentReceivedAt: Date | null;
    closedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    service?: { id: string; name: string; category: string } | null;
    assignedPilot?: { id: string; name: string; phone: string; status: PilotStatus } | null;
    assignedDrone?: { id: string; name: string; model: string; status: DroneStatus } | null;
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
      assignedPilot: request.assignedPilot
        ? {
            id: request.assignedPilot.id,
            name: request.assignedPilot.name,
            phone: request.assignedPilot.phone,
            status: request.assignedPilot.status.toString().toLowerCase(),
          }
        : null,
      assignedDrone: request.assignedDrone
        ? {
            id: request.assignedDrone.id,
            name: request.assignedDrone.name,
            model: request.assignedDrone.model,
            status: request.assignedDrone.status.toString().toLowerCase(),
          }
        : null,
    };
  }
}
