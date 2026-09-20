"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";

export { CATEGORIES, ACCENT, categoryAccent } from "@/lib/theme";

export function timeAgo(date) {
  if (!date) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function CardImage({ src, alt }) {
  const [failed, setFailed] = useState(!src);

  if (!src || failed) {
    return <div className="absolute inset-0 bg-[var(--surface-soft)]" />;
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
}

// A single story: photo inset within a white card (padding around the
// image, not full-bleed), category-colored source tag, serif headline,
// short blurb, and a plain text "Read more" link. No tilt, no cursor
// -tracked glow, no gradient ring — a quiet hover lift is the only motion.
export function GlossyCard({ story }) {
  return (
    <a
      href={story.url}
      target="_blank"
      rel="noopener noreferrer"
      className="story-card group flex flex-col rounded-2xl p-3 no-underline"
    >
      <div className="relative h-40 rounded-xl overflow-hidden mb-1.5">
        <CardImage src={story.imageUrl} alt={story.title} />
        {story.isNew && (
          <span className="category-pill absolute top-3 right-3" style={{ backgroundColor: "var(--accent)" }}>
            New
          </span>
        )}
      </div>
      {story.imageUrl && story.imageCredit && (
        <span className="font-sans text-[10px] text-[var(--text-40)] px-2 mb-2.5">
          Photo: {story.imageCredit}
        </span>
      )}
      <div className="px-2 pb-2 flex flex-col flex-1">
        <span className="font-sans text-[11px] font-semibold uppercase tracking-widest text-[var(--text-40)] mb-2">
          {story.source}
        </span>
        <h3 className="font-display text-lg font-semibold leading-snug text-[var(--text-100)] mb-2">
          {story.title}
        </h3>
        <p className="text-sm text-[var(--text-60)] leading-relaxed line-clamp-2 mb-4">
          {story.blurb}
        </p>
        <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)]">
          Read more
          <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </a>
  );
}

export function DigestSkeleton({ compact }) {
  return (
    <div className="animate-pulse">
      {!compact && (
        <div className="card rounded-2xl p-6 md:p-8 mb-8">
          <div className="h-4 w-28 bg-[var(--surface-soft)] rounded-full mb-4" />
          <div className="h-8 w-3/4 bg-[var(--surface-soft)] rounded mb-3" />
          <div className="h-8 w-1/2 bg-[var(--surface-soft)] rounded mb-5" />
          <div className="h-4 w-full bg-[var(--surface-soft)] rounded mb-2" />
          <div className="h-4 w-5/6 bg-[var(--surface-soft)] rounded" />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: compact ? 3 : 6 }).map((_, i) => (
          <div key={i} className="h-64 rounded-2xl bg-[var(--surface-soft)] border border-[var(--card-border)]" />
        ))}
      </div>
    </div>
  );
}

// Turns a raw agent progress event into a human-readable trace line, or
// null for events we don't surface in the UI (e.g. tool_result).
export function formatTraceEvent(event) {
  if (event.type === "tool_call" && event.name === "search_news") {
    return event.isFallback
      ? `Few direct results — broadening to category: ${event.args.query}…`
      : `Searching: "${event.args.query}"…`;
  }
  if (event.type === "tool_call" && event.name === "find_images") {
    const count = event.args.queries?.length || 0;
    return `Sourcing photos for ${count} ${count === 1 ? "story" : "stories"}…`;
  }
  if (event.type === "self_critique") {
    return "Double-checking relevance and originality…";
  }
  if (event.type === "provider_fallback") {
    return `Gemini's daily quota is used up — switching to ${event.provider === "groq" ? "Groq" : event.provider}…`;
  }
  if (event.type === "rate_limited") {
    return `Hit a rate limit — retrying in ${Math.ceil(event.waitMs / 1000)}s…`;
  }
  return null;
}

// Runs the streaming /api/digest agent call and returns the final digest,
// reporting live progress via onTrace. Used by the dashboard once per
// followed-topic card.
export async function streamDigest({ topic, isCategory, storyCount }, onTrace) {
  const res = await fetch("/api/digest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, isCategory, storyCount }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Something went wrong");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalDigest = null;
  let streamError = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line);
      if (event.type === "done") {
        finalDigest = event.digest;
      } else if (event.type === "error") {
        streamError = event.message;
      } else {
        const text = formatTraceEvent(event);
        if (text && onTrace) onTrace(text);
      }
    }
  }

  if (streamError) throw new Error(streamError);
  if (!finalDigest) throw new Error("The agent didn't return a digest.");
  return finalDigest;
}
