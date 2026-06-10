-- CreateEnum
CREATE TYPE "DroneStatus" AS ENUM ('ACTIVE', 'UNDER_MAINTENANCE', 'GROUNDED', 'RETIRED');

-- CreateTable
CREATE TABLE "Drone" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "uin" TEXT,
    "category" TEXT,
    "weightKg" DOUBLE PRECISION,
    "payloadCapacityKg" DOUBLE PRECISION,
    "status" "DroneStatus" NOT NULL DEFAULT 'ACTIVE',
    "totalFlightHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Drone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Drone_organizationId_idx" ON "Drone"("organizationId");

-- CreateIndex
CREATE INDEX "Drone_status_idx" ON "Drone"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Drone_organizationId_serialNumber_key" ON "Drone"("organizationId", "serialNumber");

-- AddForeignKey
ALTER TABLE "Drone" ADD CONSTRAINT "Drone_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
