"use client";

import { motion } from "framer-motion";
import { useTheme } from "./ThemeProvider";
import { DARK_CLASS_THEMES } from "@/lib/themes";

export default function ThemeToggle() {
  const { theme, setTheme, mounted } = useTheme();

  if (!mounted) {
    return <div className="w-10 h-10 rounded-xl bg-white/10" />;
  }

  const isDark = DARK_CLASS_THEMES.includes(theme);

  // Simple toggle: warm-orange ↔ dark-chocolate for the landing page
  const toggle = () => {
    setTheme(isDark ? "warm-orange" : "dark-chocolate");
  };

  return (
    <button
      onClick={toggle}
      className="relative w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 dark:bg-dark-light dark:hover:bg-dark transition-colors flex items-center justify-center"
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {isDark ? (
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </motion.div>
    </button>
  );
}
