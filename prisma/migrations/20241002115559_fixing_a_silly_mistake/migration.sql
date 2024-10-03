/*
  Warnings:

  - You are about to drop the column `name` on the `GroupChatMessage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "GroupChat" ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'new group chat';

-- AlterTable
ALTER TABLE "GroupChatMessage" DROP COLUMN "name";
