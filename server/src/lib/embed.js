import prisma from "./prisma.js";

const DIMENSIONS = 768;

export function judgmentEmbeddingText(j) {
  const points = Array.isArray(j.keyPoints) ? j.keyPoints : [];
  return [j.title, j.parties, j.court, j.outcome, j.summary, ...points]
    .filter(Boolean)
    .join("\n")
    .slice(0, 8000);
}

export async function embedText(text) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set.");
     const model = (process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001")
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .replace(/^models\//, "");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent`;

  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        content: { parts: [{ text }] },
        taskType: "SEMANTIC_SIMILARITY",
        outputDimensionality: DIMENSIONS,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      const values = data?.embedding?.values;
      if (!Array.isArray(values) || values.length !== DIMENSIONS) {
        throw new Error(`Unexpected embedding size: ${values?.length}`);
      }
      return values;
    }

    if ([429, 500, 503].includes(res.status) && attempt < 3) {
      await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
      continue;
    }
    throw new Error(data?.error?.message || `Embedding request failed (${res.status})`);
  }
}

// Creates and saves the embedding for one judgment that already has a summary
export async function embedJudgment(id) {
  const j = await prisma.judgment.findUnique({
    where: { id },
    select: {
      title: true,
      parties: true,
      court: true,
      outcome: true,
      summary: true,
      keyPoints: true,
    },
  });
  if (!j?.summary) throw new Error("This judgment has no summary to compare yet.");

  const values = await embedText(judgmentEmbeddingText(j));
  const literal = `[${values.join(",")}]`;

  await prisma.$executeRaw`UPDATE "Judgment" SET "embedding" = ${literal}::vector WHERE "id" = ${id}`;
}