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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FleetController = void 0;
const common_1 = require("@nestjs/common");
const auth_context_1 = require("../auth/auth-context");
const auth_service_1 = require("../auth/auth.service");
const fleet_service_1 = require("./fleet.service");
let FleetController = class FleetController {
    authService;
    fleetService;
    constructor(authService, fleetService) {
        this.authService = authService;
        this.fleetService = fleetService;
    }
    async findDrones(authorization, page, pageSize, search) {
        const user = await (0, auth_context_1.getAuthUser)(this.authService, authorization);
        return this.fleetService.findDrones(user, { page, pageSize, search });
    }
    async findDrone(id, authorization) {
        const user = await (0, auth_context_1.getAuthUser)(this.authService, authorization);
        return this.fleetService.findDrone(user, id);
    }
    async createDrone(body, authorization) {
        const user = await (0, auth_context_1.getAuthUser)(this.authService, authorization);
        return this.fleetService.createDrone(user, body);
    }
    async updateDrone(id, body, authorization) {
        const user = await (0, auth_context_1.getAuthUser)(this.authService, authorization);
        return this.fleetService.updateDrone(user, id, body);
    }
    async updateDroneStatus(id, status, authorization) {
        const user = await (0, auth_context_1.getAuthUser)(this.authService, authorization);
        return this.fleetService.updateDroneStatus(user, id, status);
    }
};
exports.FleetController = FleetController;
__decorate([
    (0, common_1.Get)('drones'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], FleetController.prototype, "findDrones", null);
__decorate([
    (0, common_1.Get)('drones/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FleetController.prototype, "findDrone", null);
__decorate([
    (0, common_1.Post)('drones'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FleetController.prototype, "createDrone", null);
__decorate([
    (0, common_1.Patch)('drones/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], FleetController.prototype, "updateDrone", null);
__decorate([
    (0, common_1.Patch)('drones/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], FleetController.prototype, "updateDroneStatus", null);
exports.FleetController = FleetController = __decorate([
    (0, common_1.Controller)('fleet'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        fleet_service_1.FleetService])
], FleetController);
//# sourceMappingURL=fleet.controller.js.map