const { Router } = require("express");
const router = Router();
const queries = require("../queries/queries.js");

router.get("/", async (req, res, next) => {
  try {
    const searchQuery = req.query["searchQuery"];
    const users = await queries.getUsers(searchQuery, req.userId);
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
});

router.get("/browsePeople", async (req, res, next) => {
  try {
    const userId = req.userId;
    const results = await queries.browsePeople(userId);
    res.status(200).send(results);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
