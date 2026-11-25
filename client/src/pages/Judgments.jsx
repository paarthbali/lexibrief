import { Link, useSearchParams } from "react-router-dom";
import { useFetch } from "../lib/useFetch";
import { TZ } from "../lib/format";
import { usePageTitle } from "../lib/usePageTitle";
import StatusPill from "../components/StatusPill";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import Icon from "../components/Icon";
import { ListSkeleton } from "../components/Skeleton";

const FILTERS = [
  ["", "All"],
  ["READY", "Ready"],
  ["PROCESSING", "Processing"],
  ["FAILED", "Failed"],
];

function Highlight({ text, q }) {
  if (!q) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp("(" + escaped + ")", "i"));
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark key={i} className="rounded bg-brass-soft/70 px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export default function Judgments() {
  usePageTitle("All judgments");
  const [params, setParams] = useSearchParams();
  const q = (params.get("q") || "").trim().slice(0, 100);
  const status = params.get("status") || "";

  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (status) qs.set("status", status);
  const { data, error, loading, reload } = useFetch(`/judgments${qs.toString() ? `?${qs}` : ""}`);

  function update(nextQ, nextStatus) {
    const next = {};
    if (nextQ) next.q = nextQ;
    if (nextStatus) next.status = nextStatus;
    setParams(next);
  }

  function onSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    update((form.get("q") || "").toString().trim(), status);
  }

  const items = data?.items ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Library"
        title="All judgments"
        subtitle="Search by title, parties, court, summary, or anything in the judgment text."
        actions={
          <Link to="/upload" className="btn-primary">
            <Icon name="upload" size={18} />
            Upload judgment
          </Link>
        }
      />

      <div className="reveal mt-8 max-w-3xl space-y-4" style={{ "--d": 1 }}>
        {/* key remounts the box so it follows the address bar (e.g. after "Clear") */}
        <form key={q} onSubmit={onSubmit} role="search" className="flex gap-3">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search judgments</span>
            <Icon
              name="search"
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search, for example bail, कब्जा, Section 438"
              className="field field-icon-left"
            />
          </label>
          <button className="btn-primary">Search</button>
        </form>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by status">
          {FILTERS.map(([value, label]) => {
            const active = status === value;
            return (
              <button
                key={label}
                type="button"
                onClick={() => update(q, value)}
                aria-pressed={active}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                  active
                    ? "border-ink bg-ink text-white shadow-sm"
                    : "border-rule bg-white text-muted hover:border-ink/50 hover:text-ink"
                }`}
              >
                {label}
              </button>
            );
          })}
          {(q || status) && (
            <Link to="/judgments" className="link ml-1 text-sm text-muted">
              Clear filters
            </Link>
          )}
        </div>
      </div>

      <div className="mt-8 max-w-3xl">
        {error ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : loading ? (
          <ListSkeleton rows={4} />
        ) : items.length === 0 ? (
          q || status ? (
            <EmptyState
              icon="search"
              title="Nothing found"
              action={
                <Link to="/judgments" className="btn-secondary btn-sm">
                  Clear filters
                </Link>
              }
            >
              Try a different word, or clear the filters.
            </EmptyState>
          ) : (
            <EmptyState
              icon="files"
              title="No judgments yet"
              action={
                <Link to="/upload" className="btn-primary">
                  <Icon name="upload" size={18} />
                  Upload a judgment
                </Link>
              }
            >
              Upload a PDF to see it here.
            </EmptyState>
          )
        ) : (
          <>
            <p className="mb-3 text-sm text-muted" aria-live="polite">
              {items.length} {items.length === 1 ? "judgment" : "judgments"}
              {items.length === 30 ? " (showing the latest 30)" : ""}
            </p>
            <ul className="space-y-3">
              {items.map((j, i) => {
                const meta = [j.caseNumber, j.court].filter(Boolean).join(", ");
                const uploaded = new Date(j.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  timeZone: TZ,
                });
                return (
                  <li key={j.id} className="reveal" style={{ "--d": Math.min(i, 8) }}>
                    <Link to={`/judgments/${j.id}`} className="card card-hover block p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-medium">
                            <Highlight text={j.title} q={q} />
                          </p>
                          {j.parties && (
                            <p className="mt-0.5 text-sm">
                              <Highlight text={j.parties} q={q} />
                            </p>
                          )}
                          <p className="mt-0.5 text-sm text-muted">
                            {[meta, uploaded].filter(Boolean).join(", ")}
                          </p>
                        </div>
                        <StatusPill status={j.status} />
                      </div>

                      {j.summary && (
                        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink/80">
                          <Highlight text={j.summary} q={q} />
                        </p>
                      )}
                      {j.snippet && (
                        <p className="mt-3 rounded-r-lg border-l-2 border-brass bg-brass/5 py-1.5 pl-3 text-sm leading-relaxed text-muted">
                          <Highlight text={j.snippet} q={q} />
                        </p>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
