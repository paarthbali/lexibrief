import { Link } from "react-router-dom";
import { useFetch } from "../lib/useFetch";
import EmbedAndRefresh from "./EmbedAndRefresh";
import Icon from "./Icon";
import { Skeleton } from "./Skeleton";

// Rough cut-offs. Adjust them after you test with your own judgments.
const VERY_SIMILAR = 0.85;
const SIMILAR = 0.75;

function strengthLabel(s) {
  if (s >= VERY_SIMILAR) return "Very similar";
  if (s >= SIMILAR) return "Similar";
  return "Loosely related";
}

export default function SimilarJudgments({ judgmentId }) {
  const { data, error, loading, reload } = useFetch(`/judgments/${judgmentId}/similar`);

  if (error) return null;

  const missing = data?.missing ?? 0;
  const rows = data?.rows ?? [];
  const sharedBy = data?.sharedBy ?? {};

  return (
    <div className="mt-10">
      <h3 className="font-serif text-2xl">Similar judgments</h3>
      <p className="mt-1 text-sm text-muted">Matched by meaning across your other uploads.</p>

      {loading ? (
        <div className="mt-4 space-y-3" role="status" aria-label="Looking for similar judgments">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : missing > 0 ? (
        <EmbedAndRefresh onDone={reload} />
      ) : rows.length === 0 ? (
        <p className="card mt-4 flex items-center gap-3 p-4 text-sm text-muted">
          <Icon name="info" size={18} className="text-brass" />
          Nothing to compare yet. Upload more judgments and similar ones will appear here.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((r) => {
            const sim = Math.max(0, Math.min(1, Number(r.similarity)));
            const sharedCites = sharedBy[r.id] || [];
            const meta = [r.caseNumber, r.court].filter(Boolean).join(", ");
            return (
              <li key={r.id}>
                <Link to={`/judgments/${r.id}`} className="card card-hover block p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <p className="font-medium">{r.title}</p>
                      {meta && <p className="mt-0.5 text-sm text-muted">{meta}</p>}
                      {r.outcome && <p className="mt-1 text-sm">{r.outcome}</p>}
                    </div>
                    <div className="shrink-0 sm:w-28 sm:text-right">
                      <p className="text-sm">{strengthLabel(sim)}</p>
                      <div className="mt-1.5 h-1.5 w-24 sm:ml-auto overflow-hidden rounded-full bg-rule" aria-hidden="true">
                        <div
                          className="h-1.5 rounded-full bg-brass transition-all duration-700"
                          style={{ width: `${Math.round(sim * 100)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted">{Math.round(sim * 100)}% match</p>
                    </div>
                  </div>
                  {sharedCites.length > 0 && (
                    <p className="mt-3 rounded-r-lg border-l-2 border-brass bg-brass/5 py-1.5 pl-3 text-sm text-muted">
                      Shares {sharedCites.length} {sharedCites.length === 1 ? "citation" : "citations"}:{" "}
                      {sharedCites.slice(0, 3).join(", ")}
                      {sharedCites.length > 3 ? "…" : ""}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
