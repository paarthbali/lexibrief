import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

export default function EmbedAndRefresh({ onDone }) {
  const started = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    api("/judgments/embed-missing", { method: "POST" })
      .then(() => onDone?.())
      .catch((err) => setError(err.message || "Could not compare judgments right now."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return <p className="mt-3 text-sm text-muted">{error} Reload the page to try again.</p>;
  }

  return (
    <p className="mt-3 flex items-center gap-2 text-sm text-muted" role="status">
      <span className="spinner text-brass" /> Comparing your judgments…
    </p>
  );
}
