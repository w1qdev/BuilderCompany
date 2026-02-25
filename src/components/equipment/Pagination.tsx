"use client";

import React from "react";

interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, total, pageSize, onPageChange }: PaginationProps) {
  if (total <= pageSize) return null;

  const totalPages = Math.ceil(total / pageSize);

  const pages: (number | "\u2026")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("\u2026");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("\u2026");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-sm text-neutral dark:text-white/50">
        Показано {(page - 1) * pageSize + 1}\u2013{Math.min(page * pageSize, total)} из {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-neutral disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Первая страница"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-neutral disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Предыдущая"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {pages.map((p, i) =>
          p === "\u2026" ? (
            <span key={`ellipsis-${i}`} className="px-2 text-neutral dark:text-white/30 text-sm">\u2026</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? "gradient-primary text-white"
                  : "hover:bg-gray-100 dark:hover:bg-white/5 text-dark dark:text-white"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-neutral disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Следующая"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-neutral disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Последняя страница"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
