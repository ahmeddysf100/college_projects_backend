/*
  Warnings:

  - You are about to drop the column `A_imageUrl` on the `Answer` table. All the data in the column will be lost.
  - You are about to drop the column `correctAnswer` on the `Answer` table. All the data in the column will be lost.
  - You are about to drop the column `num_choices` on the `Answer` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Question` table. All the data in the column will be lost.
  - Added the required column `isCorrect` to the `Answer` table without a default value. This is not possible if the table is not empty.
  - Made the column `A_text` on table `Answer` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `correctAnswer` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Answer" DROP COLUMN "A_imageUrl",
DROP COLUMN "correctAnswer",
DROP COLUMN "num_choices",
ADD COLUMN     "isCorrect" BOOLEAN NOT NULL,
ALTER COLUMN "A_text" SET NOT NULL;

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "level",
DROP COLUMN "type",
ADD COLUMN     "correctAnswer" TEXT NOT NULL,
ADD COLUMN     "quizId" INTEGER,
ALTER COLUMN "Q_imageUrl" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Quiz" (
    "id" SERIAL NOT NULL,
    "level" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerExplanation" (
    "id" SERIAL NOT NULL,
    "explanationText" TEXT,
    "A_imageUrl" TEXT,
    "questionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnswerExplanation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnswerExplanation_A_imageUrl_key" ON "AnswerExplanation"("A_imageUrl");

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerExplanation" ADD CONSTRAINT "AnswerExplanation_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
