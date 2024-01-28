/*
  Warnings:

  - You are about to drop the column `quizId` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the `Quiz` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `level` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_quizId_fkey";

-- DropForeignKey
ALTER TABLE "Quiz" DROP CONSTRAINT "Quiz_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "Quiz" DROP CONSTRAINT "Quiz_userId_fkey";

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "quizId",
ADD COLUMN     "level" TEXT NOT NULL;

-- DropTable
DROP TABLE "Quiz";
