import { Link } from "react-router-dom";
import Brand from "./Brand";
import DistillVisual from "./DistillVisual";
import Icon from "./Icon";

const FEATURES = [
  ["spark", "Plain-English summaries", "Facts, issues and the decision in about 150 words."],
  ["quote", "Citations found for you", "Case law and sections pulled straight from the text."],
  ["calendar", "Hearing reminders", "An email the day before every hearing."],
];

export default function AuthShell({ title, subtitle, eyebrow, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="ruled relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-ink via-[#0f2540] to-ink-deep p-12 pl-16 text-white lg:flex">
        <div className="orb -right-32 -top-32 h-[28rem] w-[28rem]" />
        <div
          className="orb -bottom-40 left-0 h-[32rem] w-[32rem] [animation-delay:-6s]"
          style={{ "--orb": "rgba(30, 123, 110, 0.28)" }}
        />

        <Link to="/" aria-label="LexiBrief home" className="relative w-fit">
          <Brand tone="light" />
        </Link>

        <div className="relative">
          <h2 className="reveal max-w-md font-serif text-4xl leading-[1.15]">
            Long judgments, <span className="text-brass-soft">read in minutes.</span>
          </h2>
          <p className="reveal mt-4 max-w-md text-white/70" style={{ "--d": 1 }}>
            Upload a judgment and get the summary, key legal points, citations and similar cases in
            one place.
          </p>

          <ul className="mt-8 space-y-4">
            {FEATURES.map(([icon, head, text], i) => (
              <li key={head} className="reveal flex items-start gap-3" style={{ "--d": i + 2 }}>
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-brass-soft">
                  <Icon name={icon} size={17} />
                </span>
                <span>
                  <span className="block text-sm font-medium">{head}</span>
                  <span className="block text-sm text-white/60">{text}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-10 hidden [@media(min-width:1280px)_and_(min-height:960px)]:block">
            <DistillVisual />
          </div>
        </div>

        <p className="relative text-sm text-white/50">
          Summaries are AI-generated. Check them against the original judgment.
        </p>
      </section>

      <main className="relative flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="page-in w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Brand tone="dark" />
          </div>
          <div className="card px-6 py-8 shadow-[var(--shadow-md)] sm:px-9 sm:py-10">
            {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
            <h1 className="font-serif text-3xl">{title}</h1>
            <p className="mt-2 text-muted">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </div>
          <div className="mt-6 text-center text-sm text-muted">{footer}</div>
        </div>
      </main>
    </div>
  );
}
