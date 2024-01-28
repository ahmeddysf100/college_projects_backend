/*
  Warnings:

  - You are about to drop the column `isCorrect` on the `Answer` table. All the data in the column will be lost.
  - Added the required column `correctAnswer` to the `Answer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Answer" DROP COLUMN "isCorrect",
ADD COLUMN     "correctAnswer" TEXT NOT NULL,
ADD COLUMN     "num_choices" TEXT,
ALTER COLUMN "A_text" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "type" TEXT NOT NULL;
