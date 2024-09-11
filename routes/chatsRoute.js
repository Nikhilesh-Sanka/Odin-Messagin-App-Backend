const { Router } = require("express");
const router = Router();

const queries = require("../queries/queries.js");

router.get("/", async (req, res, next) => {
  try {
    const userId = req.userId;
    const chats = await queries.getChats(userId);
    res.status(200).json(chats);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const userId = req.userId;
    const friendId = req.body["friendId"];
    const requestId = req.body["requestId"];
    await queries.createChat(userId, friendId, requestId);
    res.sendStatus(201);
  } catch (err) {
    next(err);
  }
});

router.delete("/", async (req, res, next) => {
  try {
    const userId = req.userId;
    const friendId = req.body["friendId"];
    await queries.deleteChat(userId, friendId);
    res.sendStatus(202);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
