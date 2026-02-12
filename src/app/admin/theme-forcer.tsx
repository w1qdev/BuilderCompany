"use client";

import { useEffect } from "react";

export function AdminThemeForcer() {
  useEffect(() => {
    const html = document.documentElement;
    const wasDark = html.classList.contains("dark");

    html.classList.remove("dark");
    html.style.colorScheme = "light";

    return () => {
      if (wasDark) {
        html.classList.add("dark");
        html.style.colorScheme = "dark";
      }
    };
  }, []);

  return null;
}
