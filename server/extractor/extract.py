import hmac
import json
import os
import traceback
import urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse

import fitz  # PyMuPDF

MAX_BYTES = 25 * 1024 * 1024
ALLOWED_HOST_SUFFIX = ".public.blob.vercel-storage.com"


class handler(BaseHTTPRequestHandler):
    def _send(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        # Only our own Node server may call this service
        secret = os.environ.get("EXTRACT_SECRET", "")
        given = self.headers.get("x-extract-secret", "")
        if not secret or not hmac.compare_digest(secret, given):
            return self._send(401, {"error": "Unauthorized"})

        try:
            length = int(self.headers.get("Content-Length", 0))
            data = json.loads(self.rfile.read(length) or b"{}")
            url = data.get("url", "")

            parsed = urlparse(url)
            host = parsed.hostname or ""
            if parsed.scheme != "https" or not host.endswith(ALLOWED_HOST_SUFFIX):
                return self._send(400, {"error": "Invalid file URL"})

            with urllib.request.urlopen(url, timeout=30) as resp:
                pdf_bytes = resp.read(MAX_BYTES + 1)
            if len(pdf_bytes) > MAX_BYTES:
                return self._send(413, {"error": "File is too large"})

            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            pages = [page.get_text("text") for page in doc]
            page_count = doc.page_count
            doc.close()

            text = "\n\n".join(pages).strip()
            self._send(200, {"text": text, "pageCount": page_count})
        except Exception as e:
            traceback.print_exc()
            self._send(500, {"error": f"Extraction failed: {e}"})


def load_dotenv(path=".env"):
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))
    except FileNotFoundError:
        pass


# Local: python extractor/extract.py  ->  http://127.0.0.1:8000
# Hosted: the platform sets PORT, so listen on all interfaces on that port
if __name__ == "__main__":
    load_dotenv()
    port = int(os.environ.get("PORT", "8000"))
    host = "0.0.0.0" if os.environ.get("PORT") else "127.0.0.1"
    print(f"Extractor running on http://{host}:{port}")
    HTTPServer((host, port), handler).serve_forever()