export type RequestSource =
  | 'customer_created'
  | 'admin_created'
  | 'website_form'
  | 'whatsapp'
  | 'api'
  | 'partner';

export type RequestStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'more_info_required'
  | 'quote_sent'
  | 'quote_accepted'
  | 'quote_rejected'
  | 'scheduled'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'report_delivered'
  | 'cancelled'
  | 'rejected';

export type MissionStatus =
  | 'draft'
  | 'planned'
  | 'approved'
  | 'scheduled'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'aborted';

export type AssetStatus = 'active' | 'under_maintenance' | 'grounded' | 'retired';

export type UserRole = 'super_admin' | 'org_owner' | 'org_admin' | 'pilot' | 'maintenance' | 'client';

export interface User {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash: string;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface ServiceRequest {
  id: string;
  source: RequestSource;
  customerName: string;
  contactPhone: string;
  serviceType: string;
  siteLocation: string;
  preferredDate: string;
  description: string;
  urgency: 'normal' | 'urgent';
  status: RequestStatus;
  quoteAmount?: number;
  createdAt: string;
}

export interface Mission {
  id: string;
  requestId: string;
  siteLocation: string;
  plannedDate: string;
  assignedPilotId: string;
  assignedDroneId: string;
  riskLevel: 'low' | 'medium' | 'high';
  status: MissionStatus;
}

export interface Drone {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  uin: string;
  category: string;
  status: AssetStatus;
  totalFlightHours: number;
}

export interface Pilot {
  id: string;
  name: string;
  phone: string;
  certificateNumber: string;
  certificateExpiry: string;
  status: 'available' | 'assigned' | 'inactive';
}
