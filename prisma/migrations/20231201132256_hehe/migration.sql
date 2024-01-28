/*
  Warnings:

  - Added the required column `questionId` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "questionId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
