import { Mission } from '../domain';
export declare class MissionsService {
    findAll(): Mission[];
    findOne(id: string): Mission;
    create(mission: Omit<Mission, 'id'>): Mission;
}
