import { useState } from "react";
import { api } from "../lib/api";
import Icon from "./Icon";
import SubmitButton from "./SubmitButton";

export default function SummaryButton({ judgmentId, hasSummary, onDone }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setError("");
    setPending(true);
    try {
      await api(`/judgments/${judgmentId}/summarize`, { method: "POST" });
      setPending(false);
      onDone?.();
    } catch (err) {
      setPending(false);
      setError(err.message || "Could not create the summary.");
    }
  }

  return (
    <div>
      {error && (
        <p role="alert" className="notice-error mb-3">
          <Icon name="alert" size={18} /> {error}
        </p>
      )}
      <SubmitButton
        type="button"
        onClick={run}
        pending={pending}
        pendingText="Writing summary…"
        variant={hasSummary ? "secondary" : "primary"}
        className={hasSummary ? "btn-sm" : ""}
      >
        <Icon name={hasSummary ? "refresh" : "spark"} size={16} />
        {hasSummary ? "Regenerate summary" : "Generate summary"}
      </SubmitButton>
    </div>
  );
}
