import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFetch } from "../lib/useFetch";
import { TZ, daysUntil, whenLabel } from "../lib/format";
import { usePageTitle } from "../lib/usePageTitle";
import StatusPill from "../components/StatusPill";
import PageHeader from "../components/PageHeader";
import Icon from "../components/Icon";
import CountUp from "../components/CountUp";
import DateBlock from "../components/DateBlock";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { PageSkeleton } from "../components/Skeleton";

const STATS = [
  ["total", "Judgments", "files"],
  ["summarized", "Summaries ready", "spark"],
  ["weekHearings", "Hearings this week", "calendar"],
  ["citations", "Citations tracked", "quote"],
];

function BarRow({ label, value, max, unit, index, color = "bg-brass" }) {
  const pct = max > 0 ? Math.max(6, Math.round((value / max) * 100)) : 0;
  return (
    <li>
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="min-w-0 truncate">{label}</span>
        <span className="shrink-0 text-muted">
          {value} {value === 1 ? unit : `${unit}s`}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-rule" aria-hidden="true">
        <div className={`bar-grow h-2 rounded-full ${color}`} style={{ width: `${pct}%`, "--d": index }} />
      </div>
    </li>
  );
}

export default function Dashboard() {
  usePageTitle("Dashboard");
  const { user } = useAuth();
  const { data, error, loading, reload } = useFetch("/dashboard");

  const displayName = user.name || user.email;
  const firstName = displayName.split(/[ @]/)[0];
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TZ,
  });

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  const { stats, recent, hearings, week, topCitations, languages } = data;
  const maxCite = Math.max(1, ...topCitations.map((c) => c.count));
  const maxLang = Math.max(1, ...languages.map((l) => l.count));

  return (
    <>
      <PageHeader
        eyebrow={today}
        title={`Welcome back, ${firstName}`}
        subtitle="Upload a judgment to get its summary, key points and citations."
        actions={
          <Link to="/upload" className="btn-primary">
            <Icon name="upload" size={18} />
            Upload judgment
          </Link>
        }
      />

      <dl className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map(([key, label, icon], i) => (
          <div key={key} className="card card-hover reveal flex items-center gap-4 p-5" style={{ "--d": i + 1 }}>
            <span className="stat-icon">
              <Icon name={icon} size={20} />
            </span>
            <div>
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="font-serif text-3xl leading-tight">
                <CountUp value={stats[key]} />
              </dd>
            </div>
          </div>
        ))}
      </dl>

      <section aria-labelledby="week-h" className="reveal mt-12" style={{ "--d": 5 }}>
        <div className="flex items-end justify-between">
          <h2 id="week-h" className="font-serif text-2xl">The next 7 days</h2>
          <Link to="/hearings" className="link inline-flex items-center gap-1 text-sm">
            All hearings <Icon name="arrowRight" size={14} />
          </Link>
        </div>
        <ol className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-3">
          {week.map((d) => (
            <li
              key={d.key}
              aria-current={d.isToday ? "date" : undefined}
              className={`card card-hover px-1 py-3 text-center sm:px-2 ${
                d.count > 0 ? "!border-brass" : ""
              } ${d.isToday ? "ring-2 ring-ink/80" : ""}`}
            >
              <p className="text-xs text-muted">{d.isToday ? "Today" : d.weekday}</p>
              <p className="mt-1 font-serif text-2xl leading-none">{d.day}</p>
              <p className="mt-2 text-xs">
                {d.count > 0 ? (
                  <span className="font-medium text-brass">
                    {d.count}
                    <span className="hidden sm:inline"> {d.count === 1 ? "hearing" : "hearings"}</span>
                  </span>
                ) : (
                  <span className="text-muted">-</span>
                )}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-12 grid gap-10 xl:grid-cols-[1.5fr_1fr]">
        <section aria-labelledby="recent-h" className="min-w-0">
          <div className="flex items-end justify-between">
            <h2 id="recent-h" className="font-serif text-2xl">Recent judgments</h2>
            {recent.length > 0 && (
              <Link to="/judgments" className="link inline-flex items-center gap-1 text-sm">
                View all <Icon name="arrowRight" size={14} />
              </Link>
            )}
          </div>

          {recent.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon="files"
                title="No judgments yet"
                action={
                  <Link to="/upload" className="btn-primary">
                    <Icon name="upload" size={18} />
                    Upload your first judgment
                  </Link>
                }
              >
                Upload a PDF and the summary, key points and citations will appear here.
              </EmptyState>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {recent.map((j, i) => (
                <li key={j.id} className="reveal" style={{ "--d": i + 2 }}>
                  <Link
                    to={`/judgments/${j.id}`}
                    className="card card-hover group flex items-center gap-4 p-4"
                  >
                    <span className="stat-icon">
                      <Icon name="files" size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{j.title}</p>
                      <p className="mt-0.5 truncate text-sm text-muted">
                        {[j.caseNumber, j.court].filter(Boolean).join(", ") || "No case details yet"}
                      </p>
                    </div>
                    <StatusPill status={j.status} />
                    <Icon
                      name="arrowRight"
                      size={18}
                      className="hidden text-muted transition group-hover:translate-x-1 group-hover:text-ink sm:block"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="hearings-h" className="min-w-0">
          <div className="flex items-end justify-between">
            <h2 id="hearings-h" className="font-serif text-2xl">Upcoming hearings</h2>
            {hearings.length > 0 && (
              <Link to="/hearings" className="link inline-flex items-center gap-1 text-sm">
                View all <Icon name="arrowRight" size={14} />
              </Link>
            )}
          </div>

          {hearings.length === 0 ? (
            <div className="mt-4">
              <EmptyState icon="calendar" title="No hearings scheduled">
                Add a date on a judgment's page and it will show up here.
              </EmptyState>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {hearings.map((h, i) => {
                const soon = daysUntil(h.date) <= 3;
                return (
                  <li key={h.id} className="card reveal flex gap-4 p-4" style={{ "--d": i + 2 }}>
                    <DateBlock date={h.date} soon={soon} />
                    <div className="min-w-0">
                      <Link
                        to={`/judgments/${h.judgment.id}`}
                        className="block truncate font-medium hover:underline"
                      >
                        {h.judgment.title}
                      </Link>
                      <p className="truncate text-sm text-muted">
                        {h.purpose || h.judgment.caseNumber || "Hearing"}
                      </p>
                      <p className={`mt-1 text-sm ${soon ? "font-medium text-brass" : "text-muted"}`}>
                        {whenLabel(h.date)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="reveal mt-14 grid gap-10 border-t border-rule pt-10 xl:grid-cols-2" style={{ "--d": 6 }}>
        <section aria-labelledby="cited-h" className="min-w-0">
          <h2 id="cited-h" className="font-serif text-2xl">Most cited authorities</h2>
          <p className="mt-1 text-sm text-muted">Citations that appear in more than one of your judgments.</p>
          {topCitations.length === 0 ? (
            <div className="mt-4">
              <EmptyState icon="quote" title="Nothing yet">
                Once two judgments cite the same case, it shows up here.
              </EmptyState>
            </div>
          ) : (
            <ul className="card mt-4 space-y-4 p-5">
              {topCitations.map((c, i) => (
                <BarRow key={c.label} label={c.label} value={c.count} max={maxCite} unit="judgment" index={i} />
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="lang-h" className="min-w-0">
          <h2 id="lang-h" className="font-serif text-2xl">Languages</h2>
          <p className="mt-1 text-sm text-muted">The language of your summarized judgments.</p>
          {languages.length === 0 ? (
            <div className="mt-4">
              <EmptyState icon="files" title="Nothing yet">
                Summarize a judgment to see this.
              </EmptyState>
            </div>
          ) : (
            <ul className="card mt-4 space-y-4 p-5">
              {languages.map((l, i) => (
                <BarRow
                  key={l.name}
                  label={l.name}
                  value={l.count}
                  max={maxLang}
                  unit="judgment"
                  index={i}
                  color="bg-ink"
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
