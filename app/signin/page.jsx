"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BRAND_GRADIENT, BRAND_GLOW, PAGE_BACKGROUND } from "@/lib/theme";
import ThemeToggle from "@/app/components/ThemeToggle";

// Dedicated sign-in page, the entry point for anyone not already signed
// in (the root route redirects here). Reads ?next=/some/path so sign-in
// can return the user to where they came from, defaulting to the
// dashboard.
export default function SignIn() {
  const [supabase] = useState(() => createClient());
  const [checking, setChecking] = useState(true);
  const [next, setNext] = useState("/dashboard");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNext(params.get("next") || "/dashboard");

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        window.location.href = params.get("next") || "/dashboard";
      } else {
        setChecking(false);
      }
    });
  }, [supabase]);

  async function handleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  return (
    <main
      className="min-h-screen text-[var(--text-100)] flex flex-col electric-bg"
      style={{ background: PAGE_BACKGROUND }}
    >
      <div className="ticker-bar" />
      <div className="flex justify-end px-6 pt-6">
        <ThemeToggle />
      </div>
      <div className="flex-1 flex items-center">
        <div className="max-w-md mx-auto px-6 py-20 text-center">
          <span className="live-badge mb-4">
            <span className="live-dot" />
            On the wire
          </span>
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-40)] mb-4 mt-4">
            The AI Briefing
          </p>
          <h1 className="gradient-text font-display text-3xl md:text-4xl font-black tracking-tight mb-3">
            Sign in
          </h1>
          <p className="text-[var(--text-60)] mb-10">
            Sign in to build your dashboard — pick your topics once, and an
            agent keeps a fresh digest ready for each one.
          </p>
          {!checking && (
            <button
              onClick={handleSignIn}
              className="px-8 py-3 rounded-full font-mono text-sm uppercase tracking-wide text-white transition-transform hover:scale-105"
              style={{ backgroundImage: BRAND_GRADIENT, boxShadow: BRAND_GLOW }}
            >
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
