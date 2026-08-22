-- DropForeignKey
ALTER TABLE "AcademicProgramDef" DROP CONSTRAINT "AcademicProgramDef_academicUnitDefId_fkey";

-- DropForeignKey
ALTER TABLE "AcademicProgramDef" DROP CONSTRAINT "AcademicProgramDef_editionId_fkey";

-- DropForeignKey
ALTER TABLE "AcademicUnitDef" DROP CONSTRAINT "AcademicUnitDef_editionId_fkey";

-- DropForeignKey
ALTER TABLE "Member" DROP CONSTRAINT "Member_academicProgramDefId_fkey";

-- DropForeignKey
ALTER TABLE "Member" DROP CONSTRAINT "Member_academicUnitDefId_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_responsableAcademicProgramDefId_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_responsableAcademicUnitDefId_fkey";

-- AlterTable
ALTER TABLE "Member" DROP COLUMN "academicProgramDefId",
DROP COLUMN "academicUnitDefId",
ADD COLUMN     "academicProgramCode" TEXT NOT NULL,
ADD COLUMN     "academicUnitCode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Team" DROP COLUMN "responsableAcademicProgramDefId",
DROP COLUMN "responsableAcademicUnitDefId",
ADD COLUMN     "responsableAcademicProgramCode" TEXT,
ADD COLUMN     "responsableAcademicUnitCode" TEXT;

-- DropTable
DROP TABLE "AcademicProgramDef";

-- DropTable
DROP TABLE "AcademicUnitDef";

