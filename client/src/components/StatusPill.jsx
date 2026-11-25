const MAP = {
  READY: { label: "Ready", cls: "bg-verdigris/10 text-verdigris", dot: "bg-verdigris" },
  PROCESSING: { label: "Processing", cls: "bg-brass/10 text-brass", dot: "bg-brass animate-pulse" },
  FAILED: { label: "Failed", cls: "bg-danger/10 text-danger", dot: "bg-danger" },
};

export default function StatusPill({ status }) {
  const s = MAP[status] || MAP.PROCESSING;
  return (
    <span className={`inline-flex shrink-0 items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
