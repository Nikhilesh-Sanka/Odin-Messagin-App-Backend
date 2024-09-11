const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const jsw = require("jsonwebtoken");

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
    jsw.verify(token, process.env.TOKEN_SECRET, (err, payload) => {
      if (err) return res.sendStatus(403);
      req.userId = payload.userId;
      next();
    });
  } catch (err) {
    next(err);
  }
});

/* user routes */
app.use("/user/status", statusRouter);
app.use("/user/profile", profileRouter);
app.use("/user/request", requestRouter);
app.use("/user/chats", chatsRouter);
app.use("/user/chat", chatRouter);
app.use("/user/searchPeople", searchPeopleRouter);

/* handling the server errors */
app.use((err, req, res, next) => {
  console.log(err);
  res.sendStatus(500);
});

/******************************************************* SOCKET **********************************************************/
io.on("connection", (socket) => {
  socket.on("join-chat", (room) => {
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });
    socket.join(room);
  });
  socket.on("send-message", (message, room) => {
    socket.broadcast.to(room).emit("receive-message", message);
  });
});

httpServer.listen(process.env.PORT, () => {
  console.log("server started");
});
