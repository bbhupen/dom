import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Mission } from '../domain';
import { MissionsService } from './missions.service';

@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Get()
  findAll() {
    return this.missionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.missionsService.findOne(id);
  }

  @Post()
  create(@Body() mission: Omit<Mission, 'id'>) {
    return this.missionsService.create(mission);
  }
}
