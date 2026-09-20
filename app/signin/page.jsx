"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/app/components/ThemeToggle";

function GoogleIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" {...props}>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

// Dedicated sign-in page, the entry point for anyone not already signed
// in. Google is the only auth method — there's no email/password form to
// build. Reads ?next=/some/path so sign-in can return the user to where
// they came from, defaulting to the dashboard.
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
    <main className="min-h-screen bg-[var(--bg-panel)] flex items-center justify-center p-4 md:p-8">
      <div className="card w-full max-w-5xl rounded-3xl overflow-hidden grid md:grid-cols-2">
        <div className="flex flex-col justify-between p-8 md:p-14 min-h-[420px] md:min-h-[560px]">
          <div className="flex items-center justify-between">
            <Link href="/" className="font-display text-lg font-semibold text-[var(--text-100)]">
              The AI Briefing
            </Link>
            <ThemeToggle />
          </div>

          <div className="max-w-sm">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)] mb-4">
              Welcome back
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-[var(--text-100)] mb-3">
              Sign in
            </h1>
            <p className="text-[var(--text-60)] mb-8 leading-relaxed">
              Pick your topics once, and an agent keeps a fresh digest ready
              for each one. Google is the only account you'll need.
            </p>

            {checking ? (
              <div className="h-[50px] rounded-full bg-[var(--surface-soft)] animate-pulse" />
            ) : (
              <button
                onClick={handleSignIn}
                className="w-full inline-flex items-center justify-center gap-3 rounded-full py-3.5 font-sans font-semibold text-sm bg-[var(--surface)] border border-[var(--border)] text-[var(--text-100)] transition-colors hover:bg-[var(--surface-soft)]"
              >
                <GoogleIcon />
                Continue with Google
              </button>
            )}

            <p className="font-sans text-xs text-[var(--text-40)] mt-5 leading-relaxed">
              No password to set or remember — you'll be redirected to Google
              and back.
            </p>
          </div>

          <p className="font-sans text-xs text-[var(--text-40)]">
            <Link href="/" className="hover:text-[var(--text-70)]">
              ← Back to home
            </Link>
          </p>
        </div>

        <div className="relative hidden md:block">
          <img
            src="/hero/newsroom-hero.jpg"
            alt="City skyline at dawn"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(14,13,9,0.25) 0%, rgba(14,13,9,0.35) 45%, rgba(14,13,9,0.88) 100%)" }}
          />

          <div className="relative h-full flex flex-col justify-end p-10">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)] mb-4">
              Read less. Know more.
            </p>
            <h2 className="font-display text-2xl lg:text-3xl font-semibold leading-snug text-[#f6f1e7]">
              Your topics are waiting — pick up right where you left off.
            </h2>
          </div>
        </div>
      </div>
    </main>
  );
}
