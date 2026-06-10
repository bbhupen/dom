"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pilots = exports.drones = exports.missions = exports.serviceRequests = exports.users = void 0;
exports.users = [
    {
        id: 'USR-0001',
        organizationId: 'ORG-0001',
        name: 'Admin User',
        email: 'admin@droneops.in',
        role: 'super_admin',
        passwordHash: 'scrypt:9b6827c67ce625b691095c85b23469ce:3d724c0c073244ae0f7d3d1170fcdb68dc56ba1a8268477844cec5034ee9147138fa062b995b37896b308ad98ef3613d7c3cfc95e27e4a5845990ac180e8e1bd',
        createdAt: '2026-06-10T05:30:00.000Z',
    },
    {
        id: 'USR-0002',
        organizationId: 'ORG-0001',
        name: 'Company Owner',
        email: 'owner@example.com',
        role: 'org_owner',
        passwordHash: 'scrypt:9b6827c67ce625b691095c85b23469ce:3d724c0c073244ae0f7d3d1170fcdb68dc56ba1a8268477844cec5034ee9147138fa062b995b37896b308ad98ef3613d7c3cfc95e27e4a5845990ac180e8e1bd',
        createdAt: '2026-06-10T05:30:00.000Z',
    },
];
exports.serviceRequests = [
    {
        id: 'REQ-1001',
        source: 'customer_created',
        customerName: 'Aarav Solar Pvt Ltd',
        contactPhone: '+91 98765 43210',
        serviceType: 'Solar inspection',
        siteLocation: 'Jaipur, Rajasthan',
        preferredDate: '2026-06-18',
        description: 'Inspect 20 MW solar plant and submit panel anomaly report.',
        urgency: 'normal',
        status: 'under_review',
        quoteAmount: 45000,
        createdAt: '2026-06-09T09:00:00.000Z',
    },
    {
        id: 'REQ-1002',
        source: 'admin_created',
        customerName: 'Metro Infra Works',
        contactPhone: '+91 99887 77665',
        serviceType: 'Construction progress',
        siteLocation: 'Hyderabad, Telangana',
        preferredDate: '2026-06-20',
        description: 'Monthly progress capture for elevated corridor package.',
        urgency: 'urgent',
        status: 'quote_sent',
        quoteAmount: 28000,
        createdAt: '2026-06-09T10:30:00.000Z',
    },
];
exports.missions = [
    {
        id: 'MIS-2001',
        requestId: 'REQ-1001',
        siteLocation: 'Jaipur, Rajasthan',
        plannedDate: '2026-06-18',
        assignedPilotId: 'PIL-3001',
        assignedDroneId: 'DRN-4001',
        riskLevel: 'medium',
        status: 'planned',
    },
];
exports.drones = [
    {
        id: 'DRN-4001',
        name: 'Falcon 01',
        manufacturer: 'AeroFleet',
        model: 'Surveyor X',
        serialNumber: 'AF-SX-0001',
        uin: 'UIN-IND-0001',
        category: 'small',
        status: 'active',
        totalFlightHours: 126,
    },
    {
        id: 'DRN-4002',
        name: 'Falcon 02',
        manufacturer: 'AeroFleet',
        model: 'Mapper Pro',
        serialNumber: 'AF-MP-0007',
        uin: 'UIN-IND-0002',
        category: 'small',
        status: 'under_maintenance',
        totalFlightHours: 212,
    },
];
exports.pilots = [
    {
        id: 'PIL-3001',
        name: 'Rahul Sharma',
        phone: '+91 91234 56789',
        certificateNumber: 'RPC-IND-1022',
        certificateExpiry: '2027-03-31',
        status: 'available',
    },
    {
        id: 'PIL-3002',
        name: 'Meera Iyer',
        phone: '+91 92345 67890',
        certificateNumber: 'RPC-IND-1040',
        certificateExpiry: '2026-12-15',
        status: 'assigned',
    },
];
//# sourceMappingURL=data.store.js.map