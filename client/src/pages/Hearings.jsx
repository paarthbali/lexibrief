import { Link } from "react-router-dom";
import { useFetch } from "../lib/useFetch";
import { TZ, daysUntil, whenLabel } from "../lib/format";
import { usePageTitle } from "../lib/usePageTitle";
import PageHeader from "../components/PageHeader";
import DateBlock from "../components/DateBlock";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import Icon from "../components/Icon";
import { ListSkeleton } from "../components/Skeleton";

function Row({ h, muted, index }) {
  const soon = !muted && daysUntil(h.date) <= 3;
  return (
    <li className="card card-hover reveal flex gap-4 p-4" style={{ "--d": Math.min(index, 8) }}>
      <DateBlock date={h.date} soon={soon} muted={muted} />
      <div className="min-w-0 flex-1">
        <Link to={`/judgments/${h.judgment.id}`} className="block truncate font-medium hover:underline">
          {h.judgment.title}
        </Link>
        <p className="text-sm text-muted">
          {[h.judgment.caseNumber, h.judgment.court, h.purpose].filter(Boolean).join(", ") || "Hearing"}
        </p>
        {!muted && (
          <p className={`mt-1 text-sm ${soon ? "font-medium text-brass" : "text-muted"}`}>
            {whenLabel(h.date)}
          </p>
        )}
      </div>
    </li>
  );
}

export default function Hearings() {
  usePageTitle("Hearings");
  const { data, error, loading, reload } = useFetch("/hearings");

  const header = (
    <PageHeader
      eyebrow="Calendar"
      title="Hearings"
      subtitle="Hearing dates from all your judgments. Add or change a date on the judgment's page."
    />
  );

  if (loading) {
    return (
      <>
        {header}
        <div className="mt-10 max-w-2xl"><ListSkeleton rows={3} /></div>
      </>
    );
  }
  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  const { upcoming, past } = data;

  // group upcoming hearings by month
  const groups = new Map();
  for (const h of upcoming) {
    const key = new Date(h.date).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
      timeZone: TZ,
    });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(h);
  }

  return (
    <>
      {header}

      {upcoming.length === 0 ? (
        <div className="mt-10 max-w-xl">
          <EmptyState
            icon="calendar"
            title="No upcoming hearings"
            action={
              <Link to="/judgments" className="btn-primary">
                Go to judgments
              </Link>
            }
          >
            Open a judgment and add its next hearing date. You will get an email the day before.
          </EmptyState>
        </div>
      ) : (
        <div className="mt-10 max-w-2xl space-y-10">
          {[...groups.entries()].map(([month, items]) => (
            <section key={month}>
              <h2 className="flex items-center gap-3 font-serif text-xl">
                {month}
                <span className="h-px flex-1 bg-rule" />
              </h2>
              <ul className="mt-4 space-y-3">
                {items.map((h, i) => (
                  <Row key={h.id} h={h} index={i} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {past.length > 0 && (
        <details className="group mt-12 max-w-2xl">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-serif text-xl [&::-webkit-details-marker]:hidden">
            <Icon name="arrowRight" size={18} className="transition-transform group-open:rotate-90" />
            Past hearings
          </summary>
          <ul className="mt-4 space-y-3">
            {past.map((h, i) => (
              <Row key={h.id} h={h} muted index={i} />
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
