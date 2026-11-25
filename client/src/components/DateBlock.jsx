import { TZ } from "../lib/format";

// Calendar-style day/month tile
export default function DateBlock({ date, soon = false, muted = false }) {
  const d = new Date(date);
  return (
    <div
      className={`w-14 shrink-0 overflow-hidden rounded-xl border text-center ${
        soon ? "border-brass/60 bg-brass/10" : "border-rule bg-white"
      } ${muted ? "opacity-70" : ""}`}
    >
      <p className={`py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider ${soon ? "bg-brass text-white" : "bg-ink/5 text-muted"}`}>
        {d.toLocaleDateString("en-IN", { month: "short", timeZone: TZ })}
      </p>
      <p className="py-1.5 font-serif text-2xl leading-none">
        {d.toLocaleDateString("en-IN", { day: "2-digit", timeZone: TZ })}
      </p>
    </div>
  );
}
