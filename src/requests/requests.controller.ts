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
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.requestsService.findAll(user, { page, pageSize, search, status, urgency });
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
}
