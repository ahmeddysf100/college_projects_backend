-- CreateTable
CREATE TABLE "Arena" (
    "id" SERIAL NOT NULL,
    "arenaQear" JSONB NOT NULL,
    "roundTime" INTEGER NOT NULL,
    "numOfPlayers" INTEGER NOT NULL,
    "author" TEXT NOT NULL,

    CONSTRAINT "Arena_pkey" PRIMARY KEY ("id")
);
