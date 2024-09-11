const { Router } = require("express");
const router = Router();
const { PrismaClient } = require("@prisma/client");
const { body, validationResult } = require("express-validator");

const queries = require("../queries/queries.js");
const prisma = new PrismaClient();

router.get("/", async (req, res, next) => {
  try {
    const userId = req.userId;
    const profile = await queries.getProfile(userId);
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
});

// validating the user inputs of the put request
const validateUserInputs = [
  body("username").custom(async (value, { req }) => {
    const result = await prisma.user.findFirst({
      where: {
        username: value,
      },
    });
    if (result) {
      if (result.id === req.userId) {
        return true;
      }
      throw new Error("username already exists");
    }
    return true;
  }),
];

router.put("/", validateUserInputs, async (req, res, next) => {
  try {
    const errors = validationResult(req).errors;
    if (errors.length === 0) {
      await queries.editProfile(
        req.userId,
        req.body["username"],
        req.body["bio"],
        req.body["relationshipStatus"]
      );
      res.sendStatus(201);
    } else {
      res.sendStatus(409);
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
