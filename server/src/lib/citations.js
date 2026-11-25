// Common Indian law-report formats
const PATTERNS = [
  /\bAIR\s+\d{4}\s+[A-Z][A-Za-z]{1,8}\s+\d{1,5}\b/g, // AIR 1973 SC 1461
  /\(\d{4}\)\s+\d{1,3}\s+(?:SCC|SCR|SCALE)\s+\d{1,5}\b/g, // (2010) 5 SCC 1
  /\b\d{4}\s+\(\d{1,3}\)\s+(?:SCC|SCR|SCALE)\s+\d{1,5}\b/g, // 2010 (5) SCC 1
  /\b\d{4}\s+SCC\s+OnLine\s+[A-Za-z]{2,10}\s+\d{1,6}\b/g, // 2020 SCC OnLine Del 123
];

const clean = (s) => s.replace(/\s+/g, " ").trim();
const norm = (s) => clean(s).toUpperCase();

// Keep an AI citation only if it really appears in the judgment text,
// then add any citations found by the patterns above.
export function mergeCitations(aiList, fullText) {
  const haystack = norm(fullText);
  const found = new Map();

  for (const c of Array.isArray(aiList) ? aiList : []) {
    if (typeof c !== "string") continue;
    const text = clean(c);
    if (text.length < 4 || text.length > 160) continue;
    if (haystack.includes(norm(text))) found.set(norm(text), text);
  }

  for (const re of PATTERNS) {
    for (const m of fullText.matchAll(re)) {
      const text = clean(m[0]);
      if (!found.has(norm(text))) found.set(norm(text), text);
    }
  }

  return [...found.entries()]
    .slice(0, 80)
    .map(([normalized, text]) => ({ text, normalized }));
}