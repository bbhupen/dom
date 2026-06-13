import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { getAuthUser } from '../auth/auth-context';
import { AuthService } from '../auth/auth.service';
import { PilotsService } from './pilots.service';

@Controller('pilots')
export class PilotsController {
  constructor(
    private readonly authService: AuthService,
    private readonly pilotsService: PilotsService,
  ) {}

  @Get()
  async findAll(
    @Headers('authorization') authorization?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.pilotsService.findAll(user, { page, pageSize, search, status });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    const user = await getAuthUser(this.authService, authorization);
    return this.pilotsService.findOne(user, id);
  }

  @Post()
  async createPilot(
    @Body()
    body: {
      name?: string;
      phone?: string;
      email?: string;
      licenseNumber?: string;
      status?: string;
      notes?: string;
    },
    @Headers('authorization') authorization?: string,
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.pilotsService.createPilot(user, body);
  }

  @Patch(':id')
  async updatePilot(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      phone?: string;
      email?: string;
      licenseNumber?: string;
      status?: string;
      notes?: string;
    },
    @Headers('authorization') authorization?: string,
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.pilotsService.updatePilot(user, id, body);
  }

  @Patch(':id/status')
  async updatePilotStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.pilotsService.updatePilotStatus(user, id, status);
  }
}
