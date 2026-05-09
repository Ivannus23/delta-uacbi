-- CreateEnum
CREATE TYPE "AcademicUnit" AS ENUM ('UACBI', 'UAE');

-- AlterTable (safe, nullable first)
ALTER TABLE "Member" ADD COLUMN "academicUnit" "AcademicUnit";

-- AlterTable
ALTER TABLE "Team" ADD COLUMN "responsableAcademicUnit" "AcademicUnit";

-- Backfill Team.responsableAcademicUnit from legacy unidadAcademica when possible
UPDATE "Team"
SET "responsableAcademicUnit" = CASE
  WHEN UPPER("unidadAcademica") = 'UAE' THEN 'UAE'::"AcademicUnit"
  WHEN UPPER("unidadAcademica") = 'UACBI' THEN 'UACBI'::"AcademicUnit"
  ELSE "responsableAcademicUnit"
END
WHERE "responsableAcademicUnit" IS NULL;

-- Backfill Member.academicUnit using current program first, then team responsible unit, then team legacy unit
UPDATE "Member" m
SET "academicUnit" = CASE
  WHEN m."academicProgram" = 'LICENCIATURA_ENFERMERIA'::"AcademicProgram" THEN 'UAE'::"AcademicUnit"
  WHEN t."responsableAcademicUnit" IS NOT NULL THEN t."responsableAcademicUnit"
  WHEN UPPER(t."unidadAcademica") = 'UAE' THEN 'UAE'::"AcademicUnit"
  ELSE 'UACBI'::"AcademicUnit"
END
FROM "Team" t
WHERE m."teamId" = t."id"
  AND m."academicUnit" IS NULL;

-- Backfill missing academicProgram in Member where previous data had NULL
UPDATE "Member" m
SET "academicProgram" = CASE
  WHEN m."academicUnit" = 'UAE'::"AcademicUnit" THEN 'LICENCIATURA_ENFERMERIA'::"AcademicProgram"
  WHEN t."responsableAcademicProgram" IS NOT NULL THEN t."responsableAcademicProgram"
  ELSE 'INGENIERIA_MECANICA'::"AcademicProgram"
END
FROM "Team" t
WHERE m."teamId" = t."id"
  AND m."academicProgram" IS NULL;

-- Enforce required fields after backfill
ALTER TABLE "Member"
ALTER COLUMN "academicUnit" SET NOT NULL,
ALTER COLUMN "academicProgram" SET NOT NULL;
