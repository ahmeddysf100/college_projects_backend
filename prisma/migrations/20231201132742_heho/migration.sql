/*
  Warnings:

  - You are about to drop the column `questionId` on the `Question` table. All the data in the column will be lost.
  - Added the required column `subjectId` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_questionId_fkey";

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "questionId",
ADD COLUMN     "subjectId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
