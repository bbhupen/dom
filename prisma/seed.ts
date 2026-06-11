import 'dotenv/config';
import { randomBytes, scryptSync } from 'crypto';
import { PrismaClient, RequestSource, RequestStatus, RequestUrgency, ServiceCategory, ServicePricingUnit, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl,
    ssl: false,
  }),
});
const organizationId = '00000000-0000-4000-8000-000000000001';

const seedConfig = {
  organizationName: process.env.DEFAULT_ORG_NAME ?? 'DroneOps Platform',
  superAdminName: process.env.DEFAULT_SUPER_ADMIN_NAME ?? 'Super Admin',
  superAdminEmail: process.env.DEFAULT_SUPER_ADMIN_EMAIL ?? 'admin@droneops.in',
  superAdminPassword: process.env.DEFAULT_SUPER_ADMIN_PASSWORD ?? 'password123',
  orgOwnerName: process.env.DEFAULT_ORG_OWNER_NAME ?? 'Company Owner',
  orgOwnerEmail: process.env.DEFAULT_ORG_OWNER_EMAIL ?? 'owner@example.com',
  orgOwnerPassword: process.env.DEFAULT_ORG_OWNER_PASSWORD ?? 'password123',
};

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

async function main() {
  const organization = await prisma.organization.upsert({
    where: { id: organizationId },
    update: {
      name: seedConfig.organizationName,
    },
    create: {
      id: organizationId,
      name: seedConfig.organizationName,
    },
  });

  const superAdminPasswordHash = hashPassword(seedConfig.superAdminPassword);
  const orgOwnerPasswordHash = hashPassword(seedConfig.orgOwnerPassword);

  await prisma.user.upsert({
    where: { email: seedConfig.superAdminEmail },
    update: {
      name: seedConfig.superAdminName,
      role: UserRole.SUPER_ADMIN,
      passwordHash: superAdminPasswordHash,
      organizationId: organization.id,
    },
    create: {
      organizationId: organization.id,
      name: seedConfig.superAdminName,
      email: seedConfig.superAdminEmail,
      role: UserRole.SUPER_ADMIN,
      passwordHash: superAdminPasswordHash,
    },
  });

  await prisma.user.upsert({
    where: { email: seedConfig.orgOwnerEmail },
    update: {
      name: seedConfig.orgOwnerName,
      role: UserRole.ORG_OWNER,
      passwordHash: orgOwnerPasswordHash,
      organizationId: organization.id,
    },
    create: {
      organizationId: organization.id,
      name: seedConfig.orgOwnerName,
      email: seedConfig.orgOwnerEmail,
      role: UserRole.ORG_OWNER,
      passwordHash: orgOwnerPasswordHash,
    },
  });

  const defaultServices = [
    {
      name: 'Aerial Mapping and Orthomosaic',
      category: ServiceCategory.MAPPING_SURVEY,
      description: 'High-resolution site mapping with stitched orthomosaic deliverables.',
      pricingUnit: ServicePricingUnit.PER_ACRE,
      basePrice: 1200,
      estimatedDurationMinutes: 180,
      deliverables: 'Orthomosaic, site images, area coverage summary',
    },
    {
      name: 'Asset Inspection',
      category: ServiceCategory.INSPECTION,
      description: 'Visual inspection for towers, rooftops, solar assets, and industrial sites.',
      pricingUnit: ServicePricingUnit.PER_PROJECT,
      basePrice: 15000,
      estimatedDurationMinutes: 240,
      deliverables: 'Inspection photos, issue notes, annotated report',
    },
    {
      name: 'Crop Health Survey',
      category: ServiceCategory.AGRICULTURE,
      description: 'Field survey for crop condition, irrigation stress, and coverage planning.',
      pricingUnit: ServicePricingUnit.PER_ACRE,
      basePrice: 900,
      estimatedDurationMinutes: 180,
      deliverables: 'Field imagery, health observations, recommended follow-up areas',
    },
    {
      name: 'Aerial Media Capture',
      category: ServiceCategory.MEDIA,
      description: 'Photo and video capture for real estate, events, and brand assets.',
      pricingUnit: ServicePricingUnit.PER_HOUR,
      basePrice: 4500,
      estimatedDurationMinutes: 120,
      deliverables: 'Edited photo set, raw footage, short highlight clips',
    },
    {
      name: 'Progress Monitoring',
      category: ServiceCategory.MONITORING,
      description: 'Recurring construction or site progress capture and comparison.',
      pricingUnit: ServicePricingUnit.PER_DAY,
      basePrice: 18000,
      estimatedDurationMinutes: 360,
      deliverables: 'Progress photos, timeline notes, comparison snapshots',
    },
  ];

  for (const service of defaultServices) {
    await prisma.service.upsert({
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name: service.name,
        },
      },
      update: service,
      create: {
        ...service,
        organizationId: organization.id,
      },
    });
  }

  const assetInspectionService = await prisma.service.findFirst({
    where: { organizationId: organization.id, name: 'Asset Inspection' },
  });
  const progressMonitoringService = await prisma.service.findFirst({
    where: { organizationId: organization.id, name: 'Progress Monitoring' },
  });

  const defaultRequests = [
    {
      customerName: 'Aarav Solar Pvt Ltd',
      contactPhone: '+91 98765 43210',
      serviceType: 'Solar inspection',
      serviceId: assetInspectionService?.id,
      siteLocation: 'Jaipur, Rajasthan',
      preferredDate: new Date('2026-06-18T00:00:00.000Z'),
      description: 'Inspect 20 MW solar plant and submit panel anomaly report.',
      urgency: RequestUrgency.NORMAL,
      status: RequestStatus.UNDER_REVIEW,
      source: RequestSource.CUSTOMER_CREATED,
      quoteAmount: 45000,
    },
    {
      customerName: 'Metro Infra Works',
      contactPhone: '+91 99887 77665',
      serviceType: 'Construction progress',
      serviceId: progressMonitoringService?.id,
      siteLocation: 'Hyderabad, Telangana',
      preferredDate: new Date('2026-06-20T00:00:00.000Z'),
      description: 'Monthly progress capture for elevated corridor package.',
      urgency: RequestUrgency.URGENT,
      status: RequestStatus.QUOTE_SENT,
      source: RequestSource.ADMIN_CREATED,
      quoteAmount: 28000,
    },
  ];

  for (const request of defaultRequests) {
    const existingRequest = await prisma.serviceRequest.findFirst({
      where: {
        organizationId: organization.id,
        customerName: request.customerName,
        siteLocation: request.siteLocation,
      },
    });

    if (existingRequest) {
      await prisma.serviceRequest.update({
        where: { id: existingRequest.id },
        data: request,
      });
    } else {
      await prisma.serviceRequest.create({
        data: {
          ...request,
          organizationId: organization.id,
        },
      });
    }
  }

  console.log(`Seeded super admin user: ${seedConfig.superAdminEmail}`);
  console.log(`Seeded organization owner user: ${seedConfig.orgOwnerEmail}`);
  console.log(`Seeded services: ${defaultServices.length}`);
  console.log(`Seeded requests: ${defaultRequests.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
