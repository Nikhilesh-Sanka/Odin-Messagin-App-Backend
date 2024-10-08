/*
  Warnings:

  - You are about to drop the column `Notifications` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "Notifications",
ADD COLUMN     "notifications" TEXT NOT NULL DEFAULT '{}';
