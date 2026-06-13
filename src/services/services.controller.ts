import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { getAuthUser } from '../auth/auth-context';
import { AuthService } from '../auth/auth.service';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(
    private readonly authService: AuthService,
    private readonly servicesService: ServicesService,
  ) {}

  @Get()
  async findServices(
    @Headers('authorization') authorization?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.servicesService.findServices(user, { page, pageSize, search, category, status });
  }

  @Post()
  async createService(
    @Body()
    body: {
      name?: string;
      category?: string;
      description?: string;
      pricingUnit?: string;
      basePrice?: number;
      currency?: string;
      estimatedDurationMinutes?: number;
      deliverables?: string;
      notes?: string;
    },
    @Headers('authorization') authorization?: string,
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.servicesService.createService(user, body);
  }

  @Patch(':id')
  async updateService(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      category?: string;
      description?: string;
      pricingUnit?: string;
      basePrice?: number;
      currency?: string;
      estimatedDurationMinutes?: number;
      deliverables?: string;
      notes?: string;
    },
    @Headers('authorization') authorization?: string,
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.servicesService.updateService(user, id, body);
  }

  @Patch(':id/status')
  async updateServiceStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.servicesService.updateServiceStatus(user, id, status);
  }

  @Get('custom-categories')
  async listCustomCategories(@Headers('authorization') authorization?: string) {
    const user = await getAuthUser(this.authService, authorization);
    return this.servicesService.listCustomCategories(user);
  }

  @Post('custom-categories')
  async createCustomCategory(
    @Body('name') name: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.servicesService.createCustomCategory(user, name);
  }

  @Delete('custom-categories/:id')
  async deleteCustomCategory(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.servicesService.deleteCustomCategory(user, id);
  }
}
