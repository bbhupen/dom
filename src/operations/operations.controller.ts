import { Controller, Get } from '@nestjs/common';
import { drones, missions, pilots, serviceRequests } from '../data.store';

@Controller('operations')
export class OperationsController {
  @Get('summary')
  summary() {
    return {
      openRequests: serviceRequests.filter((request) =>
        ['submitted', 'under_review', 'more_info_required', 'quote_sent'].includes(request.status),
      ).length,
      scheduledMissions: missions.filter((mission) =>
        ['planned', 'approved', 'scheduled', 'assigned'].includes(mission.status),
      ).length,
      activeDrones: drones.filter((drone) => drone.status === 'active').length,
      availablePilots: pilots.filter((pilot) => pilot.status === 'available').length,
    };
  }
}
