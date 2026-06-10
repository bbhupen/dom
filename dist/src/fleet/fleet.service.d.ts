import { AuthUser } from '../domain';
import { PrismaService } from '../prisma/prisma.service';
export declare class FleetService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findDrones(user: AuthUser, options?: {
        page?: string;
        pageSize?: string;
        search?: string;
    }): Promise<{
        items: {
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
        }[];
        meta: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
        summary: {
            activeCount: number;
            maintenanceCount: number;
            totalFlightHours: number;
        };
    }>;
    findDrone(user: AuthUser, id: string): Promise<{
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
    createDrone(user: AuthUser, input: {
        name?: string;
        manufacturer?: string;
        model?: string;
        serialNumber?: string;
        uin?: string;
        category?: string;
        weightKg?: number;
        payloadCapacityKg?: number;
        notes?: string;
    }): Promise<{
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
    updateDrone(user: AuthUser, id: string, input: {
        name?: string;
        manufacturer?: string;
        model?: string;
        serialNumber?: string;
        uin?: string;
        category?: string;
        weightKg?: number;
        payloadCapacityKg?: number;
        notes?: string;
    }): Promise<{
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
    updateDroneStatus(user: AuthUser, id: string, status: string): Promise<{
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
    private assertOrganizationFleetAccess;
    private normalizeNumber;
    private parsePositiveInt;
    private isUniqueConstraintError;
    private parseDroneStatus;
    private tryParseDroneStatus;
    private isDroneStatus;
    private toResponse;
}
