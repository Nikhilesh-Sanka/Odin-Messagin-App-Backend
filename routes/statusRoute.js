const { Router } = require("express");
const router = Router();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

router.put("/:status", async (req, res, next) => {
  try {
    const reqStatus = req.params["status"];
    const { status } = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
      select: {
        status: true,
      },
    });
    if (status === reqStatus) {
      return res.sendStatus(409);
    }
    await prisma.user.update({
      where: {
        id: req.userId,
      },
      data: {
        status: reqStatus,
      },
    });
    res.sendStatus(201);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
