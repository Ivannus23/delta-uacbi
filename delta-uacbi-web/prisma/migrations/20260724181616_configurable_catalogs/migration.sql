-- DropIndex
DROP INDEX "ScoreRule_editionId_category_position_key";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "scoreCategory",
ADD COLUMN     "scoreCategoryId" TEXT;

-- AlterTable
ALTER TABLE "Member" DROP COLUMN "academicProgram",
DROP COLUMN "academicUnit",
ADD COLUMN     "academicProgramDefId" TEXT NOT NULL,
ADD COLUMN     "academicUnitDefId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ScoreRule" DROP COLUMN "category",
ADD COLUMN     "scoreCategoryId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Team" DROP COLUMN "responsableAcademicProgram",
DROP COLUMN "responsableAcademicUnit",
DROP COLUMN "unidadAcademica",
ADD COLUMN     "responsableAcademicProgramDefId" TEXT,
ADD COLUMN     "responsableAcademicUnitDefId" TEXT;

-- DropEnum
DROP TYPE "AcademicProgram";

-- DropEnum
DROP TYPE "AcademicUnit";

-- DropEnum
DROP TYPE "ScoreCategory";

-- CreateTable
CREATE TABLE "TeamNameOption" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TeamNameOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreCategoryDef" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "colorHex" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ScoreCategoryDef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicUnitDef" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AcademicUnitDef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicProgramDef" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "academicUnitDefId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AcademicProgramDef_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeamNameOption_editionId_idx" ON "TeamNameOption"("editionId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamNameOption_editionId_name_key" ON "TeamNameOption"("editionId", "name");

-- CreateIndex
CREATE INDEX "ScoreCategoryDef_editionId_idx" ON "ScoreCategoryDef"("editionId");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreCategoryDef_editionId_code_key" ON "ScoreCategoryDef"("editionId", "code");

-- CreateIndex
CREATE INDEX "AcademicUnitDef_editionId_idx" ON "AcademicUnitDef"("editionId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicUnitDef_editionId_code_key" ON "AcademicUnitDef"("editionId", "code");

-- CreateIndex
CREATE INDEX "AcademicProgramDef_editionId_idx" ON "AcademicProgramDef"("editionId");

-- CreateIndex
CREATE INDEX "AcademicProgramDef_academicUnitDefId_idx" ON "AcademicProgramDef"("academicUnitDefId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicProgramDef_editionId_code_key" ON "AcademicProgramDef"("editionId", "code");

-- CreateIndex
CREATE INDEX "Event_scoreCategoryId_idx" ON "Event"("scoreCategoryId");

-- CreateIndex
CREATE INDEX "ScoreRule_scoreCategoryId_idx" ON "ScoreRule"("scoreCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreRule_editionId_scoreCategoryId_position_key" ON "ScoreRule"("editionId", "scoreCategoryId", "position");

-- AddForeignKey
ALTER TABLE "TeamNameOption" ADD CONSTRAINT "TeamNameOption_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "CulturalEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreCategoryDef" ADD CONSTRAINT "ScoreCategoryDef_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "CulturalEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicUnitDef" ADD CONSTRAINT "AcademicUnitDef_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "CulturalEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicProgramDef" ADD CONSTRAINT "AcademicProgramDef_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "CulturalEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicProgramDef" ADD CONSTRAINT "AcademicProgramDef_academicUnitDefId_fkey" FOREIGN KEY ("academicUnitDefId") REFERENCES "AcademicUnitDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_responsableAcademicUnitDefId_fkey" FOREIGN KEY ("responsableAcademicUnitDefId") REFERENCES "AcademicUnitDef"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_responsableAcademicProgramDefId_fkey" FOREIGN KEY ("responsableAcademicProgramDefId") REFERENCES "AcademicProgramDef"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_academicUnitDefId_fkey" FOREIGN KEY ("academicUnitDefId") REFERENCES "AcademicUnitDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_academicProgramDefId_fkey" FOREIGN KEY ("academicProgramDefId") REFERENCES "AcademicProgramDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_scoreCategoryId_fkey" FOREIGN KEY ("scoreCategoryId") REFERENCES "ScoreCategoryDef"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreRule" ADD CONSTRAINT "ScoreRule_scoreCategoryId_fkey" FOREIGN KEY ("scoreCategoryId") REFERENCES "ScoreCategoryDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

