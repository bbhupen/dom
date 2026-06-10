import { ServiceRequest } from '../domain';
import { RequestsService } from './requests.service';
export declare class RequestsController {
    private readonly requestsService;
    constructor(requestsService: RequestsService);
    findAll(): ServiceRequest[];
    findOne(id: string): ServiceRequest;
    create(request: Omit<ServiceRequest, 'id' | 'createdAt'>): ServiceRequest;
    updateStatus(id: string, status: ServiceRequest['status']): ServiceRequest;
}
