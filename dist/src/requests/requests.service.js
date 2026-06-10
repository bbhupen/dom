"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestsService = void 0;
const common_1 = require("@nestjs/common");
const data_store_1 = require("../data.store");
let RequestsService = class RequestsService {
    findAll() {
        return data_store_1.serviceRequests;
    }
    findOne(id) {
        const request = data_store_1.serviceRequests.find((item) => item.id === id);
        if (!request) {
            throw new common_1.NotFoundException(`Request ${id} was not found`);
        }
        return request;
    }
    create(request) {
        const nextRequest = {
            ...request,
            id: `REQ-${1001 + data_store_1.serviceRequests.length}`,
            createdAt: new Date().toISOString(),
        };
        data_store_1.serviceRequests.unshift(nextRequest);
        return nextRequest;
    }
    updateStatus(id, status) {
        const request = this.findOne(id);
        request.status = status;
        return request;
    }
};
exports.RequestsService = RequestsService;
exports.RequestsService = RequestsService = __decorate([
    (0, common_1.Injectable)()
], RequestsService);
//# sourceMappingURL=requests.service.js.map