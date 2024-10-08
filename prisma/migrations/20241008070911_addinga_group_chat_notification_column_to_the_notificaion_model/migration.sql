-- CreateTable
CREATE TABLE "GroupChatNotification" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "groupChatId" TEXT NOT NULL,
    "numOfMessages" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "GroupChatNotification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GroupChatNotification" ADD CONSTRAINT "GroupChatNotification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupChatNotification" ADD CONSTRAINT "GroupChatNotification_groupChatId_fkey" FOREIGN KEY ("groupChatId") REFERENCES "GroupChat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
