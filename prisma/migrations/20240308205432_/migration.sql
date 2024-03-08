/*
  Warnings:

  - A unique constraint covering the columns `[arenaId]` on the table `Arena` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `arenaId` to the `Arena` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Arena" ADD COLUMN     "arenaId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Arena_arenaId_key" ON "Arena"("arenaId");
