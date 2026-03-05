"use client";

import { DEFAULT_THEME, DARK_CLASS_THEMES } from "@/lib/themes";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

interface ThemeContextType {
  theme: string;
  setTheme: (id: string) => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

function applyTheme(id: string) {
  const root = document.documentElement;
  root.setAttribute("data-theme", id);
  if (DARK_CLASS_THEMES.includes(id)) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");

  useEffect(() => {
    const saved = localStorage.getItem("theme") || DEFAULT_THEME;
    setThemeState(saved);
    setMounted(true);
  }, []);

  // Apply user theme in dashboard, default on other pages
  useEffect(() => {
    if (!mounted) return;
    applyTheme(isDashboard ? theme : DEFAULT_THEME);
  }, [isDashboard, theme, mounted]);

  const setTheme = (id: string) => {
    setThemeState(id);
    localStorage.setItem("theme", id);
    if (isDashboard) {
      applyTheme(id);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}
