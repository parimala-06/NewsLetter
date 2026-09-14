"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, BRAND_GRADIENT, BRAND_GLOW, PAGE_BACKGROUND } from "@/lib/theme";
import ThemeToggle from "@/app/components/ThemeToggle";

export default function Settings() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [customTopic, setCustomTopic] = useState("");
  const [pending, setPending] = useState(null); // topic key currently being toggled

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = "/signin?next=/settings";
        return;
      }
      setUser(data.user);
      setCheckingAuth(false);
    });
  }, [supabase]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/bookmarks")
      .then((res) => res.json())
      .then((data) => setTopics(data.bookmarks || []))
      .finally(() => setLoadingTopics(false));
  }, [user]);

  function keyOf(topic, isCategory) {
    return `${topic}::${isCategory}`;
  }

  function isFollowed(topic, isCategory) {
    return topics.some((t) => t.topic === topic && t.is_category === isCategory);
  }

  async function follow(topic, isCategory) {
    const key = keyOf(topic, isCategory);
    setPending(key);
    setTopics((t) => [...t, { topic, is_category: isCategory }]);
    try {
      await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, isCategory }),
      });
    } finally {
      setPending(null);
    }
  }

  async function unfollow(topic, isCategory) {
    const key = keyOf(topic, isCategory);
    setPending(key);
    setTopics((t) => t.filter((x) => !(x.topic === topic && x.is_category === isCategory)));
    try {
      await fetch("/api/bookmarks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, isCategory }),
      });
    } finally {
      setPending(null);
    }
  }

  function toggleCategory(cat) {
    if (isFollowed(cat, true)) unfollow(cat, true);
    else follow(cat, true);
  }

  async function moveTopic(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= topics.length) return;

    const reordered = [...topics];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    setTopics(reordered);

    await fetch("/api/bookmarks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order: reordered.map((t) => ({ topic: t.topic, isCategory: t.is_category })),
      }),
    });
  }

  function handleAddCustom(e) {
    e.preventDefault();
    const topic = customTopic.trim();
    if (!topic) return;
    if (isFollowed(topic, false)) {
      setCustomTopic("");
      return;
    }
    follow(topic, false);
    setCustomTopic("");
  }

  const customTopics = topics.filter((t) => !t.is_category);

  if (checkingAuth) return null;

  return (
    <main
      className="min-h-screen text-[var(--text-100)] electric-bg"
      style={{ background: PAGE_BACKGROUND }}
    >
      <div className="ticker-bar" />
      <header className="max-w-3xl mx-auto px-6 pt-10 pb-6">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/dashboard"
            className="tag-pill group inline-flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full font-mono text-xs uppercase tracking-widest text-[var(--text-70)] hover:text-[var(--text-100)]"
          >
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--surface-10)] text-base leading-none transition-transform duration-200 group-hover:-translate-x-0.5">
              ←
            </span>
            Back to dashboard
          </Link>
          <ThemeToggle />
        </div>
        <h1 className="gradient-text font-display text-3xl md:text-4xl font-black tracking-tight mb-2">
          Your topics
        </h1>
        <p className="text-[var(--text-85)] max-w-xl">
          Choose which topics your newsroom agent should keep a digest ready
          for. Toggle any category below, or add your own.
        </p>
      </header>

      <div className="max-w-3xl mx-auto px-6 pb-16 space-y-10">
        <section>
          <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-[var(--text-100)] mb-3">
            Categories
          </h2>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const active = isFollowed(cat, true);
              const busy = pending === keyOf(cat, true);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  disabled={busy || loadingTopics}
                  className={`tag-pill px-4 py-2 rounded-full font-mono text-xs uppercase tracking-wide disabled:opacity-50 ${
                    active ? "is-active text-[var(--text-100)]" : "text-[var(--text-80)] hover:text-[var(--text-100)]"
                  }`}
                >
                  {active ? "✓ " : ""}
                  {cat}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-[var(--text-100)] mb-3">
            Your own topics
          </h2>
          <form onSubmit={handleAddCustom} className="flex gap-2 mb-4">
            <input
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="e.g. generative AI regulation, F1, lunar missions…"
              className="flex-1 border border-[var(--border-15)] bg-[var(--surface-5)] px-4 py-2 rounded-full text-sm text-[var(--text-100)] placeholder-[var(--text-50)] focus:outline-none focus:border-violet-400"
            />
            <button
              type="submit"
              className="px-5 py-2 rounded-full font-mono text-xs uppercase tracking-wide text-white transition-transform hover:scale-105"
              style={{ backgroundImage: BRAND_GRADIENT, boxShadow: BRAND_GLOW }}
            >
              Add
            </button>
          </form>

          {customTopics.length === 0 ? (
            <p className="text-[var(--text-70)] text-sm">
              No custom topics yet — add one above.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {customTopics.map((t) => (
                <span
                  key={t.topic}
                  className="tag-pill flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xs uppercase tracking-wide text-[var(--text-80)]"
                >
                  {t.topic}
                  <button
                    onClick={() => unfollow(t.topic, false)}
                    disabled={pending === keyOf(t.topic, false)}
                    className="text-[var(--text-60)] hover:text-rose-300 disabled:opacity-50"
                    aria-label={`Remove ${t.topic}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-[var(--text-100)] mb-3">
            Order your topics
          </h2>
          {topics.length === 0 ? (
            <p className="text-[var(--text-70)] text-sm">
              Follow a topic above to set the order it appears on your dashboard.
            </p>
          ) : (
            <div className="space-y-2">
              {topics.map((t, i) => (
                <div
                  key={keyOf(t.topic, t.is_category)}
                  className="group flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-[var(--surface-5)] border border-[var(--border-10)] transition-all duration-200 hover:border-[var(--border-15)] hover:bg-[var(--surface-10)] hover:shadow-[0_4px_16px_-6px_rgba(124,58,237,0.35)]"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex items-center justify-center w-6 h-6 shrink-0 rounded-full text-[10px] font-mono font-bold text-white transition-transform duration-200 group-hover:scale-110"
                      style={{ backgroundImage: "var(--brand-gradient)" }}
                    >
                      {i + 1}
                    </span>
                    <span className="font-mono text-xs uppercase tracking-wide text-[var(--text-85)]">
                      {t.topic}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => moveTopic(i, -1)}
                      disabled={i === 0}
                      className="tag-pill w-7 h-7 flex items-center justify-center rounded-full text-[var(--text-70)] hover:text-[var(--text-100)] disabled:opacity-30"
                      aria-label={`Move ${t.topic} up`}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveTopic(i, 1)}
                      disabled={i === topics.length - 1}
                      className="tag-pill w-7 h-7 flex items-center justify-center rounded-full text-[var(--text-70)] hover:text-[var(--text-100)] disabled:opacity-30"
                      aria-label={`Move ${t.topic} down`}
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <Link
          href="/dashboard"
          className="inline-block px-6 py-2.5 rounded-full font-mono text-xs uppercase tracking-wide text-white transition-transform hover:scale-105"
          style={{ backgroundImage: BRAND_GRADIENT, boxShadow: BRAND_GLOW }}
        >
          Done — view my dashboard
        </Link>
      </div>
    </main>
  );
}
