const { Router } = require("express");
const router = Router();
const { PrismaClient } = require("@prisma/client");
const jsw = require("jsonwebtoken");

const prisma = new PrismaClient();

require("dotenv").config();

router.get("/", async (req, res, next) => {
  try {
    const username = req.query["username"];
    const user = await prisma.user.findFirst({
      where: {
        username: username,
      },
    });
    if (user) {
      if (user.password === req.query["password"]) {
        jsw.sign(
          { userId: user.id },
          process.env.TOKEN_SECRET,
          (err, token) => {
            if (err) return res.sendStatus(500);
            res.status(200).json({ token: `bearer ${token}` });
          }
        );
      } else {
        res.sendStatus(403);
      }
    } else {
      res.sendStatus(404);
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
