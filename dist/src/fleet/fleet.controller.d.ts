import { AuthService } from '../auth/auth.service';
import { FleetService } from './fleet.service';
export declare class FleetController {
    private readonly authService;
    private readonly fleetService;
    constructor(authService: AuthService, fleetService: FleetService);
    findDrones(authorization?: string): Promise<{
        status: string;
        id: string;
        organizationId: string;
        name: string;
        manufacturer: string;
        model: string;
        serialNumber: string;
        uin: string | null;
        category: string | null;
        weightKg: number | null;
        payloadCapacityKg: number | null;
        totalFlightHours: number;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findDrone(id: string, authorization?: string): Promise<{
        status: string;
        id: string;
        organizationId: string;
        name: string;
        manufacturer: string;
        model: string;
        serialNumber: string;
        uin: string | null;
        category: string | null;
        weightKg: number | null;
        payloadCapacityKg: number | null;
        totalFlightHours: number;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createDrone(body: {
        name?: string;
        manufacturer?: string;
        model?: string;
        serialNumber?: string;
        uin?: string;
        category?: string;
        weightKg?: number;
        payloadCapacityKg?: number;
        notes?: string;
    }, authorization?: string): Promise<{
        status: string;
        id: string;
        organizationId: string;
        name: string;
        manufacturer: string;
        model: string;
        serialNumber: string;
        uin: string | null;
        category: string | null;
        weightKg: number | null;
        payloadCapacityKg: number | null;
        totalFlightHours: number;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
