const queries = require("../queries/queries.js");
const { Router } = require("express");
const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const userId = req.userId;
    const chats = await queries.getGroupChats(userId);
    res.status(200).send(chats);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const userId = req.userId;
    const chat = await queries.createGroupChat(userId);
    res.status(201).send({ chat: chat });
  } catch (err) {
    next(err);
  }
});
module.exports = router;
