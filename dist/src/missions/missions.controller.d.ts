import { Mission } from '../domain';
import { MissionsService } from './missions.service';
export declare class MissionsController {
    private readonly missionsService;
    constructor(missionsService: MissionsService);
    findAll(): Mission[];
    findOne(id: string): Mission;
    create(mission: Omit<Mission, 'id'>): Mission;
}
