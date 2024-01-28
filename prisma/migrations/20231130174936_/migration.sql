/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `Quiz` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Quiz_title_key" ON "Quiz"("title");
