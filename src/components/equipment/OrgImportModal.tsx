"use client";

import { Portal } from "@/components/ui/Portal";
import React from "react";
import type { ArshinItem } from "./types";

interface OrgImportModalProps {
  show: boolean;
  orgQuery: string;
  orgSearching: boolean;
  orgResults: ArshinItem[] | null;
  orgSelected: Set<number>;
  orgImporting: boolean;
  orgSuggestions: string[];
  orgSuggestLoading: boolean;
  orgSuggestOpen: boolean;
  onClose: () => void;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  onSuggestOpen: () => void;
  onSuggestClose: () => void;
  onSuggestSelect: (value: string) => void;
  onToggleItem: (index: number) => void;
  onToggleAll: () => void;
  onImport: () => void;
}

export default function OrgImportModal({
  show,
  orgQuery,
  orgSearching,
  orgResults,
  orgSelected,
  orgImporting,
  orgSuggestions,
  orgSuggestLoading,
  orgSuggestOpen,
  onClose,
  onQueryChange,
  onSearch,
  onSuggestOpen,
  onSuggestClose,
  onSuggestSelect,
  onToggleItem,
  onToggleAll,
  onImport,
}: OrgImportModalProps) {
  if (!show) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" role="button" tabIndex={-1} onClick={onClose} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClose(); } }}>
        <div role="dialog" className="bg-white dark:bg-dark-light rounded-2xl shadow-xl max-w-xl w-full flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { e.stopPropagation(); }}>
          {/* Fixed header */}
          <div className="p-6 pb-0 shrink-0">
            <h2 className="text-lg font-bold text-dark dark:text-white mb-1">Импорт оборудования из ФГИС Аршин</h2>
            <p className="text-sm text-neutral dark:text-white/60 mb-4">Введите название организации или серийный номер, чтобы найти приборы в реестре поверок.</p>
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <input
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm pr-7"
                  placeholder="Начните вводить название организации..."
                  value={orgQuery}
                  onChange={(e) => onQueryChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { onSuggestClose(); onSearch(); }
                    if (e.key === "Escape") onSuggestClose();
                  }}
                  onFocus={() => orgSuggestions.length > 0 && onSuggestOpen()}
                  onBlur={() => setTimeout(() => onSuggestClose(), 150)}
                  autoComplete="off"
                />
                {orgSuggestLoading && (
                  <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-neutral" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                )}
                {orgSuggestOpen && orgSuggestions.length > 0 && (
                  <ul className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-dark-light border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden">
                    {orgSuggestions.map((s, i) => (
                      <li key={i}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 text-dark dark:text-white transition-colors"
                          onMouseDown={() => onSuggestSelect(s)}
                        >
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                onClick={() => { onSuggestClose(); onSearch(); }}
                disabled={orgSearching}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors shrink-0"
              >
                {orgSearching ? "Поиск..." : "Найти"}
              </button>
            </div>
          </div>

          {/* Scrollable results */}
          {orgResults && orgResults.length > 0 && (
            <div className="px-6 overflow-y-auto flex-1 min-h-0">
              <label className="flex items-center gap-2 mb-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={orgSelected.size === orgResults.length}
                  onChange={onToggleAll}
                />
                <span className="text-xs text-neutral dark:text-white/50">
                  Найдено {orgResults.length} записей — выбрано {orgSelected.size}
                </span>
              </label>
              <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden mb-4">
                {orgResults.map((item, i) => (
                  <label key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 border-b border-gray-100 dark:border-white/5 last:border-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={orgSelected.has(i)}
                      onChange={() => onToggleItem(i)}
                      className="mt-0.5 rounded border-gray-300"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-dark dark:text-white truncate">{item.miName || "\u2014"}</div>
                      <div className="text-xs text-neutral dark:text-white/50 mt-0.5">
                        {[item.miType, item.miSerialNumber && `\u2116 ${item.miSerialNumber}`, item.validDate && `до ${item.validDate.split("T")[0]}`].filter(Boolean).join(" \u00b7 ")}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Fixed footer */}
          <div className="p-6 pt-3 shrink-0 flex items-center justify-between gap-3 border-t border-gray-100 dark:border-white/5">
            {orgResults && orgResults.length > 0 ? (
              <>
                <span className="text-xs text-neutral dark:text-white/50">Выбрано: {orgSelected.size}</span>
                <div className="flex gap-2">
                  <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-neutral hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">Закрыть</button>
                  <button
                    onClick={onImport}
                    disabled={orgImporting || orgSelected.size === 0}
                    className="px-5 py-2 rounded-xl text-sm font-semibold gradient-primary text-white hover:shadow-lg hover:shadow-primary/30 transition-shadow disabled:opacity-50"
                  >
                    {orgImporting ? "Импорт..." : `Импортировать (${orgSelected.size})`}
                  </button>
                </div>
              </>
            ) : (
              <div className="ml-auto">
                <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-neutral hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">Закрыть</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}
