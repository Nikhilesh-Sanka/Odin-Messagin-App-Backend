const queries = require("../queries/queries.js");
const { Router } = require("express");
const router = Router();

// getting a group chat
router.get("/", async (req, res, next) => {
  try {
    const groupId = req.query["id"];
    const chat = await queries.getGroupChat(req.userId, groupId);
    res.status(200).send({ chat: chat });
  } catch (err) {
    next(err);
  }
});

router.put("/", async (req, res, next) => {
  try {
    const newName = req.body["name"];
    const groupId = req.body["groupId"];
    const userId = req.userId;
    await queries.changeGroupName(newName, groupId, userId);
    res.sendStatus(201);
  } catch (err) {
    next(err);
  }
});

router.delete("/", async (req, res, next) => {
  try {
    const groupId = req.body["groupId"];
    const userId = req.userId;
    await queries.deleteGroup(groupId, userId);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

router.get("/addUsers", async (req, res, next) => {
  try {
    const userId = req.userId;
    const groupId = req.query["groupId"];
    const users = await queries.getUsersToAdd(groupId, userId);
    res.status(200).send({ users: users });
  } catch (err) {
    next(err);
  }
});

// members related queries
router.get("/members", async (req, res, next) => {
  try {
    const groupId = req.query["groupId"];
    const { admins, members, owner } = await queries.getMembers(groupId);
    res.status(200).send({ admins, owner, members });
  } catch (err) {
    next(err);
  }
});

router.put("/members", async (req, res, next) => {
  try {
    const groupId = req.body["groupId"];
    const usersToAdd = req.body["usersToAdd"];
    await queries.addMembers(groupId, usersToAdd);
    res.sendStatus(201);
  } catch (err) {
    next(err);
  }
});

router.delete("/members", async (req, res, next) => {
  try {
    const removedMember = req.body["userId"];
    const userId = req.userId;
    const groupId = req.body["groupId"];
    await queries.removeMember(groupId, removedMember, userId);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

router.put("/members/admins", async (req, res, next) => {
  try {
    const memberId = req.body["userId"];
    const groupId = req.body["groupId"];
    const userId = req.userId;
    await queries.makeAdmin(groupId, memberId, userId);
    res.sendStatus(201);
  } catch (err) {
    next(err);
  }
});

router.delete("/members/admins", async (req, res, next) => {
  try {
    const memberId = req.body["userId"];
    const groupId = req.body["groupId"];
    const userId = req.userId;
    await queries.suspendAdmin(groupId, memberId, userId);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

// messages related queries
router.put("/messages", async (req, res, next) => {
  try {
    const groupId = req.body["groupId"];
    const text = req.body["message"];
    const userId = req.userId;
    await queries.createGroupMessage(groupId, userId, text);
    res.sendStatus(201);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
