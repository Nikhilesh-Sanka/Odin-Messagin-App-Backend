/*
  Warnings:

  - You are about to drop the column `receivedRequests` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `sentRequests` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "receivedRequests",
DROP COLUMN "sentRequests";

-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "sentUserId" TEXT NOT NULL,
    "receivedUserId" TEXT NOT NULL,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_sentUserId_fkey" FOREIGN KEY ("sentUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_receivedUserId_fkey" FOREIGN KEY ("receivedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
