import { Injectable, NotFoundException } from '@nestjs/common';
import { missions } from '../data.store';
import { Mission } from '../domain';

@Injectable()
export class MissionsService {
  findAll() {
    return missions;
  }

  findOne(id: string) {
    const mission = missions.find((item) => item.id === id);

    if (!mission) {
      throw new NotFoundException(`Mission ${id} was not found`);
    }

    return mission;
  }

  create(mission: Omit<Mission, 'id'>) {
    const nextMission: Mission = {
      ...mission,
      id: `MIS-${2001 + missions.length}`,
    };

    missions.unshift(nextMission);
    return nextMission;
  }
}
