const { Router } = require("express");
const router = Router();

const queries = require("../queries/queries.js");

router.get("/", async (req, res, next) => {
  try {
    const userId = req.userId;
    const sentRequests = await queries.getSentRequests(userId);
    const receivedRequests = await queries.getReceivedRequests(userId);
    res.status(200).json({ sentRequests, receivedRequests });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const userId = req.userId;
    const friendId = req.body["friendId"];
    await queries.createRequest(userId, friendId);
    res.sendStatus(201);
  } catch (err) {
    next(err);
  }
});

router.delete("/", async (req, res, next) => {
  try {
    const requestId = req.body["requestId"];
    await queries.deleteRequest(requestId);
    res.sendStatus(202);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
