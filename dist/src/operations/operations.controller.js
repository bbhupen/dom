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
exports.OperationsController = void 0;
const common_1 = require("@nestjs/common");
const data_store_1 = require("../data.store");
let OperationsController = class OperationsController {
    summary() {
        return {
            openRequests: data_store_1.serviceRequests.filter((request) => ['submitted', 'under_review', 'more_info_required', 'quote_sent'].includes(request.status)).length,
            scheduledMissions: data_store_1.missions.filter((mission) => ['planned', 'approved', 'scheduled', 'assigned'].includes(mission.status)).length,
            activeDrones: data_store_1.drones.filter((drone) => drone.status === 'active').length,
            availablePilots: data_store_1.pilots.filter((pilot) => pilot.status === 'available').length,
        };
    }
};
exports.OperationsController = OperationsController;
__decorate([
    (0, common_1.Get)('summary'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OperationsController.prototype, "summary", null);
exports.OperationsController = OperationsController = __decorate([
    (0, common_1.Controller)('operations')
], OperationsController);
//# sourceMappingURL=operations.controller.js.map