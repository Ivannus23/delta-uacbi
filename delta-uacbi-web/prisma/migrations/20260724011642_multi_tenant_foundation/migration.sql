-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('ADMIN', 'STAFF');

-- DropIndex
DROP INDEX "CulturalEdition_year_key";

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "editionId" TEXT;

-- AlterTable
ALTER TABLE "CulturalEdition" ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "OrganizationMembership_organizationId_idx" ON "OrganizationMembership"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMembership_userId_organizationId_key" ON "OrganizationMembership"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "AuditLog_editionId_idx" ON "AuditLog"("editionId");

-- CreateIndex
CREATE INDEX "CulturalEdition_organizationId_idx" ON "CulturalEdition"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "CulturalEdition_organizationId_year_key" ON "CulturalEdition"("organizationId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "CulturalEdition_organizationId_slug_key" ON "CulturalEdition"("organizationId", "slug");

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturalEdition" ADD CONSTRAINT "CulturalEdition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "CulturalEdition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

