const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function addNotificationObjects() {
  console.log("adding notifications objects");
  const result = await prisma.user.findFirst({
    select: {
      notifications: true,
    },
  });
  if (!result.notifications) {
    const users = await prisma.user.findMany({});
    for (let user of users) {
      await prisma.notifications.create({
        data: {
          user: {
            connect: {
              id: user.id,
            },
          },
        },
      });
    }
  }
  console.log("notifications objects added");
}

async function main() {
  await addNotificationObjects();
}

main();
