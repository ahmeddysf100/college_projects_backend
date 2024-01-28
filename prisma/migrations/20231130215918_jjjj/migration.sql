/*
  Warnings:

  - A unique constraint covering the columns `[Q_imageUrl]` on the table `Question` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Question_Q_imageUrl_key" ON "Question"("Q_imageUrl");
