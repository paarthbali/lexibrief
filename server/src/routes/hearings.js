import { Router } from "express";
import prisma from "../lib/prisma.js";
import { istDayRange, parseIstDate } from "../lib/ist.js";

const router = Router();

async function getOwnedHearing(hearingId, userId) {
  const hearing = await prisma.hearing.findUnique({
    where: { id: hearingId },
    include: { judgment: { select: { userId: true } } },
  });
  if (!hearing || hearing.judgment.userId !== userId) return null;
  return hearing;
}

router.get("/", async (req, res) => {
  const todayStart = istDayRange(0).start;
  const include = {
    judgment: { select: { id: true, title: true, caseNumber: true, court: true } },
  };

  const [upcoming, past] = await Promise.all([
    prisma.hearing.findMany({
      where: { judgment: { userId: req.user.id }, date: { gte: todayStart } },
      orderBy: { date: "asc" },
      take: 100,
      include,
    }),
    prisma.hearing.findMany({
      where: { judgment: { userId: req.user.id }, date: { lt: todayStart } },
      orderBy: { date: "desc" },
      take: 10,
      include,
    }),
  ]);

  res.json({ upcoming, past });
});

router.patch("/:hearingId", async (req, res) => {
  const hearing = await getOwnedHearing(req.params.hearingId, req.user.id);
  if (!hearing) return res.status(404).json({ error: "Hearing not found." });

  const date = parseIstDate(req.body?.date);
  if (!date) return res.status(400).json({ error: "Choose a valid date." });
  const purpose = req.body?.purpose?.toString().trim().slice(0, 200) || null;

  await prisma.hearing.update({
    where: { id: hearing.id },
    data: {
      date,
      purpose,
      // a changed date should get a fresh reminder
      reminderSentAt: date.getTime() !== hearing.date.getTime() ? null : hearing.reminderSentAt,
    },
  });
  res.json({ ok: true });
});

router.delete("/:hearingId", async (req, res) => {
  const hearing = await getOwnedHearing(req.params.hearingId, req.user.id);
  if (!hearing) return res.status(404).json({ error: "Hearing not found." });

  await prisma.hearing.delete({ where: { id: hearing.id } });
  res.json({ ok: true });
});

export default router;
