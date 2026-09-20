import Link from "next/link";
import {
  Tag,
  ArrowUpDown,
  RefreshCw,
  Newspaper,
  Search,
  CheckCircle2,
  ShieldCheck,
  FileText,
  ArrowUpRight,
} from "lucide-react";
import MastHead from "@/app/components/MastHead";
import ThemeToggle from "@/app/components/ThemeToggle";

const FEATURES = [
  {
    icon: Tag,
    color: "var(--cat-1)",
    title: "Pick your topics",
    body: "Start from ready-made categories like Tech, Business, or Sports — or add your own, like \"F1\" or \"lunar missions.\"",
  },
  {
    icon: ArrowUpDown,
    color: "var(--cat-2)",
    title: "Order it your way",
    body: "Move your top topics to the front, so your briefing opens with what you actually care about.",
  },
  {
    icon: RefreshCw,
    color: "var(--cat-3)",
    title: "Refresh anytime",
    body: "Want the latest? Hit refresh and get a brand new summary, pulled from today's headlines.",
  },
  {
    icon: Newspaper,
    color: "var(--cat-4)",
    title: "Just the essentials",
    body: "One short summary and a photo per story — no ads, no clutter, no pages you didn't ask for.",
  },
];

const STEPS = [
  {
    icon: Search,
    title: "It searches",
    body: "An agent looks up the latest stories for each of your topics.",
  },
  {
    icon: CheckCircle2,
    title: "It picks what matters",
    body: "Only relevant, worthwhile stories make the cut.",
  },
  {
    icon: ShieldCheck,
    title: "It double-checks itself",
    body: "Before you see it, the agent reviews its own picks once more for originality and relevance — so you're not reading repeats or old news.",
  },
  {
    icon: FileText,
    title: "It writes the brief",
    body: "You get a short, easy read — not a wall of text.",
  },
];

export default function Landing() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)]">
      <MastHead
        links={[
          { href: "#features", label: "Features" },
          { href: "#how-it-works", label: "How it works" },
        ]}
        actions={
          <>
            <ThemeToggle />
            <Link href="/signin" className="btn btn-dark">
              Sign in
            </Link>
          </>
        }
      />

      <section className="ink-band">
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)] mb-5">
              Read less. Know more.
            </p>
            <h1 className="font-display text-4xl md:text-6xl font-semibold leading-[1.08] tracking-tight mb-6">
              The news that matters, in minutes.
            </h1>
            <p className="text-lg text-[rgba(243,239,228,0.75)] leading-relaxed mb-8 max-w-md">
              Follow the topics you actually care about and get a short,
              clear summary of each one. No front page to wade through, no
              sections you'll never open.
            </p>
            <Link href="/signin" className="btn btn-accent">
              Get your briefing — sign in with Google
              <ArrowUpRight size={17} />
            </Link>
          </div>

          <figure className="rounded-2xl overflow-hidden">
            <picture>
              <source srcSet="/hero/newsroom-hero.webp" type="image/webp" />
              <img
                src="/hero/newsroom-hero.jpg"
                alt="City skyline at dawn, warm golden light"
                className="w-full h-72 md:h-96 object-cover"
              />
            </picture>
            <figcaption className="font-sans text-[11px] text-[rgba(243,239,228,0.4)] mt-2">
              Photo: "Chicago at Dawn" by Pen Waggener, CC BY 2.0
            </figcaption>
          </figure>
        </div>
      </section>

      <section id="features" className="bg-[var(--bg-panel)]">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
          <div className="max-w-2xl mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-[var(--text-100)] mb-3">
              Your briefing, not a newspaper
            </h2>
            <p className="text-[var(--text-60)] leading-relaxed">
              Read it the way you'd check a feed: the topics you picked,
              summarized, and ready whenever you check in.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="card rounded-2xl p-6">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: f.color }}
                >
                  <f.icon size={20} color="#fffdf9" />
                </div>
                <h3 className="font-display text-lg font-semibold text-[var(--text-100)] mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-[var(--text-60)] leading-relaxed">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-16 md:py-20 text-center">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)] mb-3">
          A quick word on how it works
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-[var(--text-100)] mb-4 max-w-xl mx-auto">
          A research agent does the legwork, so you don't have to.
        </h2>
        <p className="text-[var(--text-60)] leading-relaxed max-w-xl mx-auto mb-12">
          For each topic you follow, it does this — automatically.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
          {STEPS.map((s, i) => (
            <div key={s.title}>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-full border border-[var(--border)] text-sm font-sans font-semibold text-[var(--text-60)]">
                  {i + 1}
                </span>
                <s.icon size={18} className="text-[var(--olive)]" />
              </div>
              <h3 className="font-display text-base font-semibold text-[var(--text-100)] mb-1.5">
                {s.title}
              </h3>
              <p className="text-sm text-[var(--text-60)] leading-relaxed">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="ink-band">
        <div className="max-w-3xl mx-auto px-6 py-16 md:py-20 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">
            Stop scrolling. Start your briefing.
          </h2>
          <p className="text-[rgba(243,239,228,0.7)] leading-relaxed mb-8 max-w-lg mx-auto">
            It takes one click to sign in and about thirty seconds to pick
            your first topics.
          </p>
          <Link href="/signin" className="btn btn-accent">
            Sign in with Google
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>

      <footer className="ink-band border-t border-[rgba(246,241,231,0.1)]">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="font-display text-lg font-semibold">
            The AI Briefing
          </p>
          <p className="font-sans text-xs text-[rgba(243,239,228,0.4)]">
            Your topics, summarized — updated whenever you want.
          </p>
        </div>
      </footer>
    </main>
  );
}
