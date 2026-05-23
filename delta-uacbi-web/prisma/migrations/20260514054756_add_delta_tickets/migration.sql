-- CreateEnum
CREATE TYPE "TicketEventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TicketOrderStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'EXPIRED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DigitalTicketStatus" AS ENUM ('VALID', 'USED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TicketPaymentProvider" AS ENUM ('MERCADOPAGO', 'SIMULATED');

-- CreateEnum
CREATE TYPE "TicketScanResult" AS ENUM ('VALID', 'USED', 'CANCELLED', 'INVALID', 'NOT_FOUND');

-- CreateTable
CREATE TABLE "TicketEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "imageUrl" TEXT,
    "status" "TicketEventStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketType" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "maxPerOrder" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketOrder" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "buyerEmail" TEXT NOT NULL,
    "buyerPhone" TEXT NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "status" "TicketOrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentProvider" "TicketPaymentProvider" NOT NULL DEFAULT 'SIMULATED',
    "providerPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "ticketTypeId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "TicketOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalTicket" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "ticketTypeId" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "status" "DigitalTicketStatus" NOT NULL DEFAULT 'VALID',
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DigitalTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketScanLog" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "scannedById" TEXT,
    "result" "TicketScanResult" NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketScanLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketAuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TicketEvent_slug_key" ON "TicketEvent"("slug");

-- CreateIndex
CREATE INDEX "TicketEvent_status_eventDate_idx" ON "TicketEvent"("status", "eventDate");

-- CreateIndex
CREATE INDEX "TicketType_eventId_isActive_idx" ON "TicketType"("eventId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TicketType_eventId_name_key" ON "TicketType"("eventId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "TicketOrder_providerPaymentId_key" ON "TicketOrder"("providerPaymentId");

-- CreateIndex
CREATE INDEX "TicketOrder_eventId_status_idx" ON "TicketOrder"("eventId", "status");

-- CreateIndex
CREATE INDEX "TicketOrder_buyerEmail_idx" ON "TicketOrder"("buyerEmail");

-- CreateIndex
CREATE INDEX "TicketOrderItem_orderId_idx" ON "TicketOrderItem"("orderId");

-- CreateIndex
CREATE INDEX "TicketOrderItem_ticketTypeId_idx" ON "TicketOrderItem"("ticketTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketOrderItem_orderId_ticketTypeId_key" ON "TicketOrderItem"("orderId", "ticketTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalTicket_folio_key" ON "DigitalTicket"("folio");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalTicket_qrToken_key" ON "DigitalTicket"("qrToken");

-- CreateIndex
CREATE INDEX "DigitalTicket_eventId_status_idx" ON "DigitalTicket"("eventId", "status");

-- CreateIndex
CREATE INDEX "DigitalTicket_orderId_idx" ON "DigitalTicket"("orderId");

-- CreateIndex
CREATE INDEX "TicketScanLog_ticketId_createdAt_idx" ON "TicketScanLog"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "TicketScanLog_scannedById_idx" ON "TicketScanLog"("scannedById");

-- CreateIndex
CREATE INDEX "TicketAuditLog_entityType_entityId_idx" ON "TicketAuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "TicketAuditLog_createdAt_idx" ON "TicketAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "TicketType" ADD CONSTRAINT "TicketType_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TicketEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketOrder" ADD CONSTRAINT "TicketOrder_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TicketEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketOrderItem" ADD CONSTRAINT "TicketOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TicketOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketOrderItem" ADD CONSTRAINT "TicketOrderItem_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalTicket" ADD CONSTRAINT "DigitalTicket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TicketOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalTicket" ADD CONSTRAINT "DigitalTicket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TicketEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalTicket" ADD CONSTRAINT "DigitalTicket_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketScanLog" ADD CONSTRAINT "TicketScanLog_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "DigitalTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
