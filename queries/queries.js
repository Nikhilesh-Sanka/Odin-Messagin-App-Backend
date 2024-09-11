const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// user queries
const addUser = async (username, password, firstName, lastName) => {
  const user = await prisma.user.create({
    data: {
      username: username,
      password: password,
      firstName: firstName,
      lastName: lastName,
      profile: {
        create: {},
      },
    },
  });
  return user.id;
};

// profile queries
const getProfile = async (userId) => {
  const results = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      username: true,
      profile: {
        select: {
          image: true,
          bio: true,
          relationshipStatus: true,
        },
      },
    },
  });
  return { username: results.username, ...results.profile };
};

const editProfile = async (
  userId,
  newUsername,
  newBio,
  newRelationshipStatus
) => {
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      username: newUsername,
    },
  });
  await prisma.profile.update({
    where: {
      userId: userId,
    },
    data: {
      bio: newBio,
      relationshipStatus: newRelationshipStatus,
    },
  });
};

// chats queries
const getChats = async (userId) => {
  const chats = await prisma.chat.findMany({
    where: {
      users: {
        some: {
          id: userId,
        },
      },
    },
    select: {
      id: true,
      users: {
        where: {
          NOT: { id: userId },
        },
        select: {
          username: true,
          profile: true,
          status: true,
        },
      },
    },
  });
  const processedChats = [];
  for (let chat of chats) {
    const processedChat = {
      id: chat.id,
      username: chat.users[0].username,
      status: chat.users[0].status,
      receiverProfile: chat.users[0].profile,
    };
    processedChats.push(processedChat);
  }
  return processedChats;
};

const createChat = async (userId, friendId, requestId) => {
  await prisma.request.delete({
    where: {
      id: requestId,
    },
  });
  await prisma.chat.create({
    data: {
      users: {
        connect: [{ id: userId }, { id: friendId }],
      },
    },
  });
};

const deleteChat = async (userId, friendId) => {
  await prisma.chat.delete({
    where: {
      users: {
        EVERY: {
          OR: [{ id: userId }, { id: friendId }],
        },
      },
    },
  });
};

// request queries
const getSentRequests = async (userId) => {
  const requests = await prisma.request.findMany({
    where: {
      sentUserId: userId,
    },
    include: {
      receivedUser: {
        select: {
          id: true,
          username: true,
          profile: true,
        },
      },
    },
  });
  return requests;
};

const getReceivedRequests = async (userId) => {
  const requests = await prisma.request.findMany({
    where: {
      receivedUserId: userId,
    },
    include: {
      sentUser: {
        select: {
          id: true,
          username: true,
          profile: true,
        },
      },
    },
  });
  return requests;
};

const createRequest = async (userId, friendId) => {
  const results = await prisma.request.findFirst({
    where: {
      OR: [
        { AND: [{ sentUserId: userId }, { receivedUserId: friendId }] },
        { AND: [{ sentUserId: friendId }, { receivedUserId: userId }] },
      ],
    },
  });
  if (!results) {
    await prisma.request.create({
      data: {
        sentUserId: userId,
        receivedUserId: friendId,
      },
    });
  }
};

const deleteRequest = async (requestId) => {
  await prisma.request.delete({
    where: {
      id: requestId,
    },
  });
};

// search people queries
const getUsers = async (searchQuery, userId) => {
  const results = await prisma.user.findMany({
    where: {
      NOT: {
        OR: [
          { id: userId },
          {
            chats: {
              some: {
                users: {
                  some: {
                    id: userId,
                  },
                },
              },
            },
          },
        ],
      },
      username: {
        contains: searchQuery,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      username: true,
      profile: true,
      sentRequests: {
        where: {
          receivedUserId: userId,
        },
      },
      receivedRequests: {
        where: {
          sentUserId: userId,
        },
      },
    },
  });
  return results;
};
const browsePeople = async (userId) => {
  const results = await prisma.user.findMany({
    where: {
      NOT: {
        OR: [
          { id: userId },
          {
            chats: {
              some: {
                users: {
                  some: {
                    id: userId,
                  },
                },
              },
            },
          },
        ],
      },
    },
    select: {
      id: true,
      username: true,
      profile: true,
      sentRequests: {
        where: {
          receivedUserId: userId,
        },
      },
      receivedRequests: {
        where: {
          sentUserId: userId,
        },
      },
    },
  });
  return results;
};

// individual chat related queries
const getChat = async (chatId, userId) => {
  const result = await prisma.chat.findUnique({
    where: {
      id: chatId,
    },
    include: {
      users: {
        where: {
          NOT: { id: userId },
        },
        select: {
          id: true,
          username: true,
          profile: true,
        },
      },
      messages: true,
    },
  });
  return {
    id: result.id,
    messages: result.messages,
    clientId: userId,
    receiverId: result.users[0].id,
    receiverName: result.users[0].username,
    receiverProfile: result.users[0].profile,
  };
};

const createMessage = async (userId, chatId, text) => {
  const date = new Date();
  const dateString = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
  await prisma.message.create({
    data: {
      chatId: chatId,
      userId: userId,
      text: text,
      time: dateString,
    },
  });
};

module.exports = {
  addUser,
  getProfile,
  editProfile,
  getChats,
  createChat,
  deleteChat,
  getSentRequests,
  getReceivedRequests,
  createRequest,
  deleteRequest,
  getUsers,
  browsePeople,
  getChat,
  createMessage,
};
