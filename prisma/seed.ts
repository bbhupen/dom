import 'dotenv/config';
import { randomBytes, scryptSync } from 'crypto';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl,
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

  console.log(`Seeded super admin user: ${seedConfig.superAdminEmail}`);
  console.log(`Seeded organization owner user: ${seedConfig.orgOwnerEmail}`);
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
