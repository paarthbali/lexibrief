import { Link, useParams } from "react-router-dom";
import { useFetch } from "../lib/useFetch";
import { formatDate } from "../lib/format";
import { istDayRange } from "../lib/ist";
import { usePageTitle } from "../lib/usePageTitle";
import SummaryButton from "../components/SummaryButton";
import AutoSummarize from "../components/AutoSummarize";
import RetryButton from "../components/RetryButton";
import DeleteButton from "../components/DeleteButton";
import SimilarJudgments from "../components/SimilarJudgments";
import HearingManager from "../components/HearingManager";
import StatusPill from "../components/StatusPill";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import { Skeleton } from "../components/Skeleton";

function isRecent(date) {
  return Date.now() - new Date(date).getTime() < 15 * 60 * 1000;
}

function DetailSkeleton() {
  return (
    <div role="status" aria-label="Loading judgment" className="space-y-8">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-2/3" />
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

export default function JudgmentDetail() {
  const { id } = useParams();
  const { data: j, error, loading, reload } = useFetch(`/judgments/${id}`);
  usePageTitle(j?.title || "Judgment");

  if (loading) return <DetailSkeleton />;

  if (error?.status === 404) {
    return (
      <EmptyState
        icon="files"
        title="Judgment not found"
        action={
          <Link to="/judgments" className="btn-primary">
            Back to judgments
          </Link>
        }
      >
        It may have been deleted, or it belongs to another account.
      </EmptyState>
    );
  }
  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  const hasSummary = Boolean(j.summary);
  const contentLang = j.language === "Hindi" ? "hi" : "en";
  const todayStart = istDayRange(0).start;
  const nextHearing = j.hearings.find((h) => new Date(h.date) >= todayStart);
  const stats = [
    { label: "Pages", value: j.pageCount ?? "-", icon: "files" },
    { label: "Words", value: j.words ? j.words.toLocaleString("en-IN") : "-", icon: "quote" },
    { label: "Citations", value: hasSummary ? j.citations.length : "-", icon: "scale" },
    {
      label: "Next hearing",
      value: nextHearing
        ? formatDate(nextHearing.date, { day: "numeric", month: "short", year: "numeric" })
        : "None",
      icon: "calendar",
    },
  ];
  const sections = [
    j.hasText && { id: "summary", label: "Summary" },
    hasSummary && j.keyPoints.length > 0 && { id: "points", label: "Key points" },
    hasSummary && { id: "similar", label: "Similar" },
    { id: "hearings", label: "Hearings" },
    hasSummary && { id: "citations", label: "Citations" },
    j.preview && { id: "text", label: "Full text" },
  ].filter(Boolean);
  const chips = [j.caseNumber, j.court, j.language].filter(Boolean);

  return (
    <>
      <nav aria-label="Breadcrumb" className="reveal">
        <Link to="/judgments" className="link inline-flex items-center gap-1.5 text-sm text-muted">
          <Icon name="arrowLeft" size={15} />
          All judgments
        </Link>
      </nav>

      <header className="reveal mt-4 flex flex-wrap items-start justify-between gap-5" style={{ "--d": 1 }}>
        <div className="min-w-0 max-w-2xl">
          <div className="mb-3 flex items-center gap-3">
            <StatusPill status={j.status} />
          </div>
          <h1 className="font-serif text-3xl leading-tight sm:text-4xl">{j.title}</h1>
          {j.parties && (
            <p lang={contentLang} className="mt-2 text-lg text-ink/85">
              {j.parties}
            </p>
          )}
          {chips.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {chips.map((c) => (
                <li key={c} className="rounded-full border border-rule bg-white px-3 py-1 text-sm text-muted">
                  {c}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-muted">No case details added</p>
          )}
        </div>
        <div className="flex flex-wrap items-start gap-3">
          <a href={j.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
            <Icon name="external" size={18} />
            Open original PDF
          </a>
          <DeleteButton judgmentId={j.id} />
        </div>
      </header>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className="card reveal flex items-center gap-3 p-4" style={{ "--d": i + 2 }}>
            <span className="stat-icon hidden sm:grid">
              <Icon name={s.icon} size={18} />
            </span>
            <div className="min-w-0">
              <dt className="text-xs text-muted sm:text-sm">{s.label}</dt>
              <dd className="truncate font-serif text-lg sm:text-2xl">{s.value}</dd>
            </div>
          </div>
        ))}
      </dl>

      {j.status === "FAILED" && (
        <div className="mt-8">
          <p role="alert" className="notice-error">
            <Icon name="alert" size={18} />
            {j.errorMessage || "This judgment could not be processed."}
          </p>
          <div className="mt-4">
            <RetryButton judgmentId={j.id} onDone={reload} />
          </div>
        </div>
      )}

      {hasSummary && j.outcome && (
        <div
          className="reveal mt-8 rounded-r-xl border-l-4 border-brass bg-brass/10 px-4 py-4 sm:px-6 sm:py-5"
          style={{ "--d": 3 }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-brass">Outcome</p>
          <p lang={contentLang} className="mt-1 font-serif text-xl leading-snug sm:text-2xl">
            {j.outcome}
          </p>
        </div>
      )}

      <nav
        aria-label="Sections"
        className="sticky top-16 z-30 -mx-5 mt-8 overflow-x-auto border-b border-rule bg-paper/90 px-5 backdrop-blur sm:-mx-8 sm:px-8 lg:top-0 lg:-mx-12 lg:px-12"
      >
        <ul className="flex gap-5 text-sm sm:gap-6">
          {sections.map((sec) => (
            <li key={sec.id}>
              <a
                href={`#${sec.id}`}
                className="block whitespace-nowrap border-b-2 border-transparent py-3 text-muted transition hover:border-brass hover:text-ink"
              >
                {sec.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1fr)_320px]">
        {j.hasText ? (
          <section id="summary" className="min-w-0 max-w-3xl scroll-mt-32 lg:scroll-mt-16">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-serif text-2xl">Summary</h2>
              {hasSummary && <SummaryButton judgmentId={j.id} hasSummary onDone={reload} />}
            </div>

            {hasSummary ? (
              <>
                <div className="card reveal mt-4 p-5 sm:p-8" style={{ "--d": 1 }}>
                  <p className="eyebrow mb-3">AI summary</p>
                  <p lang={contentLang} className="text-base leading-relaxed sm:text-lg">
                    {j.summary}
                  </p>
                </div>

                {j.keyPoints.length > 0 && (
                  <div id="points" className="mt-10 scroll-mt-32 lg:scroll-mt-16">
                    <h3 className="font-serif text-2xl">Key legal points</h3>
                    <ol lang={contentLang} className="mt-4 space-y-3">
                      {j.keyPoints.map((p, i) => (
                        <li
                          key={i}
                          className="card card-hover reveal flex gap-4 p-4"
                          style={{ "--d": Math.min(i, 8) }}
                        >
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink font-serif text-sm text-white">
                            {i + 1}
                          </span>
                          <span className="leading-relaxed">{p}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* key restarts the comparison after the summary is regenerated */}
                <div id="similar" className="scroll-mt-32 lg:scroll-mt-16">
                  <SimilarJudgments key={j.summarizedAt} judgmentId={j.id} />
                </div>

                <p className="notice-info mt-10">
                  <Icon name="info" size={18} />
                  AI-generated. Check the summary and citations against the original judgment before
                  relying on them.
                </p>
              </>
            ) : isRecent(j.createdAt) ? (
              <AutoSummarize judgmentId={j.id} onDone={reload} />
            ) : (
              <div className="card mt-4 p-6">
                <p className="mb-4 text-muted">No summary yet.</p>
                <SummaryButton judgmentId={j.id} hasSummary={false} onDone={reload} />
              </div>
            )}
          </section>
        ) : (
          <div />
        )}

        <aside className="min-w-0 space-y-6">
          <div id="hearings" className="scroll-mt-32 lg:scroll-mt-16">
            <HearingManager judgmentId={j.id} hearings={j.hearings} onChange={reload} />
          </div>

          {hasSummary && (
            <div id="citations" className="card scroll-mt-32 p-5 lg:scroll-mt-16">
              <h3 className="font-serif text-xl">
                Citations{j.citations.length > 0 ? ` (${j.citations.length})` : ""}
              </h3>
              {j.citations.length === 0 ? (
                <p className="mt-3 text-sm text-muted">No citations found in this judgment.</p>
              ) : (
                <ul className="mt-4 flex max-h-[28rem] flex-wrap gap-2 overflow-y-auto pr-1">
                  {j.citations.map((c) => (
                    <li
                      key={c.id}
                      className="rounded-lg border border-rule bg-paper/60 px-2.5 py-1.5 text-sm transition hover:border-brass/60 hover:bg-brass/5"
                    >
                      {c.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </aside>
      </div>

      {j.preview && (
        <details id="text" className="group card mt-12 max-w-3xl scroll-mt-32 lg:scroll-mt-16">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 font-serif text-xl [&::-webkit-details-marker]:hidden">
            <Icon name="arrowRight" size={18} className="transition-transform group-open:rotate-90" />
            Extracted text
          </summary>
          <div className="border-t border-rule p-5">
            <pre className="max-h-[32rem] overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {j.preview}
            </pre>
            {j.previewTruncated && (
              <p className="mt-3 text-sm text-muted">
                Showing the first {j.previewChars.toLocaleString("en-IN")} characters.
              </p>
            )}
          </div>
        </details>
      )}
    </>
  );
}
