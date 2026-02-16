"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-lg font-bold text-dark dark:text-white mb-2">Что-то пошло не так</h2>
      <p className="text-sm text-neutral dark:text-white/50 mb-6 max-w-sm">
        Произошла ошибка при загрузке страницы. Попробуйте обновить или вернуться на главную.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Попробовать снова
        </button>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-gray-100 dark:bg-white/10 text-dark dark:text-white rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
        >
          На главную ЛК
        </Link>
      </div>
    </div>
  );
}
