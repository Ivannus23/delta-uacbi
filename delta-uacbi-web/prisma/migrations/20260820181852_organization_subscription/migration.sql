-- CreateEnum
CREATE TYPE "OrganizationSubscriptionStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "subscriptionNotes" TEXT,
ADD COLUMN     "subscriptionPriceAmount" DECIMAL(10,2),
ADD COLUMN     "subscriptionStatus" "OrganizationSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE';

