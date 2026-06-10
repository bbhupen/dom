"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FleetService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let FleetService = class FleetService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findDrones(user, options = {}) {
        this.assertOrganizationFleetAccess(user);
        const page = this.parsePositiveInt(options.page, 1);
        const pageSize = Math.min(this.parsePositiveInt(options.pageSize, 10), 100);
        const search = options.search?.trim();
        const searchStatus = search ? this.tryParseDroneStatus(search) : null;
        const where = {
            organizationId: user.organizationId,
            ...(search
                ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { manufacturer: { contains: search, mode: 'insensitive' } },
                        { model: { contains: search, mode: 'insensitive' } },
                        { serialNumber: { contains: search, mode: 'insensitive' } },
                        { uin: { contains: search, mode: 'insensitive' } },
                        { category: { contains: search, mode: 'insensitive' } },
                        ...(searchStatus ? [{ status: searchStatus }] : []),
                    ],
                }
                : {}),
        };
        const [drones, total, activeCount, maintenanceCount, totalFlightHours] = await Promise.all([
            this.prisma.drone.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            this.prisma.drone.count({ where }),
            this.prisma.drone.count({
                where: { organizationId: user.organizationId, status: client_1.DroneStatus.ACTIVE },
            }),
            this.prisma.drone.count({
                where: { organizationId: user.organizationId, status: client_1.DroneStatus.UNDER_MAINTENANCE },
            }),
            this.prisma.drone.aggregate({
                where: { organizationId: user.organizationId },
                _sum: { totalFlightHours: true },
            }),
        ]);
        return {
            items: drones.map((drone) => this.toResponse(drone)),
            meta: {
                page,
                pageSize,
                total,
                totalPages: Math.max(1, Math.ceil(total / pageSize)),
            },
            summary: {
                activeCount,
                maintenanceCount,
                totalFlightHours: totalFlightHours._sum.totalFlightHours ?? 0,
            },
        };
    }
    async findDrone(user, id) {
        this.assertOrganizationFleetAccess(user);
        const drone = await this.prisma.drone.findFirst({
            where: {
                id,
                organizationId: user.organizationId,
            },
        });
        if (!drone) {
            throw new common_1.NotFoundException(`Drone ${id} was not found`);
        }
        return this.toResponse(drone);
    }
    async createDrone(user, input) {
        this.assertOrganizationFleetAccess(user);
        const name = input.name?.trim();
        const manufacturer = input.manufacturer?.trim();
        const model = input.model?.trim();
        const serialNumber = input.serialNumber?.trim();
        if (!name || !manufacturer || !model || !serialNumber) {
            throw new common_1.BadRequestException('Name, manufacturer, model, and serial number are required');
        }
        try {
            const drone = await this.prisma.drone.create({
                data: {
                    organizationId: user.organizationId,
                    name,
                    manufacturer,
                    model,
                    serialNumber,
                    uin: input.uin?.trim() || null,
                    category: input.category?.trim() || null,
                    weightKg: this.normalizeNumber(input.weightKg),
                    payloadCapacityKg: this.normalizeNumber(input.payloadCapacityKg),
                    notes: input.notes?.trim() || null,
                },
            });
            return this.toResponse(drone);
        }
        catch (error) {
            if (this.isUniqueConstraintError(error)) {
                throw new common_1.ConflictException('A drone with this serial number already exists');
            }
            throw error;
        }
    }
    async updateDrone(user, id, input) {
        this.assertOrganizationFleetAccess(user);
        await this.findDrone(user, id);
        const name = input.name?.trim();
        const manufacturer = input.manufacturer?.trim();
        const model = input.model?.trim();
        const serialNumber = input.serialNumber?.trim();
        if (!name || !manufacturer || !model || !serialNumber) {
            throw new common_1.BadRequestException('Name, manufacturer, model, and serial number are required');
        }
        try {
            const drone = await this.prisma.drone.update({
                where: { id },
                data: {
                    name,
                    manufacturer,
                    model,
                    serialNumber,
                    uin: input.uin?.trim() || null,
                    category: input.category?.trim() || null,
                    weightKg: this.normalizeNumber(input.weightKg),
                    payloadCapacityKg: this.normalizeNumber(input.payloadCapacityKg),
                    notes: input.notes?.trim() || null,
                },
            });
            return this.toResponse(drone);
        }
        catch (error) {
            if (this.isUniqueConstraintError(error)) {
                throw new common_1.ConflictException('A drone with this serial number already exists');
            }
            throw error;
        }
    }
    async updateDroneStatus(user, id, status) {
        this.assertOrganizationFleetAccess(user);
        await this.findDrone(user, id);
        const droneStatus = this.parseDroneStatus(status);
        const drone = await this.prisma.drone.update({
            where: { id },
            data: { status: droneStatus },
        });
        return this.toResponse(drone);
    }
    assertOrganizationFleetAccess(user) {
        if (!['org_owner', 'org_admin', 'maintenance'].includes(user.role)) {
            throw new common_1.ForbiddenException('This account cannot manage organization fleet');
        }
    }
    normalizeNumber(value) {
        if (value === undefined || value === null || Number.isNaN(Number(value))) {
            return null;
        }
        return Number(value);
    }
    parsePositiveInt(value, fallback) {
        const parsedValue = Number(value);
        if (!Number.isInteger(parsedValue) || parsedValue < 1) {
            return fallback;
        }
        return parsedValue;
    }
    isUniqueConstraintError(error) {
        return error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
    }
    parseDroneStatus(status) {
        const normalizedStatus = status.trim().toUpperCase();
        if (!this.isDroneStatus(normalizedStatus)) {
            throw new common_1.BadRequestException('Invalid drone status');
        }
        return normalizedStatus;
    }
    tryParseDroneStatus(status) {
        const normalizedStatus = status.trim().replace(/\s+/g, '_').toUpperCase();
        if (!this.isDroneStatus(normalizedStatus)) {
            return null;
        }
        return normalizedStatus;
    }
    isDroneStatus(status) {
        return Object.values(client_1.DroneStatus).includes(status);
    }
    toResponse(drone) {
        return {
            ...drone,
            status: drone.status.toString().toLowerCase(),
        };
    }
};
exports.FleetService = FleetService;
exports.FleetService = FleetService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FleetService);
//# sourceMappingURL=fleet.service.js.map