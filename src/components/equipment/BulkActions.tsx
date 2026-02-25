"use client";

import React from "react";

interface BulkActionsProps {
  selectedCount: number;
  showIgnored: boolean;
  onCreateRequest: () => void;
  onCompare: () => void;
  onBulkAction: (action: "delete" | "archive" | "unarchive") => void;
  onClearSelection: () => void;
}

export default function BulkActions({
  selectedCount,
  showIgnored,
  onCreateRequest,
  onCompare,
  onBulkAction,
  onClearSelection,
}: BulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 mb-4 p-3 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20">
      <span className="text-sm font-medium text-dark dark:text-white">
        Выбрано: {selectedCount}
      </span>
      <button
        onClick={onCreateRequest}
        className="px-4 py-1.5 rounded-lg text-sm font-semibold gradient-primary text-white hover:shadow-md transition-shadow"
      >
        Создать заявку
      </button>
      {selectedCount >= 2 && selectedCount <= 5 && (
        <button
          onClick={onCompare}
          className="px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/30 hover:bg-blue-100 transition-colors"
        >
          Сравнить ({selectedCount})
        </button>
      )}
      <div className="w-px h-5 bg-gray-300 dark:bg-white/20" />
      <button
        onClick={() => onBulkAction(showIgnored ? "unarchive" : "archive")}
        className="px-4 py-1.5 rounded-lg text-sm font-medium bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-400/30 hover:bg-yellow-100 transition-colors"
      >
        {showIgnored ? "Восстановить" : "В архив"}
      </button>
      <button
        onClick={() => {
          if (confirm(`Удалить ${selectedCount} записей?`)) {
            onBulkAction("delete");
          }
        }}
        className="px-4 py-1.5 rounded-lg text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-400/30 hover:bg-red-100 transition-colors"
      >
        Удалить
      </button>
      <button
        onClick={onClearSelection}
        className="px-3 py-1.5 rounded-lg text-sm text-neutral hover:bg-gray-100 dark:hover:bg-white/5 transition-colors ml-auto"
      >
        Сбросить
      </button>
    </div>
  );
}
