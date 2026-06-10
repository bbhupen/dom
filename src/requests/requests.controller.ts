import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ServiceRequest } from '../domain';
import { RequestsService } from './requests.service';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  findAll() {
    return this.requestsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requestsService.findOne(id);
  }

  @Post()
  create(@Body() request: Omit<ServiceRequest, 'id' | 'createdAt'>) {
    return this.requestsService.create(request);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: ServiceRequest['status']) {
    return this.requestsService.updateStatus(id, status);
  }
}
