"use client";

import { Loader2 } from "lucide-react";
import { GlossyCard, DigestSkeleton, timeAgo, categoryAccent } from "@/app/components/NewsCards";

// One followed topic, rendered as a single big card: a topic label, an
// overall summary (headline + lead paragraph), and every story for that
// topic laid out as smaller cards inside it — so the whole topic can be
// read in one pass on the dashboard without navigating elsewhere.
export default function TopicDigestCard({
  topic,
  digest,
  loading,
  error,
  generatedAt,
  trace,
  onGenerate,
  onRemove,
}) {
  const hasDigest = !!digest;
  const isEmpty = hasDigest && !digest.stories?.length;
  const accent = categoryAccent(topic);

  return (
    <section className="topic-card rounded-2xl p-6 md:p-8">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <span className="category-pill" style={{ backgroundColor: accent }}>
          {topic}
        </span>

        {generatedAt && !loading && (
          <span className="font-sans text-xs text-[var(--text-40)]">Updated {timeAgo(generatedAt)}</span>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onGenerate}
            disabled={loading}
            className="tag-pill px-3 py-1.5 rounded-full disabled:opacity-40"
          >
            {loading ? "Working…" : hasDigest ? "Refresh" : "Generate"}
          </button>
          <button onClick={onRemove} className="tag-pill tag-pill-danger px-3 py-1.5 rounded-full">
            Unfollow
          </button>
        </div>
      </div>

      {loading && (
        <div>
          <div className="status-glass mb-5">
            <Loader2 size={15} className="animate-spin text-[var(--accent)] shrink-0" />
            <span className="status-glass-text">
              {trace?.length ? trace[trace.length - 1] : "Agent is warming up…"}
            </span>
          </div>
          <DigestSkeleton compact />
        </div>
      )}

      {!loading && error && (
        <div
          className="rounded-xl border p-5 text-sm"
          style={{ backgroundColor: "var(--error-bg)", borderColor: "var(--error-border)", color: "var(--error-text)" }}
        >
          {error}
        </div>
      )}

      {!loading && !error && !hasDigest && (
        <div className="rounded-xl bg-[var(--surface-soft)] border border-[var(--card-border)] p-5 text-sm text-[var(--text-50)]">
          No digest yet for this topic — click Generate above.
        </div>
      )}

      {!loading && !error && isEmpty && (
        <div className="rounded-xl bg-[var(--surface-soft)] border border-[var(--card-border)] p-5 text-sm text-[var(--text-50)]">
          The agent came back empty-handed on this one — try refreshing later.
        </div>
      )}

      {!loading && !error && hasDigest && !isEmpty && (
        <>
          <h3 className="font-display text-xl md:text-2xl font-semibold leading-snug mb-3 text-[var(--text-100)]">
            {digest.headline}
          </h3>
          <p className="w-full text-[var(--text-70)] leading-relaxed mb-6">{digest.leadParagraph}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {digest.stories.map((story, i) => (
              <GlossyCard key={i} story={story} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
