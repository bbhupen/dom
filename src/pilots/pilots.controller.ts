import { Controller, Get, Param } from '@nestjs/common';
import { PilotsService } from './pilots.service';

@Controller('pilots')
export class PilotsController {
  constructor(private readonly pilotsService: PilotsService) {}

  @Get()
  findAll() {
    return this.pilotsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pilotsService.findOne(id);
  }
}
