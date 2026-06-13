DO $$
BEGIN
  CREATE TYPE "PilotStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'OFF_DUTY', 'SUSPENDED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'PRICE_CALCULATED';
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'INVOICE_READY';
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'ASSIGNED_TO_PILOT';

CREATE TABLE IF NOT EXISTS "Pilot" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "licenseNumber" TEXT,
    "status" "PilotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pilot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Pilot_organizationId_phone_key" ON "Pilot"("organizationId", "phone");
CREATE INDEX IF NOT EXISTS "Pilot_organizationId_idx" ON "Pilot"("organizationId");
CREATE INDEX IF NOT EXISTS "Pilot_status_idx" ON "Pilot"("status");

ALTER TABLE "Pilot"
  ADD CONSTRAINT "Pilot_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceRequest"
  ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "invoiceReady" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "assignedPilotId" TEXT,
  ADD COLUMN IF NOT EXISTS "assignedDroneId" TEXT;

CREATE INDEX IF NOT EXISTS "ServiceRequest_assignedPilotId_idx" ON "ServiceRequest"("assignedPilotId");
CREATE INDEX IF NOT EXISTS "ServiceRequest_assignedDroneId_idx" ON "ServiceRequest"("assignedDroneId");

ALTER TABLE "ServiceRequest"
  ADD CONSTRAINT "ServiceRequest_assignedPilotId_fkey"
  FOREIGN KEY ("assignedPilotId") REFERENCES "Pilot"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ServiceRequest"
  ADD CONSTRAINT "ServiceRequest_assignedDroneId_fkey"
  FOREIGN KEY ("assignedDroneId") REFERENCES "Drone"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
