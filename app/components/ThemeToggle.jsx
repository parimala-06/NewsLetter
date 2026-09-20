"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

// Reads/writes the "theme" localStorage key and the data-theme attribute on
// <html>. Light is the default palette (no attribute); dark sets
// data-theme="dark". A blocking inline script in app/layout.jsx applies
// the saved theme before first paint, so this only needs to sync its own
// display state on mount, not fight a flash of the wrong theme.
export default function ThemeToggle() {
  const [theme, setTheme] = useState(null); // null until mounted, to avoid an SSR mismatch

  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") || "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    if (next === "light") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
    }
    window.localStorage.setItem("theme", next);
    setTheme(next);
  }

  if (!theme) {
    return <div className="theme-toggle opacity-0" aria-hidden="true" />;
  }

  return (
    <button
      onClick={toggle}
      className="theme-toggle"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <span className="theme-toggle-knob">
        {theme === "dark" ? <Moon size={12} /> : <Sun size={12} />}
      </span>
    </button>
  );
}
