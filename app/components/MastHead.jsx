import Link from "next/link";

// Shared masthead used identically across the landing page, sign-in,
// dashboard, and settings — a warm off-white bar with the wordmark, a row
// of nav links, and a slot for page-specific actions (theme toggle, sign
// out, etc). Keeping it in one place is what makes the site read as one
// consistent product instead of four separately styled screens.
export default function MastHead({ links = [], active, actions }) {
  return (
    <header className="masthead sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center gap-3 md:gap-8">
        <Link href="/" className="font-display text-base md:text-xl font-semibold tracking-tight text-[var(--text-100)] shrink-0 truncate">
          The AI Briefing
        </Link>

        {links.length > 0 && (
          <nav className="hidden md:flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`masthead-link ${active === link.href ? "is-active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-1.5 md:gap-3 shrink-0">{actions}</div>
      </div>
    </header>
  );
}
