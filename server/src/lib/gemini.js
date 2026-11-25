
const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function getRetryDelay(res, attempt) {
  const retryAfter = res.headers.get("retry-after");

  if (retryAfter) {
    const seconds = Number(retryAfter);

    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.min(seconds * 1000, 30000);
    }

    const date = Date.parse(retryAfter);

    if (!Number.isNaN(date)) {
      return Math.min(Math.max(date - Date.now(), 1000), 30000);
    }
  }

  return Math.min(3000 * 2 ** attempt, 20000);
}

async function generateWithModel({
  model,
  key,
  parts,
  maxOutputTokens,
  json,
  thinking,
}) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  for (let attempt = 0; attempt < 3; attempt++) {
    let res;

    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens,
            ...(json
              ? { responseMimeType: "application/json" }
              : {}),
            ...(thinking
              ? { thinkingConfig: { thinkingLevel: thinking } }
              : {}),
          },
        }),
        signal: AbortSignal.timeout(180000),
      });
    } catch (err) {
      if (attempt === 2) throw err;

      const delay = 3000 * 2 ** attempt;
      console.warn(
        `${model}: Network error. Retrying in ${delay}ms.`
      );

      await sleep(delay);
      continue;
    }

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      const result = (data.candidates?.[0]?.content?.parts || [])
        .map((part) => part.text || "")
        .join("");

      if (!result.trim()) {
        throw new Error(
          `Gemini returned empty output. Finish reason: ${
            data.candidates?.[0]?.finishReason || "Unknown"
          }`
        );
      }

      return result;
    }

    const error = new Error(
      data?.error?.message || `Gemini request failed (${res.status})`
    );

    error.status = res.status;

    const retryable = [429, 500, 502, 503, 504].includes(res.status);

    if (!retryable || attempt === 2) {
      throw error;
    }

    const delay = getRetryDelay(res, attempt);

    console.warn(
      `${model}: HTTP ${res.status}. Retrying in ${delay}ms.`
    );

    await sleep(delay);
  }

  throw new Error(`Gemini failed for model ${model}`);
}

export async function geminiGenerate({
  parts,
  maxOutputTokens = 32000,
  json = false,
}) {
  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const cleanModel = (value) =>
    value
      .trim()
      .replace(/^["']+|["']+$/g, "")
      .replace(/^models\//, "");

  const primary = cleanModel(
    process.env.GEMINI_MODEL || "gemini-3.8-flash"
  );

  const fallback = cleanModel(
    process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash-lite"
  );

  const thinking = process.env.GEMINI_THINKING_LEVEL;

  const models = [...new Set([primary, fallback])];

  let lastError;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];

    try {
      console.log(`Generating judgment summary using ${model}`);

      return await generateWithModel({
        model,
        key,
        parts,
        maxOutputTokens,
        json,
        thinking: i === 0 ? thinking : undefined,
      });
    } catch (err) {
      lastError = err;

      console.error(
        `${model} failed:`,
        err.message
      );

      const retryable =
        !err.status || [429, 500, 502, 503, 504].includes(err.status);

      if (!retryable || i === models.length - 1) {
        throw err;
      }

      console.warn(`Switching to fallback model: ${fallback}`);
    }
  }

  throw lastError || new Error("All Gemini models failed.");
}
