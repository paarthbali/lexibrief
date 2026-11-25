const DEVANAGARI = /[\u0900-\u097F]/g;
const LATIN = /[A-Za-z]/g;
const STOPWORDS = new Set([
  "the", "of", "and", "to", "in", "is", "that", "for", "with",
  "by", "on", "this", "was", "be", "as", "at", "it", "not", "or", "an",
]);

// true when the extracted text is probably garbled (old Hindi fonts, bad encoding)
export function looksUnreadable(text) {
  const sample = text.slice(0, 20000);
  const dev = (sample.match(DEVANAGARI) || []).length;
  const lat = (sample.match(LATIN) || []).length;

  if (dev + lat < sample.length * 0.3) return true; // mostly symbols or digits
  if (dev > lat) return false; // real Unicode Hindi

  const words = sample.toLowerCase().match(/[a-z]+/g) || [];
  if (words.length < 30) return false;
  const hits = words.filter((w) => STOPWORDS.has(w)).length;
  return hits / words.length < 0.05; // real English text has many common words
}