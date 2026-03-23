-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STAFF', 'JEFE_GRUPO');

-- CreateEnum
CREATE TYPE "TeamStatus" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('DEPORTIVA', 'CULTURAL', 'RECREATIVA', 'ACADEMICA', 'VIDEOJUEGO', 'OTRA');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('BORRADOR', 'ABIERTA', 'CERRADA', 'FINALIZADA');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "ScoreCategory" AS ENUM ('TOPACIO', 'DIAMANTE', 'ESMERALDA');

-- CreateEnum
CREATE TYPE "ScorePosition" AS ENUM ('PRIMER_LUGAR', 'SEGUNDO_LUGAR', 'TERCER_LUGAR', 'PARTICIPACION', 'PENALIZACION');

-- CreateEnum
CREATE TYPE "ScoreMovementType" AS ENUM ('SUMA', 'RESTA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CulturalEdition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CulturalEdition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "unidadAcademica" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "animal" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "responsableNombre" TEXT NOT NULL,
    "responsableTelefono" TEXT,
    "responsableCorreo" TEXT NOT NULL,
    "status" "TeamStatus" NOT NULL DEFAULT 'PENDIENTE',
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "institutionalEmail" TEXT NOT NULL,
    "gradoGrupo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "scoreCategory" "ScoreCategory" NOT NULL,
    "place" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "description" TEXT,
    "teamCapacity" INTEGER,
    "memberCapacity" INTEGER,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "status" "EventStatus" NOT NULL DEFAULT 'BORRADOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "memberId" TEXT,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDIENTE',
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreRule" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "category" "ScoreCategory" NOT NULL,
    "position" "ScorePosition" NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoreRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreLog" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "eventId" TEXT,
    "teamId" TEXT NOT NULL,
    "movementType" "ScoreMovementType" NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CulturalEdition_year_key" ON "CulturalEdition"("year");

-- CreateIndex
CREATE INDEX "Team_editionId_idx" ON "Team"("editionId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_editionId_name_key" ON "Team"("editionId", "name");

-- CreateIndex
CREATE INDEX "Member_teamId_idx" ON "Member"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Member_teamId_matricula_key" ON "Member"("teamId", "matricula");

-- CreateIndex
CREATE INDEX "Event_editionId_idx" ON "Event"("editionId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_editionId_slug_key" ON "Event"("editionId", "slug");

-- CreateIndex
CREATE INDEX "EventRegistration_eventId_idx" ON "EventRegistration"("eventId");

-- CreateIndex
CREATE INDEX "EventRegistration_teamId_idx" ON "EventRegistration"("teamId");

-- CreateIndex
CREATE INDEX "EventRegistration_memberId_idx" ON "EventRegistration"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreRule_editionId_category_position_key" ON "ScoreRule"("editionId", "category", "position");

-- CreateIndex
CREATE INDEX "ScoreLog_editionId_idx" ON "ScoreLog"("editionId");

-- CreateIndex
CREATE INDEX "ScoreLog_teamId_idx" ON "ScoreLog"("teamId");

-- CreateIndex
CREATE INDEX "ScoreLog_eventId_idx" ON "ScoreLog"("eventId");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "CulturalEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "CulturalEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreRule" ADD CONSTRAINT "ScoreRule_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "CulturalEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreLog" ADD CONSTRAINT "ScoreLog_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "CulturalEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreLog" ADD CONSTRAINT "ScoreLog_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreLog" ADD CONSTRAINT "ScoreLog_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreLog" ADD CONSTRAINT "ScoreLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
