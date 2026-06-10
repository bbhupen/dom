import { ServiceRequest } from '../domain';
export declare class RequestsService {
    findAll(): ServiceRequest[];
    findOne(id: string): ServiceRequest;
    create(request: Omit<ServiceRequest, 'id' | 'createdAt'>): ServiceRequest;
    updateStatus(id: string, status: ServiceRequest['status']): ServiceRequest;
}
