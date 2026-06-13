CREATE TABLE IF NOT EXISTS "CustomServiceCategory" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CustomServiceCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CustomServiceCategory_organizationId_name_key" ON "CustomServiceCategory"("organizationId", "name");
CREATE INDEX IF NOT EXISTS "CustomServiceCategory_organizationId_idx" ON "CustomServiceCategory"("organizationId");

ALTER TABLE "CustomServiceCategory" ADD CONSTRAINT "CustomServiceCategory_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
