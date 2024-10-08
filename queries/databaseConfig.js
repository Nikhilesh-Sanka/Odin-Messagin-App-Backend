const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function addNotificationObjects() {
  console.log("adding notifications objects");
  const users = await prisma.user.findMany({
    select: {
      notifications: true,
      id: true,
    },
  });
  for (let user of users) {
    if (user.notifications === null) {
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
