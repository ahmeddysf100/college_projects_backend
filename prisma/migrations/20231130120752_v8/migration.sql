/*
  Warnings:

  - You are about to drop the column `name` on the `Subject` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[subject_name]` on the table `Subject` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `subject_name` to the `Subject` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Subject_name_key";

-- AlterTable
ALTER TABLE "Subject" DROP COLUMN "name",
ADD COLUMN     "subject_name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Subject_subject_name_key" ON "Subject"("subject_name");
