const { Router } = require("express");
const router = Router();
const { body, validationResult } = require("express-validator");
const { PrismaClient } = require("@prisma/client");
const queries = require("../queries/queries.js");
const jsw = require("jsonwebtoken");

// configuring the environment variables
require("dotenv").config();

const prisma = new PrismaClient();

const validateUserInputs = [
  body("username").custom(async (value) => {
    const results = await prisma.user.findMany({
      where: {
        username: value,
      },
    });
    if (results.length === 0) {
      return true;
    }
    throw new Error("username already exists");
  }),
];

router.post("/", validateUserInputs, async (req, res, next) => {
  try {
    const errors = validationResult(req).errors;
    if (errors.length === 0) {
      const userId = await queries.addUser(
        req.body["username"],
        req.body["password"],
        req.body["firstName"],
        req.body["lastName"]
      );
      jsw.sign({ userId }, process.env.TOKEN_SECRET, (err, token) => {
        if (err) return res.sendStatus(500);
        res.status(201).json({ token: `bearer ${token}` });
      });
    } else {
      res.status(409).json({ errors });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
