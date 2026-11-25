// Calls the small Python (PyMuPDF) service in server/extractor/extract.py
export async function extractPdfText(fileUrl) {
  const endpoint = process.env.EXTRACT_URL || "http://127.0.0.1:8000";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-extract-secret": process.env.EXTRACT_SECRET || "",
    },
    body: JSON.stringify({ url: fileUrl }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Text extraction failed.");
  return data; // { text, pageCount }
}
