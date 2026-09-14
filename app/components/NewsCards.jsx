"use client";

import { useRef, useState } from "react";

export { CATEGORIES, BRAND_GRADIENT, BRAND_GLOW, TEXT_ACCENT, PAGE_BACKGROUND } from "@/lib/theme";

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
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
          No Photo Available
        </span>
      </div>
    );
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

export function GlossyCard({ story }) {
  const ref = useRef(null);

  function handleMouseMove(e) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    el.style.setProperty("--rx", `${(0.5 - y) * 12}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 12}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    el.style.setProperty("--scale", "1.03");
  }

  function handleMouseLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--scale", "1");
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative block h-80 rounded-3xl overflow-hidden will-change-transform"
      style={{
        transform:
          "perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) scale(var(--scale, 1))",
        transition: "transform 200ms ease, box-shadow 250ms ease",
        boxShadow: "0 20px 40px -18px rgba(139, 92, 246, 0.35)",
      }}
    >
      <CardImage src={story.imageUrl} alt={story.title} />

      {/* Black wash over roughly the bottom half, fading in gradually
          (several stops, not one hard edge) so it blends into the photo
          rather than looking like a pasted-on panel — keeps text readable
          no matter how bright the photo underneath is. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, transparent 30%, rgba(8,6,15,0.2) 48%, rgba(8,6,15,0.6) 65%, rgba(8,6,15,0.9) 84%, rgba(8,6,15,0.98) 100%)",
        }}
      />

      {/* glossy highlight that tracks the cursor — kept subtle so it never
          washes out the text sitting on top of it */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(59,130,246,0.4), transparent 45%)",
          mixBlendMode: "screen",
        }}
      />

      {/* gradient ring border on hover, matching the tag pills */}
      <div className="card-ring absolute inset-0 rounded-3xl pointer-events-none" />

      {story.isNew && (
        <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold text-white shadow-lg"
          style={{ backgroundImage: "linear-gradient(90deg, #2563eb, #7c3aed)" }}
        >
          New
        </span>
      )}

      <div className="absolute inset-0 flex flex-col justify-end p-5 pointer-events-none">
        <span className="self-start mb-3 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold text-white bg-black/50 border border-white/15 backdrop-blur-sm">
          {story.source}
        </span>
        <h3 className="text-white font-display font-bold leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] text-lg">
          {story.title}
        </h3>
        <p className="text-white/85 mt-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)] text-sm line-clamp-2">
          {story.blurb}
        </p>
        <a
          href={story.url}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto self-start mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-widest font-medium text-white transition-transform hover:scale-105"
          style={{
            backgroundImage: "linear-gradient(90deg, #2563eb, #7c3aed, #a855f7)",
            boxShadow: "0 6px 20px -6px rgba(124, 58, 237, 0.7)",
          }}
        >
          Read more
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}

export function DigestSkeleton({ compact }) {
  return (
    <div className="animate-pulse">
      {!compact && (
        <div className="rounded-3xl bg-[var(--surface-10)] border border-[var(--border-10)] p-6 md:p-8 mb-8">
          <div className="h-4 w-28 bg-[var(--surface-10)] rounded-full mb-4" />
          <div className="h-9 w-3/4 bg-[var(--surface-10)] rounded mb-3" />
          <div className="h-9 w-1/2 bg-[var(--surface-10)] rounded mb-5" />
          <div className="h-4 w-full bg-[var(--surface-10)] rounded mb-2" />
          <div className="h-4 w-5/6 bg-[var(--surface-10)] rounded" />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: compact ? 3 : 6 }).map((_, i) => (
          <div
            key={i}
            className="h-80 rounded-3xl bg-[var(--surface-10)] border border-[var(--border-10)]"
          />
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
