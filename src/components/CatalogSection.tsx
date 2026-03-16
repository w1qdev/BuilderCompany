"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type EquipmentType = {
  id: number;
  name: string;
  category: string | null;
};

const categoryMeta: Record<string, { icon: string; image: string }> = {
  "Давление": {
    icon: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707",
    image: "/images/catalog/pressure.jpg",
  },
  "Масса": {
    icon: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
    image: "/images/catalog/mass.jpg",
  },
  "Температура": {
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    image: "/images/catalog/temperature.jpg",
  },
  "Электрические": {
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    image: "/images/catalog/electrical.jpg",
  },
  "Испытательное оборудование": {
    icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    image: "/images/catalog/testing.jpg",
  },
  "Геометрические": {
    icon: "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4",
    image: "/images/catalog/geometry.jpg",
  },
  "Расход": {
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    image: "/images/catalog/flow.jpg",
  },
};

const defaultMeta = {
  icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  image: "/images/catalog/default.jpg",
};

interface CatalogSectionProps {
  onOrderClick: (equipmentType: EquipmentType) => void;
  compact?: boolean;
}

export default function CatalogSection({ onOrderClick, compact: initialCompact = true }: CatalogSectionProps) {
  const [types, setTypes] = useState<EquipmentType[]>([]);
  const [search, setSearch] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(!initialCompact);

  useEffect(() => {
    fetch("/api/equipment-types")
      .then((res) => res.json())
      .then((data) => setTypes(data.types || []))
      .catch(() => {});
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, EquipmentType[]> = {};
    for (const t of types) {
      const cat = t.category || "Другое";
      if (!map[cat]) map[cat] = [];
      map[cat].push(t);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [types]);

  const filtered = useMemo(() => {
    if (!search.trim()) return grouped;
    const q = search.toLowerCase();
    return grouped
      .map(([cat, items]) => [cat, items.filter((t) => t.name.toLowerCase().includes(q))] as [string, EquipmentType[]])
      .filter(([, items]) => items.length > 0);
  }, [grouped, search]);

  const displayData = !showAll && initialCompact && !search ? filtered.slice(0, 6) : filtered;
  const hasMore = initialCompact && !search && filtered.length > 6;

  return (
    <section id="catalog" className="py-20 sm:py-28 bg-white dark:bg-dark">
      <div className="max-w-8xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-10"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Каталог оборудования
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-dark dark:text-white mt-2">
            Найдите <span className="text-gradient">своё оборудование</span>
          </h2>
          <p className="text-neutral dark:text-white/60 mt-3 max-w-2xl mx-auto">
            Подберём аккредитованного поверителя и рассчитаем стоимость за 15 минут
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="max-w-xl mx-auto mb-10"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Введите название прибора..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-warm-bg dark:bg-dark-light border border-gray-200 dark:border-white/10 rounded-2xl text-dark dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>
        </motion.div>

        {/* Categories */}
        {displayData.length === 0 && search && (
          <p className="text-center text-neutral dark:text-white/60 py-8">
            Ничего не найдено. Попробуйте другой запрос или{" "}
            <button onClick={() => onOrderClick({ id: 0, name: search, category: null })} className="text-primary hover:underline">
              оставьте заявку
            </button>
          </p>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {displayData.map(([category, items], catIdx) => {
              const meta = categoryMeta[category] || defaultMeta;
              const isExpanded = expandedCategory === category || !!search;
              const visibleItems = isExpanded ? items : items.slice(0, 4);

              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ delay: catIdx * 0.05 }}
                  className="bg-white dark:bg-dark-light rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                >
                  {/* Category header with image */}
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                    className="w-full text-left relative group"
                  >
                    <div className="relative h-36 overflow-hidden">
                      <img
                        src={meta.image}
                        alt={category}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                        <div>
                          <h3 className="font-bold text-white text-base">{category}</h3>
                          <p className="text-white/70 text-xs mt-0.5">
                            {items.length} {items.length === 1 ? "тип" : items.length < 5 ? "типа" : "типов"} оборудования
                          </p>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                          <svg
                            className={`w-5 h-5 text-white transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Equipment list */}
                  <div>
                    {visibleItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-5 py-3 hover:bg-warm-bg dark:hover:bg-white/5 transition-colors border-b border-gray-50 dark:border-white/5 last:border-b-0"
                      >
                        <span className="text-sm text-dark dark:text-white/80 truncate mr-3">{item.name}</span>
                        <button
                          onClick={() => onOrderClick(item)}
                          className="shrink-0 text-xs font-semibold text-white bg-primary hover:bg-primary-dark px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Заказать
                        </button>
                      </div>
                    ))}
                    {!isExpanded && items.length > 4 && (
                      <button
                        onClick={() => setExpandedCategory(category)}
                        className="w-full px-5 py-2.5 text-xs text-primary hover:bg-primary/5 transition-colors font-medium"
                      >
                        Показать ещё {items.length - 4}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Show all toggle */}
        {hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-2 gradient-primary text-white font-semibold px-6 py-3 rounded-2xl hover:shadow-lg hover:shadow-primary/30 transition-all"
            >
              {showAll ? "Свернуть каталог" : `Смотреть весь каталог (${types.length} типов)`}
              <svg
                className={`w-4 h-4 transition-transform ${showAll ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
