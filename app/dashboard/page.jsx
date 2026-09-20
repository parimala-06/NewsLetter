"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Settings as SettingsIcon, LogOut, ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { streamDigest } from "@/app/components/NewsCards";
import TopicDigestCard from "@/app/components/TopicDigestCard";
import MastHead from "@/app/components/MastHead";
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
    <main className="min-h-screen bg-[var(--bg-panel)]">
      <MastHead
        links={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/settings", label: "Settings" },
        ]}
        active="/dashboard"
        actions={
          <>
            <ThemeToggle />
            <Link href="/settings" className="md:hidden btn btn-outline px-3 py-2" aria-label="Settings">
              <SettingsIcon size={16} />
            </Link>
            <button onClick={handleSignOut} className="btn btn-outline">
              <LogOut size={15} />
              Sign out
            </button>
          </>
        }
      />

      <div className="max-w-6xl mx-auto px-6 pt-10 pb-6">
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-[var(--text-100)]">
          {firstName ? `${firstName}'s Briefing` : "Your Briefing"}
        </h1>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-16">
        {topics === null && <p className="font-sans text-sm text-[var(--text-40)]">Loading your topics…</p>}

        {topics && topics.length === 0 && (
          <div className="card rounded-2xl p-10 text-center max-w-2xl mx-auto">
            <p className="font-display text-2xl font-semibold text-[var(--text-100)] mb-3">
              You haven't picked any topics yet
            </p>
            <p className="text-[var(--text-60)] mb-6 leading-relaxed">
              Choose a few categories or add your own topics, and your agent
              will keep a digest ready for each one every time you check in.
            </p>
            <Link href="/settings" className="btn btn-accent inline-flex">
              Choose your topics
              <ArrowUpRight size={16} />
            </Link>
          </div>
        )}

        {topics && topics.length > 0 && (
          <div className="space-y-6">
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
