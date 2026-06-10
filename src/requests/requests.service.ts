import { Injectable, NotFoundException } from '@nestjs/common';
import { serviceRequests } from '../data.store';
import { ServiceRequest } from '../domain';

@Injectable()
export class RequestsService {
  findAll() {
    return serviceRequests;
  }

  findOne(id: string) {
    const request = serviceRequests.find((item) => item.id === id);

    if (!request) {
      throw new NotFoundException(`Request ${id} was not found`);
    }

    return request;
  }

  create(request: Omit<ServiceRequest, 'id' | 'createdAt'>) {
    const nextRequest: ServiceRequest = {
      ...request,
      id: `REQ-${1001 + serviceRequests.length}`,
      createdAt: new Date().toISOString(),
    };

    serviceRequests.unshift(nextRequest);
    return nextRequest;
  }

  updateStatus(id: string, status: ServiceRequest['status']) {
    const request = this.findOne(id);
    request.status = status;
    return request;
  }
}
