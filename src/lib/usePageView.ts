"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function usePageView() {
  const pathname = usePathname();

  useEffect(() => {
    // Don't track admin pages
    if (pathname.startsWith("/admin")) return;

    const track = () => {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: pathname }),
      }).catch(() => {});
    };

    // Small delay to avoid tracking during rapid navigation
    const timer = setTimeout(track, 300);
    return () => clearTimeout(timer);
  }, [pathname]);
}
