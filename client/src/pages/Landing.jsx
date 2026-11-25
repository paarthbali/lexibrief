import { Link } from "react-router-dom";
import Brand from "../components/Brand";
import DistillVisual from "../components/DistillVisual";
import { useAuth } from "../context/AuthContext";
import { usePageTitle } from "../lib/usePageTitle";

const STEPS = [
  ["Upload", "Drop in a judgment PDF. English or Hindi, typed or scanned."],
  ["Read", "The text is extracted. Scanned and old-font Hindi pages are read by AI."],
  ["Use", "Summary, legal points, citations, related judgments and hearings, on one page."],
];

const FEATURES = [
  ["Case summary", "A short, plain-language summary of the facts, the legal issue and the decision, with the outcome stated up front."],
  ["Key legal points", "The issues, the court's reasoning and the directions given, as a short numbered list."],
  ["Verified citations", "Every citation is checked against the judgment's own text, so the AI cannot invent one. Law-report formats such as AIR and SCC are picked up too."],
  ["Similar judgments", "Related judgments from your own library, matched by meaning, with the citations they share."],
  ["Hearings and reminders", "Dates found in a judgment, or added by hand, show on a calendar view. An email arrives the day before."],
  ["English and Hindi", "A Hindi judgment gets a Hindi summary. An English one gets English."],
  ["Search", "Find a judgment by a word in its title, parties, summary or full text."],
];

const PROMISES = [
  ["Checked against the source", "Citations must appear in the original text before they are shown."],
  ["Private by default", "Each user sees only their own judgments, summaries and hearings."],
  ["Honest about AI", "Every summary carries a reminder to verify it against the original judgment."],
];

export default function Landing() {
  usePageTitle("");
  const { user } = useAuth();
  const primary = user ? ["/upload", "Upload a judgment"] : ["/register", "Create an account"];
  const secondary = user ? ["/dashboard", "Go to dashboard"] : ["/login", "Sign in"];

  return (
    <div className="min-h-screen">
      <section className="ruled relative overflow-hidden bg-gradient-to-br from-ink via-[#0f2540] to-ink-deep text-white">
        <div className="mx-auto max-w-6xl px-6 pl-10 lg:pl-6">
          <header className="flex items-center justify-between gap-3 py-5 sm:py-6">
            <Brand tone="light" />
            <nav aria-label="Account" className="flex items-center gap-3 text-sm sm:gap-5">
              {user ? (
                <Link to="/dashboard" className="text-white/80 transition hover:text-white">
                  Open dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-white/80 transition hover:text-white">Sign in</Link>
                  <Link to="/register" className="rounded-md border border-white/30 px-3.5 py-2 transition hover:border-white">
                    Create account
                  </Link>
                </>
              )}
            </nav>
          </header>

          <div className="grid items-center gap-12 pb-16 pt-8 sm:gap-14 sm:pb-20 sm:pt-10 lg:grid-cols-[1.1fr_1fr] lg:pb-28 lg:pt-16">
            <div>
              <h1 className="reveal font-serif text-4xl leading-[1.08] sm:text-5xl lg:text-6xl" style={{ "--d": 0 }}>
                Hundreds of pages in. One clear page out.
              </h1>
              <p className="reveal mt-6 max-w-xl text-lg leading-relaxed text-white/75" style={{ "--d": 1 }}>
                Upload a court judgment in English or Hindi. Get the summary, the key legal points,
                verified citations, related judgments and hearing dates in one place.
              </p>
              <div className="reveal mt-9 flex flex-wrap items-center gap-4" style={{ "--d": 2 }}>
                <Link to={primary[0]} className="rounded-md bg-brass-soft px-5 py-3 font-medium text-ink transition hover:bg-white">
                  {primary[1]}
                </Link>
                <Link to={secondary[0]} className="rounded-md border border-white/30 px-5 py-3 transition hover:border-white">
                  {secondary[1]}
                </Link>
              </div>
              <p className="reveal mt-6 text-sm text-white/50" style={{ "--d": 3 }}>
                Summaries are AI-generated. Check them against the original judgment.
              </p>
            </div>
            <div className="reveal lg:justify-self-center" style={{ "--d": 2 }}>
              <DistillVisual />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
        <h2 className="font-serif text-3xl">From a long judgment to a clear page</h2>
        <ol className="mt-10 grid gap-10 md:grid-cols-3">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="reveal border-t-2 border-ink pt-5" style={{ "--d": i }}>
              <span className="font-serif text-5xl leading-none text-brass">{i + 1}</span>
              <h3 className="mt-4 font-serif text-xl">{title}</h3>
              <p className="mt-2 max-w-xs text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-rule bg-white/60">
        <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
          <h2 className="font-serif text-3xl">What you get</h2>
          <dl className="mt-10 divide-y divide-rule border-y border-rule">
            {FEATURES.map(([title, text]) => (
              <div key={title} className="grid gap-1 py-5 sm:grid-cols-[240px_1fr] sm:gap-8">
                <dt className="font-serif text-xl">{title}</dt>
                <dd className="max-w-2xl text-muted">{text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
        <h2 className="font-serif text-3xl">Built to be trusted</h2>
        <div className="mt-10 grid gap-10 md:grid-cols-3">
          {PROMISES.map(([title, text]) => (
            <div key={title} className="border-l-[3px] border-brass pl-5">
              <h3 className="font-serif text-xl">{title}</h3>
              <p className="mt-2 text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="ruled relative bg-gradient-to-br from-ink via-[#0f2540] to-ink-deep text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-6 py-16 pl-10 lg:pl-6">
          <h2 className="max-w-xl font-serif text-3xl leading-tight">Try it with a judgment of your own.</h2>
          <Link to={primary[0]} className="rounded-md bg-brass-soft px-5 py-3 font-medium text-ink transition hover:bg-white">
            {primary[1]}
          </Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-muted">
        <Brand tone="dark" />
        <p>Summaries are AI-generated and must be checked against the original judgment.</p>
      </footer>
    </div>
  );
}
