-- DropForeignKey
ALTER TABLE "ashkal" DROP CONSTRAINT "ashkal_authorid_fkey";

-- AlterTable
ALTER TABLE "ashkal" ALTER COLUMN "authorid" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ashkal" ADD CONSTRAINT "ashkal_authorid_fkey" FOREIGN KEY ("authorid") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
