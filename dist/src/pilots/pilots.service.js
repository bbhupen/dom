"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PilotsService = void 0;
const common_1 = require("@nestjs/common");
const data_store_1 = require("../data.store");
let PilotsService = class PilotsService {
    findAll() {
        return data_store_1.pilots;
    }
    findOne(id) {
        const pilot = data_store_1.pilots.find((item) => item.id === id);
        if (!pilot) {
            throw new common_1.NotFoundException(`Pilot ${id} was not found`);
        }
        return pilot;
    }
};
exports.PilotsService = PilotsService;
exports.PilotsService = PilotsService = __decorate([
    (0, common_1.Injectable)()
], PilotsService);
//# sourceMappingURL=pilots.service.js.map