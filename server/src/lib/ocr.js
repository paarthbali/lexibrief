import { PDFDocument } from "pdf-lib";
import { geminiGenerate } from "./gemini.js";

const PAGES_PER_CHUNK = 4;
const MAX_PAGES = 40;
const CONCURRENCY = 2;

const PROMPT = `Transcribe all the text in this PDF exactly as printed.
- Write Hindi in standard Unicode Devanagari. If the PDF uses an old font such as Kruti Dev or Chanakya, convert the text to proper Unicode Hindi.
- Keep English text, numbers, names and legal citations exactly as they appear.
- Keep paragraph breaks.
- Do not summarize, translate, explain, or add any comment.
- Return only the transcribed text.`;

export async function ocrPdf(fileUrl) {
  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error("Could not download the PDF.");
  const bytes = new Uint8Array(await res.arrayBuffer());

  const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const totalPages = source.getPageCount();
  const pagesToRead = Math.min(totalPages, MAX_PAGES);

  const ranges = [];
  for (let start = 0; start < pagesToRead; start += PAGES_PER_CHUNK) {
    ranges.push([start, Math.min(start + PAGES_PER_CHUNK, pagesToRead)]);
  }

  const results = new Array(ranges.length);
  let next = 0;

  async function worker() {
    while (next < ranges.length) {
      const i = next++;
      const [start, end] = ranges[i];

      const part = await PDFDocument.create();
      const indexes = Array.from({ length: end - start }, (_, k) => start + k);
      const copied = await part.copyPages(source, indexes);
      copied.forEach((p) => part.addPage(p));
      const base64 = Buffer.from(await part.save()).toString("base64");

      results[i] = await geminiGenerate({
        parts: [
          { inline_data: { mime_type: "application/pdf", data: base64 } },
          { text: PROMPT },
        ],
      });
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  return { text: results.join("\n\n").trim(), pagesRead: pagesToRead, totalPages };
}