export default function Brand({ tone = "light" }) {
  const color = tone === "light" ? "text-white" : "text-ink";
  return (
    <div className={`flex items-center gap-3 ${color}`}>
      <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-gradient-to-br from-brass to-[#8a6120] shadow-[0_6px_14px_-6px_rgba(184,134,43,0.8)]">
        <svg width="20" height="20" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <path d="M7 8.5h14M7 14h14" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <path d="M7 19.5h8" stroke="#fff" strokeOpacity="0.75" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </span>
      <span className="font-serif text-xl leading-none tracking-tight">LexiBrief</span>
    </div>
  );
}
