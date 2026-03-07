"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Portal } from "./ui/Portal";

interface CommandSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EquipmentResult {
  id: number;
  name: string;
  serialNumber: string | null;
  type: string | null;
  category: string;
  status: string;
}

interface RequestResult {
  id: number;
  service: string;
  status: string;
  createdAt: string;
}

interface PageResult {
  title: string;
  href: string;
  keywords: string;
}

interface SearchResults {
  equipment: EquipmentResult[];
  requests: RequestResult[];
  pages: PageResult[];
}

type FlatItem =
  | { kind: "page"; data: PageResult }
  | { kind: "equipment"; data: EquipmentResult }
  | { kind: "request"; data: RequestResult };

function CompassIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 0v0m3.5 6.5l-2 5-5 2 2-5 5-2z"
      />
    </svg>
  );
}

function FlaskIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 3h6m-5 0v5.172a2 2 0 01-.586 1.414l-3.828 3.828A3 3 0 007.708 19h8.584a3 3 0 002.122-5.121l-3.828-3.828A2 2 0 0114 8.637V3"
      />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

const STATUS_LABELS: Record<string, string> = {
  new: "Новая",
  in_progress: "В работе",
  done: "Выполнена",
  active: "Активен",
  pending: "Скоро",
  expired: "Просрочен",
};

export default function CommandSearch({ isOpen, onClose }: CommandSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build flat list for keyboard navigation
  const flatItems = useMemo((): FlatItem[] => {
    const items: FlatItem[] = [];
    if (results) {
      for (const p of results.pages) items.push({ kind: "page", data: p });
      for (const e of results.equipment)
        items.push({ kind: "equipment", data: e });
      for (const r of results.requests)
        items.push({ kind: "request", data: r });
    }
    return items;
  }, [results]);

  const navigateToItem = useCallback(
    (item: FlatItem) => {
      if (item.kind === "page") {
        router.push(item.data.href);
      } else if (item.kind === "equipment") {
        const cat = item.data.category === "attestation" ? "io" : "si";
        router.push(`/dashboard/equipment/${cat}?highlight=${item.data.id}`);
      } else {
        router.push(`/dashboard/requests?highlight=${item.data.id}`);
      }
      onClose();
    },
    [router, onClose]
  );

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults(null);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`
        );
        if (res.ok) {
          const data: SearchResults = await res.json();
          setResults(data);
          setSelectedIndex(0);
        }
      } catch {
        // silently ignore
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-search-item]");
    const item = items[selectedIndex] as HTMLElement | undefined;
    if (item) {
      item.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(flatItems.length, 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) =>
            (prev - 1 + Math.max(flatItems.length, 1)) %
            Math.max(flatItems.length, 1)
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatItems[selectedIndex]) {
          navigateToItem(flatItems[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [flatItems, selectedIndex, navigateToItem, onClose]
  );

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const hasResults =
    results &&
    (results.pages.length > 0 ||
      results.equipment.length > 0 ||
      results.requests.length > 0);
  const noResults = results && !hasResults && query.trim().length > 0;

  let itemCounter = 0;

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="relative bg-white dark:bg-dark-light rounded-2xl shadow-xl max-w-lg w-full overflow-hidden"
              onKeyDown={handleKeyDown}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 border-b border-gray-200 dark:border-white/10">
                <SearchIcon className="w-5 h-5 text-gray-400 dark:text-white/40 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск по панели..."
                  className="flex-1 py-4 bg-transparent text-dark dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 outline-none text-base"
                />
                {loading && (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                )}
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:text-white/30 bg-gray-100 dark:bg-white/5 rounded border border-gray-200 dark:border-white/10">
                  ESC
                </kbd>
              </div>

              {/* Results area */}
              <div ref={listRef} className="max-h-[50vh] overflow-y-auto">
                {/* Empty state */}
                {!query.trim() && (
                  <div className="px-4 py-10 text-center text-sm text-gray-400 dark:text-white/40">
                    <SearchIcon className="w-8 h-8 mx-auto mb-3 opacity-40" />
                    <p>
                      Нажмите{" "}
                      <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-white/5 rounded border border-gray-200 dark:border-white/10">
                        Ctrl+K
                      </kbd>{" "}
                      для быстрого поиска
                    </p>
                  </div>
                )}

                {/* No results */}
                {noResults && !loading && (
                  <div className="px-4 py-10 text-center text-sm text-gray-400 dark:text-white/40">
                    Ничего не найдено
                  </div>
                )}

                {/* Pages section */}
                {results && results.pages.length > 0 && (
                  <div className="px-2 pt-2">
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider">
                      Страницы
                    </div>
                    {results.pages.map((page) => {
                      const idx = itemCounter++;
                      return (
                        <button
                          key={page.href}
                          data-search-item
                          onClick={() =>
                            navigateToItem({ kind: "page", data: page })
                          }
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                            selectedIndex === idx
                              ? "bg-primary/5 dark:bg-primary/10"
                              : "hover:bg-gray-50 dark:hover:bg-white/5"
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                            <CompassIcon className="w-4 h-4 text-blue-500" />
                          </div>
                          <span className="text-sm font-medium text-dark dark:text-white truncate">
                            {page.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Equipment section */}
                {results && results.equipment.length > 0 && (
                  <div className="px-2 pt-2">
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider">
                      Оборудование
                    </div>
                    {results.equipment.map((eq) => {
                      const idx = itemCounter++;
                      return (
                        <button
                          key={eq.id}
                          data-search-item
                          onClick={() =>
                            navigateToItem({ kind: "equipment", data: eq })
                          }
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                            selectedIndex === idx
                              ? "bg-primary/5 dark:bg-primary/10"
                              : "hover:bg-gray-50 dark:hover:bg-white/5"
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <FlaskIcon className="w-4 h-4 text-emerald-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-dark dark:text-white truncate">
                              {eq.name}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-white/40 truncate">
                              {[eq.type, eq.serialNumber]
                                .filter(Boolean)
                                .join(" \u00b7 ") || "\u2014"}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${
                              eq.status === "expired"
                                ? "bg-red-50 dark:bg-red-500/10 text-red-500"
                                : eq.status === "pending"
                                ? "bg-amber-50 dark:bg-amber-500/10 text-amber-500"
                                : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500"
                            }`}
                          >
                            {STATUS_LABELS[eq.status] || eq.status}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Requests section */}
                {results && results.requests.length > 0 && (
                  <div className="px-2 pt-2 pb-2">
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider">
                      Заявки
                    </div>
                    {results.requests.map((req) => {
                      const idx = itemCounter++;
                      return (
                        <button
                          key={req.id}
                          data-search-item
                          onClick={() =>
                            navigateToItem({ kind: "request", data: req })
                          }
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                            selectedIndex === idx
                              ? "bg-primary/5 dark:bg-primary/10"
                              : "hover:bg-gray-50 dark:hover:bg-white/5"
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center shrink-0">
                            <DocumentIcon className="w-4 h-4 text-violet-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-dark dark:text-white truncate">
                              {req.service}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-white/40">
                              {new Date(req.createdAt).toLocaleDateString(
                                "ru-RU"
                              )}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${
                              req.status === "done"
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500"
                                : req.status === "in_progress"
                                ? "bg-amber-50 dark:bg-amber-500/10 text-amber-500"
                                : "bg-blue-50 dark:bg-blue-500/10 text-blue-500"
                            }`}
                          >
                            {STATUS_LABELS[req.status] || req.status}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer with keyboard hints */}
              {hasResults && (
                <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-200 dark:border-white/10 text-[11px] text-gray-400 dark:text-white/30">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-white/5 rounded border border-gray-200 dark:border-white/10 font-mono">
                      &uarr;
                    </kbd>
                    <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-white/5 rounded border border-gray-200 dark:border-white/10 font-mono">
                      &darr;
                    </kbd>
                    навигация
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-white/5 rounded border border-gray-200 dark:border-white/10 font-mono">
                      Enter
                    </kbd>
                    перейти
                  </span>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
