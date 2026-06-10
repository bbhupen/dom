import { PilotsService } from './pilots.service';
export declare class PilotsController {
    private readonly pilotsService;
    constructor(pilotsService: PilotsService);
    findAll(): import("../domain").Pilot[];
    findOne(id: string): import("../domain").Pilot;
}
