"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, ArrowLeft, X, Check, ArrowUpRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, categoryAccent } from "@/lib/theme";
import MastHead from "@/app/components/MastHead";
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
    <main className="min-h-screen bg-[var(--bg-panel)]">
      <MastHead
        links={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/settings", label: "Settings" },
        ]}
        active="/settings"
        actions={<ThemeToggle />}
      />

      <header className="max-w-3xl mx-auto px-6 pt-10 pb-6">
        <Link
          href="/dashboard"
          className="tag-pill inline-flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full mb-5"
        >
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--surface-soft)]">
            <ArrowLeft size={12} />
          </span>
          Back to dashboard
        </Link>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-[var(--text-100)] mb-2">
          Your topics
        </h1>
        <p className="text-[var(--text-60)] max-w-xl leading-relaxed">
          Choose which topics your newsroom agent should keep a digest ready
          for. Toggle any category below, or add your own.
        </p>
      </header>

      <div className="max-w-3xl mx-auto px-6 pb-16 space-y-10">
        <section>
          <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--text-100)] mb-3">
            Categories
          </h2>
          <div className="flex flex-wrap gap-2">
            {loadingTopics
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="glass-skeleton rounded-full animate-pulse"
                    style={{ width: 76 + (i % 3) * 22, height: "2.25rem" }}
                  />
                ))
              : CATEGORIES.map((cat) => {
                  const active = isFollowed(cat, true);
                  const busy = pending === keyOf(cat, true);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      disabled={busy}
                      className={`tag-pill px-4 py-2 rounded-full inline-flex items-center gap-1.5 disabled:opacity-70 ${
                        active ? "is-active" : ""
                      }`}
                    >
                      {busy ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        active && <Check size={13} />
                      )}
                      {cat}
                    </button>
                  );
                })}
          </div>
        </section>

        <section>
          <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--text-100)] mb-3">
            Your own topics
          </h2>
          <form onSubmit={handleAddCustom} className="flex gap-2 mb-4">
            <input
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="e.g. generative AI regulation, F1, lunar missions…"
              className="flex-1 border border-[var(--border)] bg-[var(--surface)] px-4 py-2 rounded-full text-sm text-[var(--text-100)] placeholder-[var(--text-40)] focus:outline-none focus:border-[var(--accent)]"
            />
            <button type="submit" className="btn btn-accent">
              Add
            </button>
          </form>

          {loadingTopics ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="glass-skeleton rounded-full animate-pulse"
                  style={{ width: 90 + (i % 2) * 30, height: "2.25rem" }}
                />
              ))}
            </div>
          ) : customTopics.length === 0 ? (
            <p className="text-[var(--text-60)] text-sm">No custom topics yet — add one above.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {customTopics.map((t) => {
                const busy = pending === keyOf(t.topic, false);
                return (
                  <span
                    key={t.topic}
                    className="tag-pill flex items-center gap-2 pl-4 pr-2.5 py-2 rounded-full"
                  >
                    {t.topic}
                    <button
                      onClick={() => unfollow(t.topic, false)}
                      disabled={busy}
                      className="text-[var(--text-40)] hover:text-[var(--error-text)] disabled:opacity-50"
                      aria-label={`Remove ${t.topic}`}
                    >
                      {busy ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--text-100)] mb-3">
            Order your topics
          </h2>
          {loadingTopics ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass-skeleton rounded-xl h-11 animate-pulse" />
              ))}
            </div>
          ) : topics.length === 0 ? (
            <p className="text-[var(--text-60)] text-sm">
              Follow a topic above to set the order it appears on your dashboard.
            </p>
          ) : (
            <div className="space-y-2">
              {topics.map((t, i) => (
                <div
                  key={keyOf(t.topic, t.is_category)}
                  className="card flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex items-center justify-center w-6 h-6 shrink-0 rounded-full text-[10px] font-sans font-bold text-[#fffdf9]"
                      style={{ backgroundColor: categoryAccent(t.topic) }}
                    >
                      {i + 1}
                    </span>
                    <span className="font-sans text-sm text-[var(--text-85)]">{t.topic}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => moveTopic(i, -1)}
                      disabled={i === 0}
                      className="tag-pill w-7 h-7 flex items-center justify-center rounded-full disabled:opacity-30"
                      aria-label={`Move ${t.topic} up`}
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      onClick={() => moveTopic(i, 1)}
                      disabled={i === topics.length - 1}
                      className="tag-pill w-7 h-7 flex items-center justify-center rounded-full disabled:opacity-30"
                      aria-label={`Move ${t.topic} down`}
                    >
                      <ArrowDown size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <Link href="/dashboard" className="btn btn-accent inline-flex">
          Done — view my dashboard
          <ArrowUpRight size={16} />
        </Link>
      </div>
    </main>
  );
}
