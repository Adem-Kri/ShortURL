"use client";

import { useTheme } from "next-themes";

function SunIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={props.className}
    >
      <path
        d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={props.className}
    >
      <path
        d="M21 14.5A8.5 8.5 0 0 1 9.5 3a6.5 6.5 0 1 0 11.5 11.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ThemeToggle() {
  const { setTheme } = useTheme();

  function toggleTheme() {
    // No state/effects needed: the current applied theme is reflected by the
    // `dark` class on <html> (managed by next-themes).
    const isDarkNow = document.documentElement.classList.contains("dark");
    setTheme(isDarkNow ? "light" : "dark");
  }

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      title="Toggle theme"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/15 dark:bg-black dark:text-zinc-50 dark:hover:bg-white/5"
    >
      <span className="inline-flex items-center gap-2 dark:hidden">
        <MoonIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Dark</span>
      </span>
      <span className="hidden items-center gap-2 dark:inline-flex">
        <SunIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Light</span>
      </span>
    </button>
  );
}
