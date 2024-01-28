-- CreateTable
CREATE TABLE "ashkal" (
    "id" SERIAL NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "num_input" INTEGER NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ashkal_pkey" PRIMARY KEY ("id")
);
