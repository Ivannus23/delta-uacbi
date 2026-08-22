-- AlterTable
ALTER TABLE "CulturalEdition" ADD COLUMN     "bannerImageUrl" TEXT,
ADD COLUMN     "eventLogoUrl" TEXT,
ADD COLUMN     "partnerLogos" JSONB,
ADD COLUMN     "subtitle" TEXT,
ADD COLUMN     "themeName" TEXT;

