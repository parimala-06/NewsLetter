// Plain shared constants (no "use client" boundary) so server components
// (e.g. the root page) can import them without pulling in client-only
// component code from app/components/NewsCards.jsx.
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

// Single flat terracotta accent for primary actions.
export const ACCENT = "var(--accent)";

// Six flat category hues (olive/clay/sage family — see globals.css),
// deterministically hashed per topic string so the same topic always gets
// the same color without a lookup table to maintain.
const CATEGORY_ACCENTS = [
  "var(--cat-1)",
  "var(--cat-2)",
  "var(--cat-3)",
  "var(--cat-4)",
  "var(--cat-5)",
  "var(--cat-6)",
];

export function categoryAccent(topic) {
  let hash = 0;
  for (let i = 0; i < topic.length; i++) hash = (hash * 31 + topic.charCodeAt(i)) >>> 0;
  return CATEGORY_ACCENTS[hash % CATEGORY_ACCENTS.length];
}
