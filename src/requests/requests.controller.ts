import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { getAuthUser } from '../auth/auth-context';
import { AuthService } from '../auth/auth.service';
import { RequestsService } from './requests.service';

@Controller('requests')
export class RequestsController {
  constructor(
    private readonly authService: AuthService,
    private readonly requestsService: RequestsService,
  ) {}

  @Get()
  async findAll(
    @Headers('authorization') authorization?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('urgency') urgency?: string,
    @Query('assignedToMe') assignedToMe?: string,
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.requestsService.findAll(user, { page, pageSize, search, status, urgency, assignedToMe });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    const user = await getAuthUser(this.authService, authorization);
    return this.requestsService.findOne(user, id);
  }

  @Post()
  async create(
    @Body()
    body: {
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
      invoiceNumber?: string;
      invoiceReady?: boolean;
      assignedPilotId?: string;
      assignedDroneId?: string;
      notes?: string;
    },
    @Headers('authorization') authorization?: string,
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.requestsService.create(user, body);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body()
    body: {
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
      invoiceNumber?: string;
      invoiceReady?: boolean;
      assignedPilotId?: string;
      assignedDroneId?: string;
      notes?: string;
    },
    @Headers('authorization') authorization?: string,
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.requestsService.update(user, id, body);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.requestsService.updateStatus(user, id, status);
  }

  @Post(':id/assign-pilot')
  async assignPilot(
    @Param('id') id: string,
    @Body('pilotId') pilotId: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.requestsService.assignPilot(user, id, pilotId);
  }

  @Post(':id/accept')
  async pilotAccept(
    @Param('id') id: string,
    @Body('droneId') droneId: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.requestsService.pilotAcceptWithDrone(user, id, droneId);
  }

  @Post(':id/start-operation')
  async startOperation(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.requestsService.startOperation(user, id);
  }

  @Post(':id/complete-operation')
  async completeOperation(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.requestsService.completeOperation(user, id);
  }

  @Post(':id/submit-report')
  async submitReport(
    @Param('id') id: string,
    @Body('reportNotes') reportNotes: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.requestsService.submitReport(user, id, reportNotes);
  }

  @Post(':id/generate-invoice')
  async generateInvoice(
    @Param('id') id: string,
    @Body() body: { invoiceNumber: string; quoteAmount?: number },
    @Headers('authorization') authorization?: string,
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.requestsService.generateInvoice(user, id, body.invoiceNumber, body.quoteAmount);
  }

  @Post(':id/review-invoice')
  async reviewInvoice(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.requestsService.reviewInvoice(user, id);
  }

  @Post(':id/send-invoice')
  async sendInvoice(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.requestsService.sendInvoice(user, id);
  }

  @Post(':id/record-payment')
  async recordPayment(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.requestsService.recordPayment(user, id);
  }

  @Post(':id/close')
  async closeRequest(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.requestsService.closeRequest(user, id);
  }
}
