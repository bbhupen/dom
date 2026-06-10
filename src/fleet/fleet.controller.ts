import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { getAuthUser } from '../auth/auth-context';
import { AuthService } from '../auth/auth.service';
import { FleetService } from './fleet.service';

@Controller('fleet')
export class FleetController {
  constructor(
    private readonly authService: AuthService,
    private readonly fleetService: FleetService,
  ) {}

  @Get('drones')
  async findDrones(
    @Headers('authorization') authorization?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.fleetService.findDrones(user, { page, pageSize, search });
  }

  @Get('drones/:id')
  async findDrone(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    const user = await getAuthUser(this.authService, authorization);
    return this.fleetService.findDrone(user, id);
  }

  @Post('drones')
  async createDrone(
    @Body()
    body: {
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
    @Headers('authorization') authorization?: string,
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.fleetService.createDrone(user, body);
  }

  @Patch('drones/:id')
  async updateDrone(
    @Param('id') id: string,
    @Body()
    body: {
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
    @Headers('authorization') authorization?: string,
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.fleetService.updateDrone(user, id, body);
  }

  @Patch('drones/:id/status')
  async updateDroneStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await getAuthUser(this.authService, authorization);
    return this.fleetService.updateDroneStatus(user, id, status);
  }
}
