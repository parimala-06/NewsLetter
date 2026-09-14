import "./globals.css";

export const metadata = {
  title: "The AI Briefing — Your Newsroom Agent",
  description: "Pick a topic, an AI agent gathers headlines and writes your digest.",
};

// Applies the saved theme (or the OS preference, on a first visit) before
// hydration, so the page never flashes the wrong theme for a frame.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var saved = localStorage.getItem("theme");
    var theme = saved || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    if (theme === "light") document.documentElement.setAttribute("data-theme", "light");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning on <html>: THEME_INIT_SCRIPT deliberately
    // sets data-theme on this element before React hydrates (that's the
    // whole point — avoiding a flash of the wrong theme), so the server
    // markup and the real DOM never match here on purpose. Without this,
    // React's dev-mode check reports it as a hydration error.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      {/* Same reasoning here for <body> — browser extensions like Grammarly
          inject their own attributes (data-gr-ext-installed, etc.) before
          hydration, which is likewise a false-positive mismatch. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
