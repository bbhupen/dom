"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissionsService = void 0;
const common_1 = require("@nestjs/common");
const data_store_1 = require("../data.store");
let MissionsService = class MissionsService {
    findAll() {
        return data_store_1.missions;
    }
    findOne(id) {
        const mission = data_store_1.missions.find((item) => item.id === id);
        if (!mission) {
            throw new common_1.NotFoundException(`Mission ${id} was not found`);
        }
        return mission;
    }
    create(mission) {
        const nextMission = {
            ...mission,
            id: `MIS-${2001 + data_store_1.missions.length}`,
        };
        data_store_1.missions.unshift(nextMission);
        return nextMission;
    }
};
exports.MissionsService = MissionsService;
exports.MissionsService = MissionsService = __decorate([
    (0, common_1.Injectable)()
], MissionsService);
//# sourceMappingURL=missions.service.js.map