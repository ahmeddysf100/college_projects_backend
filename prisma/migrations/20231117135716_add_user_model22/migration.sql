/*
  Warnings:

  - A unique constraint covering the columns `[imageUrl]` on the table `ashkal` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ashkal_imageUrl_key" ON "ashkal"("imageUrl");
