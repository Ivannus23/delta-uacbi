-- CreateEnum
CREATE TYPE "RegistrationFeeMode" AS ENUM ('FREE', 'FIXED');

-- CreateEnum
CREATE TYPE "TeamPaymentStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'EXPIRED');

-- AlterTable
ALTER TABLE "CulturalEdition" ADD COLUMN     "registrationFeeAmount" DECIMAL(10,2),
ADD COLUMN     "registrationFeeMode" "RegistrationFeeMode" NOT NULL DEFAULT 'FREE';

-- CreateTable
CREATE TABLE "OrganizationMercadoPagoAccount" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "mercadoPagoUserId" TEXT NOT NULL,
    "accessTokenEnc" TEXT NOT NULL,
    "refreshTokenEnc" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMercadoPagoAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamPayment" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "TeamPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "providerPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMercadoPagoAccount_organizationId_key" ON "OrganizationMercadoPagoAccount"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamPayment_publicToken_key" ON "TeamPayment"("publicToken");

-- CreateIndex
CREATE UNIQUE INDEX "TeamPayment_providerPaymentId_key" ON "TeamPayment"("providerPaymentId");

-- CreateIndex
CREATE INDEX "TeamPayment_editionId_idx" ON "TeamPayment"("editionId");

-- CreateIndex
CREATE INDEX "TeamPayment_teamId_idx" ON "TeamPayment"("teamId");

-- AddForeignKey
ALTER TABLE "OrganizationMercadoPagoAccount" ADD CONSTRAINT "OrganizationMercadoPagoAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPayment" ADD CONSTRAINT "TeamPayment_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "CulturalEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPayment" ADD CONSTRAINT "TeamPayment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

