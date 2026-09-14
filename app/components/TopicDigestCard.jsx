"use client";

import { GlossyCard, DigestSkeleton, timeAgo } from "@/app/components/NewsCards";

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

  return (
    <section
      className="topic-card relative rounded-3xl border p-6 md:p-8 overflow-hidden"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--card-border)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <span
          className="inline-block px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest font-medium text-white"
          style={{ backgroundImage: "var(--brand-gradient)" }}
        >
          {topic}
        </span>

        {generatedAt && !loading && (
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-40)]">
            Updated {timeAgo(generatedAt)}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onGenerate}
            disabled={loading}
            className="tag-pill px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-widest text-[var(--text-70)] hover:text-[var(--text-100)] disabled:opacity-40"
          >
            {loading ? "Working…" : hasDigest ? "Refresh" : "Generate"}
          </button>
          <button
            onClick={onRemove}
            className="tag-pill tag-pill-danger px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-widest text-[var(--text-50)]"
          >
            Unfollow
          </button>
        </div>
      </div>

      {loading && (
        <div>
          <p className="font-mono text-xs text-[var(--text-50)] flex items-center gap-2 mb-4">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            {trace?.length ? trace[trace.length - 1] : "Agent is warming up…"}
          </p>
          <DigestSkeleton compact />
        </div>
      )}

      {!loading && error && (
        <div
          className="rounded-2xl border p-5 text-sm"
          style={{
            backgroundColor: "var(--error-bg)",
            borderColor: "var(--error-border)",
            color: "var(--error-text)",
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && !hasDigest && (
        <div className="rounded-2xl bg-[var(--surface-10)] border border-[var(--border-10)] p-5 text-sm text-[var(--text-50)]">
          No digest yet for this topic — click Generate above.
        </div>
      )}

      {!loading && !error && isEmpty && (
        <div className="rounded-2xl bg-[var(--surface-10)] border border-[var(--border-10)] p-5 text-sm text-[var(--text-50)]">
          The agent came back empty-handed on this one — try refreshing later.
        </div>
      )}

      {!loading && !error && hasDigest && !isEmpty && (
        <>
          <h3 className="font-display text-xl md:text-2xl font-bold leading-snug mb-2 text-[var(--text-100)]">
            {digest.headline}
          </h3>
          <div
            className="h-[3px] w-16 rounded-full mb-4"
            style={{ backgroundImage: "linear-gradient(90deg, #2563eb, #7c3aed, #a855f7)" }}
          />
          <p className="w-full text-[var(--text-85)] leading-relaxed mb-6 text-justify">
            {digest.leadParagraph}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {digest.stories.map((story, i) => (
              <GlossyCard key={i} story={story} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
