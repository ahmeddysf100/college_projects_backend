/*
  Warnings:

  - Changed the type of `arenaQear` on the `Arena` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Arena" DROP COLUMN "arenaQear",
ADD COLUMN     "arenaQear" JSONB NOT NULL;
