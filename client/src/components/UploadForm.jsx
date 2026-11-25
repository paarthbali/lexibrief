import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { upload } from "@vercel/blob/client";
import { api } from "../lib/api";
import Icon from "./Icon";
import SubmitButton from "./SubmitButton";
import Field from "./Field";

const MAX_MB = 25;

function formatSize(bytes) {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadForm() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [court, setCourt] = useState("");
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState("idle"); // idle | uploading | reading
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const busy = stage !== "idle";

  function pickFile(f) {
    if (!f) return;
    if (f.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`The file is larger than ${MAX_MB} MB.`);
      return;
    }
    setError("");
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.pdf$/i, ""));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError("Choose a PDF first.");
      return;
    }
    setError("");
    setStage("uploading");
    setProgress(0);

    try {
      const blob = await upload(`judgments/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });

      setStage("reading");

      const created = await api("/judgments", {
        method: "POST",
        body: { title, caseNumber, court, fileUrl: blob.url },
      });

      await api(`/judgments/${created.id}/process`, { method: "POST" });

      navigate(`/judgments/${created.id}`);
    } catch (err) {
      setStage("idle");
      setError(err.message || "Something went wrong. Try again.");
    }
  }

  const zoneStyle = dragging
    ? "border-brass bg-brass-soft/20"
    : file
    ? "border-verdigris/70 bg-verdigris/5"
    : "border-rule bg-paper/60 hover:border-ink/50 hover:bg-white";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p role="alert" className="notice-error">
          <Icon name="alert" size={18} /> {error}
        </p>
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!busy && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!busy) pickFile(e.dataTransfer.files?.[0]);
        }}
        className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-12 text-center transition duration-200 focus-visible:outline-2 focus-visible:outline-brass ${zoneStyle}`}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          aria-hidden="true"
          className={`mx-auto transition-transform duration-200 ${
            dragging ? "-translate-y-2" : ""
          }`}
        >
          <path
            d="M10 4h14l8 8v24H10V4Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M24 4v8h8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M15 22h12M15 27h12" stroke="#b8862b" strokeWidth="2" strokeLinecap="round" />
        </svg>

        {file ? (
          <>
            <p className="mt-4 font-medium">{file.name}</p>
            <p className="mt-1 text-sm text-muted">{formatSize(file.size)}. Click to choose a different file.</p>
          </>
        ) : (
          <>
            <p className="mt-4 font-medium">Drop the judgment PDF here</p>
            <p className="mt-1 text-sm text-muted">or click to browse. PDF only, up to {MAX_MB} MB.</p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
      </div>

      <Field
        label="Title"
        icon="files"
        placeholder="e.g. State v. Sharma"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={busy}
        required
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Case number (optional)"
          value={caseNumber}
          onChange={(e) => setCaseNumber(e.target.value)}
          disabled={busy}
        />
        <Field
          label="Court (optional)"
          value={court}
          onChange={(e) => setCourt(e.target.value)}
          disabled={busy}
        />
      </div>

      {busy && (
        <div role="status" aria-live="polite" className="rounded-xl border border-brass/30 bg-brass/5 p-4 text-sm text-[#6b4d12]">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-brass/20">
            <div
              className={`h-full rounded-full bg-brass transition-all duration-300 ${
                stage !== "uploading" ? "w-full animate-pulse" : ""
              }`}
              style={stage === "uploading" ? { width: `${progress}%` } : undefined}
            />
          </div>
          <p className="mt-2">
            {stage === "uploading"
              ? `Uploading… ${progress}%`
              : "Reading the pages. Long judgments can take a minute, so keep this page open."}
          </p>
        </div>
      )}

      <SubmitButton pending={busy} pendingText="Working…" disabled={!file}>
        <Icon name="upload" size={18} />
        Upload and read judgment
      </SubmitButton>
    </form>
  );
}
