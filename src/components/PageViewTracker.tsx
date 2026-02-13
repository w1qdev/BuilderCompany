"use client";

import { usePageView } from "@/lib/usePageView";

export default function PageViewTracker() {
  usePageView();
  return null;
}
