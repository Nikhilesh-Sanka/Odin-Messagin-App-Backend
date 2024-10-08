const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

require("dotenv").config();

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
      users: {
        some: {
          id: userId,
        },
      },
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
          notifications: true,
        },
      },
      messages: true,
    },
  });

  // updating the notifications of the user
  await prisma.chatNotification.deleteMany({
    where: {
      chatId: chatId,
      notification: {
        userId: userId,
      },
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

const createMessage = async (
  userId,
  chatId,
  text,
  receiverId,
  isOtherUserConnected
) => {
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
  if (!isOtherUserConnected) {
    const result = await prisma.chatNotification.updateMany({
      where: {
        chatId: chatId,
        notification: {
          userId: receiverId,
        },
      },
      data: {
        numOfMessages: {
          increment: 1,
        },
      },
    });
    if (result.count === 0) {
      await prisma.chatNotification.create({
        data: {
          chat: {
            connect: {
              id: chatId,
            },
          },
          notification: {
            connect: {
              userId: receiverId,
            },
          },
        },
      });
    }
  }
};

// group chats related queries
const getGroupChats = async (userId) => {
  const result = await prisma.groupChat.findMany({
    where: {
      OR: [
        {
          ownerId: userId,
        },
        {
          admins: {
            some: {
              id: userId,
            },
          },
        },
        {
          members: {
            some: {
              id: userId,
            },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
    },
  });
  return result;
};

const createGroupChat = async (userId) => {
  const result = await prisma.groupChat.create({
    data: {
      ownerId: userId,
    },
    select: {
      id: true,
      name: true,
    },
  });
  return result;
};

// individual group chat related queries
const getGroupChat = async (userId, groupId) => {
  const result = await prisma.groupChat.findUnique({
    where: {
      id: groupId,
    },
    select: {
      id: true,
      name: true,
      ownerId: true,
      messages: {
        select: {
          id: true,
          text: true,
          time: true,
          user: {
            select: {
              id: true,
              username: true,
              createdGroupChats: {
                where: {
                  id: groupId,
                },
                select: {
                  id: true,
                },
              },
              adminRoledGroupChats: {
                where: {
                  id: groupId,
                },
                select: {
                  id: true,
                },
              },
              memberRoledGroupChats: {
                where: {
                  id: groupId,
                },
                select: {
                  id: true,
                },
              },
            },
          },
        },
      },
      admins: {
        where: {
          id: userId,
        },
        select: {
          id: true,
        },
      },
      members: {
        where: {
          id: userId,
        },
        select: {
          id: true,
        },
      },
    },
  });

  // updating the notifications of the user
  await prisma.groupChatNotification.deleteMany({
    where: {
      groupChatId: groupId,
      notification: {
        userId: userId,
      },
    },
  });

  return result;
};

const changeGroupName = async (newName, groupId, userId) => {
  await prisma.groupChat.update({
    where: {
      id: groupId,
      OR: [
        {
          ownerId: userId,
        },
        {
          admins: {
            some: {
              id: userId,
            },
          },
        },
      ],
    },
    data: {
      name: newName,
    },
  });
};

const deleteGroup = async (groupId, userId) => {
  await prisma.groupChatMessage.deleteMany({
    where: {
      groupChatId: groupId,
      groupChat: {
        ownerId: userId,
      },
    },
  });
  await prisma.groupChat.delete({
    where: {
      id: groupId,
      ownerId: userId,
    },
  });
};

const getUsersToAdd = async (groupId, userId) => {
  const users = await prisma.user.findMany({
    where: {
      NOT: {
        OR: [
          {
            id: userId,
          },
          {
            createdGroupChats: {
              some: {
                id: groupId,
              },
            },
          },
          {
            adminRoledGroupChats: {
              some: {
                id: groupId,
              },
            },
          },
          {
            memberRoledGroupChats: {
              some: {
                id: groupId,
              },
            },
          },
        ],
      },
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
    select: {
      id: true,
      username: true,
      profile: {
        select: {
          image: true,
        },
      },
    },
  });
  return users;
};

const getMembers = async (groupId) => {
  const result = await prisma.groupChat.findUnique({
    where: {
      id: groupId,
    },
    select: {
      owner: {
        select: {
          id: true,
          username: true,
          profile: {
            select: {
              image: true,
            },
          },
        },
      },
      admins: {
        select: {
          id: true,
          username: true,
          profile: {
            select: {
              image: true,
            },
          },
        },
      },
      members: {
        select: {
          id: true,
          username: true,
          profile: {
            select: {
              image: true,
            },
          },
        },
      },
    },
  });
  return result;
};

const addMembers = async (groupId, usersToAdd) => {
  const users = usersToAdd.map((userId) => {
    return { id: userId };
  });
  await prisma.groupChat.update({
    where: {
      id: groupId,
    },
    data: {
      members: {
        connect: users,
      },
    },
  });
};

const removeMember = async (groupId, removedMember, userId) => {
  await prisma.groupChat.update({
    where: {
      id: groupId,
      OR: [
        {
          owner: {
            id: userId,
          },
        },
        {
          admins: {
            some: {
              id: userId,
            },
          },
        },
      ],
    },
    data: {
      admins: {
        disconnect: {
          id: removedMember,
        },
      },
      members: {
        disconnect: {
          id: removedMember,
        },
      },
    },
  });
};

const makeAdmin = async (groupId, memberId, userId) => {
  await prisma.groupChat.update({
    where: {
      id: groupId,
      OR: [
        {
          admins: {
            some: {
              id: userId,
            },
          },
        },
        {
          ownerId: userId,
        },
      ],
      NOT: {
        admins: {
          some: {
            id: memberId,
          },
        },
      },
      members: {
        some: {
          id: memberId,
        },
      },
    },
    data: {
      admins: {
        connect: {
          id: memberId,
        },
      },
      members: {
        disconnect: {
          id: memberId,
        },
      },
    },
  });
};

const suspendAdmin = async (groupId, memberId, userId) => {
  await prisma.groupChat.update({
    where: {
      id: groupId,
      OR: [
        {
          admins: {
            some: {
              id: userId,
            },
          },
        },
        {
          ownerId: userId,
        },
      ],
      admins: {
        some: {
          id: memberId,
        },
      },
      NOT: {
        members: {
          some: {
            id: memberId,
          },
        },
      },
    },
    data: {
      admins: {
        disconnect: {
          id: memberId,
        },
      },
      members: {
        connect: {
          id: memberId,
        },
      },
    },
  });
};

const createGroupMessage = async (groupId, userId, text, connectedUsers) => {
  const date = new Date();
  const dateString = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
  await prisma.groupChatMessage.create({
    data: {
      text: text,
      userId: userId,
      groupChatId: groupId,
      time: dateString,
    },
  });

  // updating the notifications of the not connected users
  await prisma.groupChatNotification.updateMany({
    where: {
      NOT: {
        notification: {
          OR: connectedUsers,
        },
      },
      notification: {
        user: {
          OR: [
            {
              createdGroupChats: {
                some: {
                  id: groupId,
                },
              },
            },
            {
              memberRoledGroupChats: {
                some: {
                  id: groupId,
                },
              },
            },
            {
              adminRoledGroupChats: {
                some: {
                  id: groupId,
                },
              },
            },
          ],
        },
      },
      groupChatId: groupId,
    },
    data: {
      numOfMessages: {
        increment: 1,
      },
    },
  });
  const result = await prisma.notifications.findMany({
    where: {
      user: {
        OR: [
          {
            createdGroupChats: {
              some: {
                id: groupId,
              },
            },
          },
          {
            memberRoledGroupChats: {
              some: {
                id: groupId,
              },
            },
          },
          {
            adminRoledGroupChats: {
              some: {
                id: groupId,
              },
            },
          },
        ],
      },
      NOT: {
        OR: [
          {
            OR: connectedUsers,
          },
          {
            groupChats: {
              some: {
                groupChatId: groupId,
              },
            },
          },
        ],
      },
    },
    select: {
      id: true,
    },
  });
  for (let notification of result) {
    await prisma.groupChatNotification.create({
      data: {
        notificationId: notification.id,
        groupChatId: groupId,
      },
    });
  }
};

const getGroupMembers = async (groupId) => {
  const result = await prisma.groupChat.findUnique({
    where: {
      id: groupId,
    },
    select: {
      owner: {
        select: {
          id: true,
        },
      },
      members: {
        select: {
          id: true,
        },
      },
      admins: {
        select: {
          id: true,
        },
      },
    },
  });
  return [result.owner, ...result.members, ...result.admins];
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
  getGroupChats,
  createGroupChat,
  getGroupChat,
  changeGroupName,
  deleteGroup,
  getUsersToAdd,
  getMembers,
  addMembers,
  removeMember,
  makeAdmin,
  suspendAdmin,
  createGroupMessage,
  getGroupMembers,
};
