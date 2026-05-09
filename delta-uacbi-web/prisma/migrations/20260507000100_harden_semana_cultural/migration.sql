-- AlterTable
ALTER TABLE "Member"
  ADD COLUMN "editionMatriculaKey" TEXT,
  ADD COLUMN "editionEmailKey" TEXT;

-- Backfill member keys by active team edition
UPDATE "Member" AS m
SET
  "editionMatriculaKey" = t."editionId" || ':' || LOWER(TRIM(m."matricula")),
  "editionEmailKey" = t."editionId" || ':' || LOWER(TRIM(m."institutionalEmail"))
FROM "Team" AS t
WHERE m."teamId" = t."id";

-- Enforce non-null + uniqueness
ALTER TABLE "Member"
  ALTER COLUMN "editionMatriculaKey" SET NOT NULL,
  ALTER COLUMN "editionEmailKey" SET NOT NULL;

CREATE UNIQUE INDEX "Member_editionMatriculaKey_key" ON "Member"("editionMatriculaKey");
CREATE UNIQUE INDEX "Member_editionEmailKey_key" ON "Member"("editionEmailKey");

-- AlterTable
ALTER TABLE "EventRegistration"
  ADD COLUMN "teamRegistrationKey" TEXT,
  ADD COLUMN "memberRegistrationKey" TEXT;

-- Backfill registration keys
UPDATE "EventRegistration"
SET "teamRegistrationKey" = "eventId" || ':' || "teamId"
WHERE "memberId" IS NULL;

UPDATE "EventRegistration"
SET "memberRegistrationKey" = "eventId" || ':' || "memberId"
WHERE "memberId" IS NOT NULL;

CREATE UNIQUE INDEX "EventRegistration_teamRegistrationKey_key" ON "EventRegistration"("teamRegistrationKey");
CREATE UNIQUE INDEX "EventRegistration_memberRegistrationKey_key" ON "EventRegistration"("memberRegistrationKey");

-- AlterTable
ALTER TABLE "ScoreLog"
  ADD COLUMN "position" "ScorePosition",
  ADD COLUMN "eventPositionKey" TEXT;

CREATE UNIQUE INDEX "ScoreLog_eventPositionKey_key" ON "ScoreLog"("eventPositionKey");

-- AlterTable
ALTER TABLE "AuditLog"
  ADD COLUMN "createdById" TEXT;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Team uniqueness safeguards
CREATE UNIQUE INDEX "Team_editionId_animal_key" ON "Team"("editionId", "animal");
CREATE UNIQUE INDEX "Team_editionId_leaderId_key" ON "Team"("editionId", "leaderId");
