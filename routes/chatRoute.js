const { Router } = require("express");
const router = Router();
const queries = require("../queries/queries.js");

router.get("/", async (req, res, next) => {
  try {
    const chatId = req.query["chatId"];
    const chat = await queries.getChat(chatId, req.userId);
    res.status(200).json(chat);
  } catch (err) {
    next(err);
  }
});

router.post("/message", async (req, res, next) => {
  try {
    const userId = req.userId;
    const chatId = req.body["chatId"];
    const text = req.body["text"];
    await queries.createMessage(userId, chatId, text);
    res.sendStatus(201);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
