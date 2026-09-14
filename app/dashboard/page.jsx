"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BRAND_GRADIENT, BRAND_GLOW, PAGE_BACKGROUND } from "@/lib/theme";
import { streamDigest } from "@/app/components/NewsCards";
import TopicDigestCard from "@/app/components/TopicDigestCard";
import ThemeToggle from "@/app/components/ThemeToggle";

function topicKey(topic, isCategory) {
  return `${topic}::${isCategory}`;
}

export default function Dashboard() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [topics, setTopics] = useState(null); // null = not loaded yet
  // Per-topic state, keyed by topicKey: { digest, generatedAt, loading, error, trace }
  const [byTopic, setByTopic] = useState({});
  const hydrated = useRef(new Set());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = "/signin?next=/dashboard";
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
      .catch(() => setTopics([]));
  }, [user]);

  function patchTopic(key, patch) {
    setByTopic((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  async function generateTopic(topic, isCategory) {
    const key = topicKey(topic, isCategory);
    patchTopic(key, { loading: true, error: null, trace: [] });
    try {
      const digest = await streamDigest(
        { topic, isCategory, storyCount: "standard" },
        (line) =>
          setByTopic((prev) => ({
            ...prev,
            [key]: { ...prev[key], trace: [...(prev[key]?.trace || []), line] },
          }))
      );
      patchTopic(key, { digest, generatedAt: new Date(), loading: false });
    } catch (err) {
      patchTopic(key, { error: err.message, loading: false });
    }
  }

  // Once topics are known, hydrate each one from its cached digest_history
  // row (no quota cost), then auto-generate only the ones that have never
  // been generated before — one at a time, so a brand-new dashboard with
  // several followed topics doesn't burst the daily quota in parallel.
  useEffect(() => {
    if (!topics) return;

    let cancelled = false;

    (async () => {
      for (const t of topics) {
        const key = topicKey(t.topic, t.is_category);
        if (hydrated.current.has(key)) continue;

        try {
          const res = await fetch(
            `/api/digest/latest?topic=${encodeURIComponent(t.topic)}&isCategory=${t.is_category}`
          );
          const data = await res.json();
          // Only claim this topic as hydrated once we know THIS run is the
          // one applying the result — otherwise, under React 18 Strict
          // Mode's dev-only double-invoke, the first (soon-to-be-cancelled)
          // run can mark a topic hydrated and then discard its own fetch
          // result, leaving the second (real) run to skip it entirely and
          // the card stuck on "no digest yet" forever.
          if (cancelled) return;
          hydrated.current.add(key);

          if (data.digest) {
            patchTopic(key, {
              digest: data.digest,
              generatedAt: data.generatedAt ? new Date(data.generatedAt) : null,
            });
          } else {
            await generateTopic(t.topic, t.is_category);
          }
        } catch {
          // Leave this topic in its default (no digest yet) state and
          // unmarked, so a later effect run or remount can retry it — the
          // Generate button also lets the user retry manually.
        }
        if (cancelled) return;
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topics]);

  async function unfollow(topic, isCategory) {
    const key = topicKey(topic, isCategory);
    setTopics((t) => t.filter((x) => !(x.topic === topic && x.is_category === isCategory)));
    setByTopic((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    await fetch("/api/bookmarks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, isCategory }),
    });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/signin";
  }

  if (checkingAuth) return null;

  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name;
  const firstName = fullName ? fullName.trim().split(/\s+/)[0] : null;

  return (
    <main
      className="min-h-screen text-[var(--text-100)] electric-bg"
      style={{ background: PAGE_BACKGROUND }}
    >
      <div className="ticker-bar" />
      <header className="max-w-6xl mx-auto px-6 pt-8 md:pt-12 pb-6 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <span className="live-badge mb-3">
            <span className="live-dot" />
            On the wire
          </span>
          <h1 className="gradient-text font-display text-3xl md:text-5xl font-black tracking-tight">
            {firstName ? `${firstName}'s Briefing` : "Your Briefing"}
          </h1>
        </div>
        <ThemeToggle />
        <Link
          href="/settings"
          className="tag-pill px-4 py-2 rounded-full font-mono text-xs uppercase tracking-wide text-[var(--text-80)] hover:text-[var(--text-100)]"
        >
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 rounded-full font-mono text-xs uppercase tracking-wide text-white transition-transform hover:scale-105"
          style={{ backgroundImage: BRAND_GRADIENT, boxShadow: BRAND_GLOW }}
        >
          Sign out
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-6 pb-16">
        {topics === null && (
          <p className="font-mono text-sm text-[var(--text-40)]">Loading your topics…</p>
        )}

        {topics && topics.length === 0 && (
          <div
            className="rounded-3xl border border-[var(--border-10)] p-10 text-center max-w-2xl mx-auto"
            style={{
              background:
                "linear-gradient(160deg, rgba(37,99,235,0.12), rgba(124,58,237,0.10))",
            }}
          >
            <p className="font-display text-2xl font-bold text-[var(--text-100)] mb-3">
              You haven't picked any topics yet
            </p>
            <p className="text-[var(--text-60)] mb-6">
              Choose a few categories or add your own topics, and your agent
              will keep a digest ready for each one every time you check in.
            </p>
            <Link
              href="/settings"
              className="inline-block px-6 py-2.5 rounded-full font-mono text-xs uppercase tracking-wide text-white transition-transform hover:scale-105"
              style={{ backgroundImage: BRAND_GRADIENT, boxShadow: BRAND_GLOW }}
            >
              Choose your topics
            </Link>
          </div>
        )}

        {topics && topics.length > 0 && (
          <div className="space-y-8">
            {topics.map((t) => {
              const key = topicKey(t.topic, t.is_category);
              const state = byTopic[key] || {};
              return (
                <TopicDigestCard
                  key={key}
                  topic={t.topic}
                  digest={state.digest}
                  loading={state.loading}
                  error={state.error}
                  generatedAt={state.generatedAt}
                  trace={state.trace}
                  onGenerate={() => generateTopic(t.topic, t.is_category)}
                  onRemove={() => unfollow(t.topic, t.is_category)}
                />
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
