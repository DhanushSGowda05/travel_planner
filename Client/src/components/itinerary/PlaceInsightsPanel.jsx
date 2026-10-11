
export default function PlaceInsightsPanel({
  place,
  insights,
  loading,
  error,
  onRetry,
  onClose,
}) {
  if (!place || String(place.id) === "LUNCH_BREAK") {
    return null;
  }

  return (
    <section
        className="max-h-[35vh] overflow-y-auto rounded-xl border border-white/40 bg-white/70 p-4 shadow-xl backdrop-blur-md"      aria-live="polite"
      aria-label="AI place insights"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            AI Travel Guide
          </p>
          <h2 className="mt-1 text-base font-semibold leading-snug text-foreground">
            {place.name}
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close place insights"
          title="Close insights"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-teal-600"
        >
          <span aria-hidden="true" className="text-xl leading-none">
            ×
          </span>
        </button>
      </div>

      {loading && (
        <p className="mb-3 text-xs text-muted-foreground" role="status">
          Generating insights…
        </p>
      )}

      {loading && !insights && (
        <p className="text-sm text-muted-foreground">
          Preparing an overview, highlights, and visitor tips…
        </p>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            disabled={loading}
            className="mt-2 rounded-md bg-red-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Try again
          </button>
        </div>
      )}

      {insights && (
        <div className="space-y-4 pr-1">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Overview
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {insights.overview}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Highlights
            </h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {insights.highlights.map((item, index) => (
                <li key={`${index}-${item}`}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Visitor tips
            </h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {insights.tips.map((item, index) => (
                <li key={`${index}-${item}`}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Suggested visit duration
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {insights.suggested_duration}
            </p>
          </div>
        </div>
      )}

      {!loading && !error && !insights && (
        <p className="text-sm text-muted-foreground">
          Place insights are not available yet.
        </p>
      )}
    </section>
  );
}
