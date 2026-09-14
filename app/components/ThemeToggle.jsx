"use client";

import { useEffect, useState } from "react";

// Reads/writes the "theme" localStorage key and the data-theme attribute on
// <html>. A blocking inline script in app/layout.jsx applies the saved
// theme before first paint, so this only needs to sync its own display
// state on mount, not fight a flash of the wrong theme.
export default function ThemeToggle() {
  const [theme, setTheme] = useState(null); // null until mounted, to avoid an SSR mismatch

  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") || "dark");
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
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
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <span className="theme-toggle-knob">{theme === "light" ? "☀" : "☾"}</span>
    </button>
  );
}
