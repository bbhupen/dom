/*
  Warnings:

  - The values [ADMIN,CUSTOMER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('SUPER_ADMIN', 'ORG_OWNER', 'ORG_ADMIN', 'PILOT', 'MAINTENANCE', 'CLIENT');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING (
  CASE "role"::text
    WHEN 'ADMIN' THEN 'SUPER_ADMIN'
    WHEN 'CUSTOMER' THEN 'ORG_OWNER'
    ELSE "role"::text
  END
)::"UserRole_new";
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
COMMIT;
