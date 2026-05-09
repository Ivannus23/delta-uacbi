/*
  Warnings:

  - Made the column `responsableTelefono` on table `Team` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Team" ALTER COLUMN "name" DROP DEFAULT,
ALTER COLUMN "responsableTelefono" SET NOT NULL;
