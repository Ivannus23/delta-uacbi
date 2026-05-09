-- CreateEnum
CREATE TYPE "AcademicProgram" AS ENUM ('INGENIERIA_MECANICA', 'INGENIERIA_CONTROL_COMPUTACION', 'LICENCIATURA_MATEMATICAS', 'INGENIERIA_QUIMICA', 'INGENIERIA_ELECTRONICA', 'LICENCIATURA_ENFERMERIA');

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "academicProgram" "AcademicProgram",
ADD COLUMN     "isLeader" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "responsableAcademicProgram" "AcademicProgram",
ADD COLUMN     "responsableGradoGrupo" TEXT,
ADD COLUMN     "responsableMatricula" TEXT;
