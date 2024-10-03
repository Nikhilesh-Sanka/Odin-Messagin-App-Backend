const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const queries = require("./queries/queries.js");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

require("dotenv").config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  },
});

async function main() {
  const result = await prisma.user.updateMany({
    data: {
      status: 0,
    },
  });
  console.log(result);
}

// main();

/* enabling cors for the api */
app.use(cors());

/* processing the json data coming from the request */
app.use(express.json());

/* importing the routers */
const signUpRouter = require("./routes/signUpRoute.js");
const loginRouter = require("./routes/loginRoute.js");
const statusRouter = require("./routes/statusRoute.js");
const profileRouter = require("./routes/profileRoute.js");
const requestRouter = require("./routes/requestRoute.js");
const chatsRouter = require("./routes/chatsRoute.js");
const chatRouter = require("./routes/chatRoute.js");
const groupChatsRouter = require("./routes/groupChatsRoute.js");
const groupChatRouter = require("./routes/groupChatRoute.js");
const searchPeopleRouter = require("./routes/searchPeopleRoute.js");

/* testing the server */
app.get("/", (req, res) => {
  res.send("server is working fine");
});

/* signing up and login routes */
app.use("/sign-up", signUpRouter);
app.use("/login", loginRouter);

/* authorizing user routes */
app.use("/user", (req, res, next) => {
  try {
    const bearerHeader = req.headers["auth"];
    if (!bearerHeader) {
      res.sendStatus(403);
    }
    const token = bearerHeader.split(" ")[1];
    jwt.verify(token, process.env.TOKEN_SECRET, (err, payload) => {
      if (err) return res.sendStatus(403);
      req.userId = payload.userId;
      next();
    });
  } catch (err) {
    next(err);
  }
});

/* user routes */
app.use("/user/details", async (req, res, next) => {
  try {
    const userDetails = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
      select: {
        id: true,
        username: true,
      },
    });
    res.send({ userDetails });
  } catch (err) {
    next(err);
  }
});
app.use("/user/status", statusRouter);
app.use("/user/profile", profileRouter);
app.use("/user/request", requestRouter);
app.use("/user/chats", chatsRouter);
app.use("/user/chat", chatRouter);
app.use("/user/groupChats", groupChatsRouter);
app.use("/user/groupChat", groupChatRouter);
app.use("/user/searchPeople", searchPeopleRouter);

/* handling the server errors */
app.use((err, req, res, next) => {
  console.log(err);
  res.sendStatus(500);
});

/******************************************************* SOCKET **********************************************************/
io.on("connection", (socket) => {
  async function registerUser(token) {
    console.log("socket registered");
    try {
      const { userId } = jwt.verify(
        token.split(" ")[1],
        process.env.TOKEN_SECRET
      );
      const { username } = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
      socket.userId = userId;
      socket.username = username;
    } catch (err) {
      console.log(err);
    }
  }

  registerUser(socket.request._query.token);

  socket.on("join-room", (room) => {
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });
    socket.join(room);
  });

  socket.on("send-message", (message, room) => {
    socket.broadcast.to(room).emit("receive-message", message, socket.userId);
  });

  socket.on("send-group-message", (message, room, userRole) => {
    socket.broadcast
      .to(room)
      .emit(
        "receive-group-message",
        message,
        socket.userId,
        socket.username,
        userRole
      );
  });

  socket.on("disconnect", () => {
    console.log("disconnected");
  });
});

httpServer.listen(process.env.PORT, () => {
  console.log("server started");
});
