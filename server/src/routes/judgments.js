import { Router } from "express";
import { del } from "@vercel/blob";
import prisma from "../lib/prisma.js";
import { isBlobUrl } from "../lib/blob.js";
import { parseIstDate } from "../lib/ist.js";
import { extractPdfText } from "../lib/extract.js";
import { looksUnreadable } from "../lib/textcheck.js";
import { ocrPdf } from "../lib/ocr.js";
import { embedJudgment } from "../lib/embed.js";
import { geminiGenerate } from "../lib/gemini.js";
import { MAX_CHARS, buildPrompt, parseAiJson, cleanResult } from "../lib/summarize.js";

const router = Router();

const STATUSES = ["READY", "PROCESSING", "FAILED"];
const SEARCH_FIELDS = ["title", "caseNumber", "court", "parties", "summary", "outcome", "fullText"];
const PREVIEW_CHARS = 6000;

function snippetFor(fullText, q) {
  if (!fullText || !q) return null;
  const index = fullText.toLowerCase().indexOf(q.toLowerCase());
  if (index === -1) return null;
  const start = Math.max(0, index - 70);
  const end = Math.min(fullText.length, index + q.length + 110);
  const piece = fullText.slice(start, end).replace(/\s+/g, " ").trim();
  return `${start > 0 ? "…" : ""}${piece}${end < fullText.length ? "…" : ""}`;
}

// Loads a judgment and makes sure it belongs to the signed-in user
async function getOwned(req, res) {
  const judgment = await prisma.judgment.findUnique({ where: { id: req.params.id } });
  if (!judgment || judgment.userId !== req.user.id) {
    res.status(404).json({ error: "Judgment not found." });
    return null;
  }
  return judgment;
}

// ---------- list / create ----------

router.get("/", async (req, res) => {
  const q = (typeof req.query.q === "string" ? req.query.q : "").trim().slice(0, 100);
  const status = STATUSES.includes(req.query.status) ? req.query.status : "";

  const where = {
    userId: req.user.id,
    ...(status ? { status } : {}),
    ...(q
      ? { OR: SEARCH_FIELDS.map((field) => ({ [field]: { contains: q, mode: "insensitive" } })) }
      : {}),
  };

  const rows = await prisma.judgment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      title: true,
      caseNumber: true,
      court: true,
      parties: true,
      summary: true,
      status: true,
      createdAt: true,
      fullText: Boolean(q),
    },
  });

  const items = rows.map(({ fullText, summary, ...rest }) => ({
    ...rest,
    summary: summary ? summary.slice(0, 220) : null,
    snippet: snippetFor(fullText, q),
  }));

  res.json({ items, q, status });
});

router.post("/", async (req, res) => {
  const title = req.body?.title?.toString().trim();
  const caseNumber = req.body?.caseNumber?.toString().trim();
  const court = req.body?.court?.toString().trim();
  const fileUrl = req.body?.fileUrl?.toString();

  if (!title) return res.status(400).json({ error: "Enter a title for the judgment." });
  if (!isBlobUrl(fileUrl)) return res.status(400).json({ error: "Invalid file." });

  const judgment = await prisma.judgment.create({
    data: {
      title,
      caseNumber: caseNumber || null,
      court: court || null,
      fileUrl,
      userId: req.user.id,
    },
  });

  res.status(201).json({ id: judgment.id });
});

// Must be declared before the "/:id" routes
router.post("/embed-missing", async (req, res) => {
  const rows = await prisma.$queryRaw`
    SELECT "id" FROM "Judgment"
    WHERE "userId" = ${req.user.id}
      AND "summary" IS NOT NULL
      AND "embedding" IS NULL
    LIMIT 20`;

  let done = 0;
  for (const row of rows) {
    try {
      await embedJudgment(row.id);
      done++;
    } catch (err) {
      console.error("Embedding failed for", row.id, err);
    }
  }

  if (rows.length > 0 && done === 0) {
    return res.status(500).json({ error: "Could not compare judgments right now." });
  }
  res.json({ ok: true, embedded: done });
});

// ---------- one judgment ----------

router.get("/:id", async (req, res) => {
  const j = await prisma.judgment.findUnique({
    where: { id: req.params.id },
    include: {
      citations: { orderBy: { text: "asc" } },
      hearings: { orderBy: { date: "asc" } },
    },
  });
  if (!j || j.userId !== req.user.id) {
    return res.status(404).json({ error: "Judgment not found." });
  }

  const { fullText, embedding, ...rest } = j; // eslint-disable-line no-unused-vars
  res.json({
    ...rest,
    keyPoints: Array.isArray(j.keyPoints) ? j.keyPoints : [],
    hasText: Boolean(fullText),
    words: fullText ? fullText.split(/\s+/).filter(Boolean).length : 0,
    preview: fullText ? fullText.slice(0, PREVIEW_CHARS) : "",
    previewTruncated: Boolean(fullText && fullText.length > PREVIEW_CHARS),
    previewChars: PREVIEW_CHARS,
  });
});

router.delete("/:id", async (req, res) => {
  const judgment = await getOwned(req, res);
  if (!judgment) return;

  // Citations and hearings are removed automatically (cascade)
  await prisma.judgment.delete({ where: { id: judgment.id } });

  // Remove the stored PDF too; if this fails the record is still gone
  try {
    await del(judgment.fileUrl);
  } catch (err) {
    console.error("Could not delete the PDF from storage:", err);
  }

  res.json({ ok: true });
});

// ---------- read the PDF ----------

async function markFailed(res, id, message, pageCount, status) {
  await prisma.judgment.update({
    where: { id },
    data: { status: "FAILED", errorMessage: message, pageCount: pageCount ?? null },
  });
  return res.status(status).json({ error: message });
}

router.post("/:id/process", async (req, res) => {
  const judgment = await getOwned(req, res);
  if (!judgment) return;
  const id = judgment.id;

  try {
    // 1. Try normal text extraction first (free and fast)
    const extracted = await extractPdfText(judgment.fileUrl);
    const pageCount = extracted.pageCount;
    let text = (extracted.text || "").replace(/\u0000/g, "").trim();

    // 2. If it is empty or garbled (scan or old Hindi font), read it with AI
    if (text.length < 50 || looksUnreadable(text)) {
      if (!process.env.GEMINI_API_KEY) {
        return markFailed(
          res,
          id,
          "This PDF needs AI reading, but the AI key is not set up.",
          pageCount,
          422
        );
      }
      const ocr = await ocrPdf(judgment.fileUrl);
      text = ocr.text.replace(/\u0000/g, "").trim();
      console.log(`AI reading used: ${ocr.pagesRead} of ${ocr.totalPages} pages`);
    }

    if (text.length < 50) {
      return markFailed(res, id, "No readable text was found in this PDF.", pageCount, 422);
    }

    await prisma.judgment.update({
      where: { id },
      data: { fullText: text, pageCount, status: "READY", errorMessage: null },
    });
    res.json({ ok: true, pageCount });
  } catch (err) {
    console.error("Processing failed:", err);
    return markFailed(res, id, "Could not read this PDF. Try another file.", null, 500);
  }
});

// ---------- summarize ----------

router.post("/:id/summarize", async (req, res) => {
  const judgment = await getOwned(req, res);
  if (!judgment) return;
  const id = judgment.id;

  if (!judgment.fullText) {
    return res.status(400).json({ error: "This judgment has no readable text to summarize." });
  }

  try {
    const text =
      judgment.fullText.length > MAX_CHARS ? judgment.fullText.slice(0, MAX_CHARS) : judgment.fullText;

    const raw = await geminiGenerate({
      parts: [{ text: buildPrompt(text) }],
      maxOutputTokens: 16000,
      json: true,
    });

    const r = cleanResult(parseAiJson(raw), judgment.fullText);

    await prisma.$transaction([
      prisma.citation.deleteMany({ where: { judgmentId: id } }),
      prisma.hearing.deleteMany({ where: { judgmentId: id } }),
      prisma.judgment.update({
        where: { id },
        data: {
          summary: r.summary,
          keyPoints: r.keyPoints,
          outcome: r.outcome,
          parties: r.parties,
          language: r.language,
          caseNumber: judgment.caseNumber || r.caseNumber,
          court: judgment.court || r.court,
          summarizedAt: new Date(),
        },
      }),
      prisma.citation.createMany({
        data: r.citations.map((c) => ({ text: c.text, normalized: c.normalized, judgmentId: id })),
      }),
      prisma.hearing.createMany({
        data: r.hearings.map((h) => ({ date: h.date, purpose: h.purpose, judgmentId: id })),
      }),
    ]);

    try {
      await embedJudgment(id);
    } catch (err) {
      console.error("Embedding failed:", err);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("Summary failed:", err);

    const status =
      err.status === 429 ? 429 : [500, 502, 503, 504].includes(err.status) ? 503 : 500;

    res.status(status).json({
      error:
        status === 429
          ? "Gemini API rate limit or quota reached. Please try again later."
          : status === 503
            ? "AI service is temporarily unavailable. Please try again shortly."
            : "Could not create the summary. Please try again.",
    });
  }
});

// ---------- similar judgments ----------

router.get("/:id/similar", async (req, res) => {
  const judgment = await getOwned(req, res);
  if (!judgment) return;
  const userId = req.user.id;
  const judgmentId = judgment.id;

  try {
    const countRows = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS n FROM "Judgment"
      WHERE "userId" = ${userId} AND "summary" IS NOT NULL AND "embedding" IS NULL`;
    const missing = countRows[0]?.n ?? 0;

    let rows = [];
    const sharedBy = {};

    if (missing === 0) {
      rows = await prisma.$queryRaw`
        SELECT j."id", j."title", j."caseNumber", j."court", j."outcome",
               1 - (j."embedding" <=> s."embedding") AS similarity
        FROM "Judgment" j
        JOIN "Judgment" s ON s."id" = ${judgmentId}
        WHERE j."userId" = ${userId}
          AND j."id" <> ${judgmentId}
          AND j."embedding" IS NOT NULL
        ORDER BY j."embedding" <=> s."embedding"
        LIMIT 5`;

      const mine = await prisma.citation.findMany({
        where: { judgmentId },
        select: { normalized: true },
      });
      const myKeys = mine.map((c) => c.normalized).filter(Boolean);
      if (rows.length > 0 && myKeys.length > 0) {
        const shared = await prisma.citation.findMany({
          where: { judgmentId: { in: rows.map((r) => r.id) }, normalized: { in: myKeys } },
          select: { judgmentId: true, text: true },
        });
        for (const c of shared) (sharedBy[c.judgmentId] ||= []).push(c.text);
      }
    }

    res.json({
      missing,
      rows: rows.map((r) => ({ ...r, similarity: Number(r.similarity) })),
      sharedBy,
    });
  } catch (err) {
    console.error("Similar judgments failed:", err);
    res.status(500).json({ error: "Could not load similar judgments." });
  }
});

// ---------- add a hearing ----------

router.post("/:id/hearings", async (req, res) => {
  const judgment = await getOwned(req, res);
  if (!judgment) return;

  const date = parseIstDate(req.body?.date);
  if (!date) return res.status(400).json({ error: "Choose a valid date." });
  const purpose = req.body?.purpose?.toString().trim().slice(0, 200) || null;

  const hearing = await prisma.hearing.create({
    data: { date, purpose, judgmentId: judgment.id },
  });
  res.status(201).json({ id: hearing.id });
});

export default router;
