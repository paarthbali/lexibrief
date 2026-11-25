import { useState } from "react";
import { api } from "../lib/api";
import Icon from "./Icon";
import SubmitButton from "./SubmitButton";

// Shown on a judgment whose PDF could not be read: tries the reading step again
export default function RetryButton({ judgmentId, onDone }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function retry() {
    setError("");
    setPending(true);
    try {
      await api(`/judgments/${judgmentId}/process`, { method: "POST" });
    } catch (err) {
      setError(err.message || "Could not read this PDF.");
    }
    setPending(false);
    onDone?.();
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-3 flex items-center gap-1.5 text-sm text-danger">
          <Icon name="alert" size={16} /> {error}
        </p>
      )}
      <SubmitButton type="button" onClick={retry} pending={pending} pendingText="Reading the pages…">
        <Icon name="refresh" size={16} />
        Retry reading
      </SubmitButton>
      {pending && (
        <p className="mt-2 text-sm text-muted">Scanned files can take a minute. Keep this page open.</p>
      )}
    </div>
  );
}
