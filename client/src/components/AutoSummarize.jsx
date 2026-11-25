import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import Icon from "./Icon";
import { Skeleton } from "./Skeleton";

export default function AutoSummarize({ judgmentId, onDone }) {
  const started = useRef(false);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(true);
  const [seconds, setSeconds] = useState(0);

  async function run() {
    setError("");
    setRunning(true);
    setSeconds(0);
    try {
      await api(`/judgments/${judgmentId}/summarize`, { method: "POST" });
      onDone?.();
    } catch (err) {
      setRunning(false);
      setError(err.message || "Could not create the summary.");
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  if (error) {
    return (
      <div className="mt-4">
        <p role="alert" className="notice-error">
          <Icon name="alert" size={18} /> {error}
        </p>
        <button onClick={run} className="btn-primary mt-4">
          <Icon name="refresh" size={16} />
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="card mt-4 p-6" role="status" aria-live="polite">
      <p className="flex items-center gap-2 text-sm font-medium">
        <span className="spinner text-brass" />
        Writing the summary… {seconds}s
      </p>
      <div className="mt-5 space-y-3">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-[92%]" />
        <Skeleton className="h-3.5 w-[96%]" />
        <Skeleton className="h-3.5 w-[70%]" />
      </div>
      <p className="mt-5 text-sm text-muted">
        Long judgments can take a minute, so keep this page open.
      </p>
    </div>
  );
}
