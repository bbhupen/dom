"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PilotsModule = void 0;
const common_1 = require("@nestjs/common");
const pilots_controller_1 = require("./pilots.controller");
const pilots_service_1 = require("./pilots.service");
let PilotsModule = class PilotsModule {
};
exports.PilotsModule = PilotsModule;
exports.PilotsModule = PilotsModule = __decorate([
    (0, common_1.Module)({
        controllers: [pilots_controller_1.PilotsController],
        providers: [pilots_service_1.PilotsService],
    })
], PilotsModule);
//# sourceMappingURL=pilots.module.js.map