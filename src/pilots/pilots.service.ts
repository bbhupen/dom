import { Injectable, NotFoundException } from '@nestjs/common';
import { pilots } from '../data.store';

@Injectable()
export class PilotsService {
  findAll() {
    return pilots;
  }

  findOne(id: string) {
    const pilot = pilots.find((item) => item.id === id);

    if (!pilot) {
      throw new NotFoundException(`Pilot ${id} was not found`);
    }

    return pilot;
  }
}
