import { Router } from "express";
import prisma from "../lib/prisma.js";
import { istDayRange, toDateInputValue } from "../lib/ist.js";

const TZ = "Asia/Kolkata";
const router = Router();

router.get("/", async (req, res) => {
  const userId = req.user.id;
  const startOfToday = istDayRange(0).start;
  const weekEnd = istDayRange(7).start;

  const [
    total,
    summarized,
    citationTotal,
    recent,
    hearings,
    weekHearings,
    topCitations,
    languages,
  ] = await Promise.all([
    prisma.judgment.count({ where: { userId } }),
    prisma.judgment.count({ where: { userId, summarizedAt: { not: null } } }),
    prisma.citation.count({ where: { judgment: { userId } } }),
    prisma.judgment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, title: true, caseNumber: true, court: true, status: true, createdAt: true },
    }),
    prisma.hearing.findMany({
      where: { judgment: { userId }, date: { gte: startOfToday } },
      orderBy: { date: "asc" },
      take: 5,
      include: { judgment: { select: { id: true, title: true, caseNumber: true } } },
    }),
    prisma.hearing.findMany({
      where: { judgment: { userId }, date: { gte: startOfToday, lt: weekEnd } },
      select: { date: true },
    }),
    prisma.citation.groupBy({
      by: ["normalized"],
      where: { judgment: { userId }, normalized: { not: null } },
      having: { normalized: { _count: { gt: 1 } } },
      _count: { normalized: true },
      orderBy: { _count: { normalized: "desc" } },
      take: 5,
    }),
    prisma.judgment.groupBy({
      by: ["language"],
      where: { userId, language: { not: null } },
      _count: { language: true },
    }),
  ]);

  // The next 7 days, in Indian time, with the number of hearings on each
  const perDay = {};
  for (const h of weekHearings) {
    const key = toDateInputValue(h.date);
    perDay[key] = (perDay[key] || 0) + 1;
  }
  const week = Array.from({ length: 7 }, (_, i) => {
    const { start } = istDayRange(i);
    return {
      key: toDateInputValue(start),
      isToday: i === 0,
      weekday: start.toLocaleDateString("en-IN", { weekday: "short", timeZone: TZ }),
      day: start.toLocaleDateString("en-IN", { day: "numeric", timeZone: TZ }),
      count: perDay[toDateInputValue(start)] || 0,
    };
  });

  res.json({
    stats: {
      total,
      summarized,
      weekHearings: weekHearings.length,
      citations: citationTotal,
    },
    recent,
    hearings,
    week,
    topCitations: topCitations.map((c) => ({ label: c.normalized, count: c._count.normalized })),
    languages: languages
      .map((l) => ({ name: l.language, count: l._count.language }))
      .sort((a, b) => b.count - a.count),
  });
});

export default router;
