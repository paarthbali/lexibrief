const WIDTHS = [100, 94, 98, 86, 100, 72, 96, 90, 100, 64, 94, 88, 58];
const KEY_LINES = new Set([3, 6, 10]);

export default function DistillVisual() {
  return (
    <div className="distill" aria-hidden="true">
      <div className="distill-paper">
        <div className="distill-title" />
        {WIDTHS.map((w, i) => (
          <div
            key={i}
            className={`distill-line ${KEY_LINES.has(i) ? "is-key" : ""}`}
            style={{ width: `${w}%`, "--f": i / (WIDTHS.length - 1) }}
          />
        ))}
        <div className="distill-scan" />
      </div>

      <div className="distill-summary">
        <p className="distill-summary-head">Sample summary</p>
        <p className="distill-row" style={{ "--i": 0 }}>
          Appeal allowed; conviction set aside.
        </p>
        <p className="distill-row" style={{ "--i": 1 }}>
          Key point: witness accounts contradict each other.
        </p>
        <p className="distill-row" style={{ "--i": 2 }}>
          <span className="distill-chip">(2010) 5 SCC 1</span> cited
        </p>
      </div>
    </div>
  );
}