// Plain shared constants (no "use client" boundary) so server components
// (e.g. the root redirect page) can import them without pulling in
// client-only component code from app/components/NewsCards.jsx.
export const CATEGORIES = [
  "TECHNOLOGY",
  "BUSINESS",
  "SCIENCE",
  "HEALTH",
  "SPORTS",
  "ENTERTAINMENT",
  "WORLD",
  "NATION",
];

// Electric blue → purple gradient, used for primary buttons and topic-name
// tags — paired with BRAND_GLOW for a neon-lit feel. No pink/cyan.
// References the CSS variable (see globals.css) so it's lighter in light
// mode and deeper in dark mode without any JS-side theme awareness.
export const BRAND_GRADIENT = "var(--brand-gradient)";
export const BRAND_GLOW = "0 8px 30px -6px rgba(124, 58, 237, 0.6)";
export const TEXT_ACCENT = "#c4b5fd";

// Layered radial glows over the theme's base color (near-black in dark
// mode, off-white in light mode — see the CSS variables in globals.css).
// References CSS custom properties instead of literal colors so the same
// constant works for both themes without any JS-side theme awareness.
export const PAGE_BACKGROUND = `
  radial-gradient(1100px 600px at 12% -10%, var(--glow-1), transparent 60%),
  radial-gradient(900px 550px at 105% 0%, var(--glow-2), transparent 55%),
  radial-gradient(900px 650px at 50% 115%, var(--glow-3), transparent 60%),
  var(--bg-base)
`;
