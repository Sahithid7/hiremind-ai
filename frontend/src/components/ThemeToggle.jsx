import { Moon, Sun } from "lucide-react";

import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ compact = false }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-glass/70 text-sm font-semibold text-graphite shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:text-ink ${
        compact ? "h-11 w-11 px-0" : "min-h-11 px-4"
      }`}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
      {!compact && <span>{isDark ? "Light" : "Dark"}</span>}
    </button>
  );
}
