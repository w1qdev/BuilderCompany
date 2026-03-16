"use client";

import { Search, ChevronDown, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type EquipmentSubType = {
  id: number;
  name: string;
};

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

const categoryMeta_extra: Record<string, { icon: string; image: string }> = {
  "Оптические": {
    icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
    image: "/images/catalog/default.jpg",
  },
  "Акустические": {
    icon: "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z",
    image: "/images/catalog/default.jpg",
  },
  "Аналитические": {
    icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    image: "/images/catalog/default.jpg",
  },
};

const allCategoryMeta = { ...categoryMeta, ...categoryMeta_extra };

const defaultMeta = {
  icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  image: "/images/catalog/default.jpg",
};

// Порядок популярности типов оборудования (по частоте запросов на поверку/калибровку)
const popularityOrder: string[] = [
  "Весы лабораторные",
  "Весы торговые",
  "Манометры",
  "Мультиметры",
  "Счётчики воды",
  "Термометры цифровые",
  "Штангенциркули",
  "Счётчики газа",
  "Счётчики электроэнергии",
  "Весы платформенные",
  "Мультиметры цифровые",
  "Манометры цифровые",
  "Термометры медицинские",
  "Микрометры",
  "Осциллографы",
  "Вольтметры",
  "Амперметры",
  "Рулетки измерительные",
  "Дальномеры лазерные",
  "Газоанализаторы",
  "Клещи токоизмерительные",
  "Мегаомметры",
  "Датчики давления",
  "Термопары",
  "Тепловизоры",
  "Шумомеры",
  "pH-метры",
  "Расходомеры жидкости",
  "Гири",
  "Весы медицинские",
  "Весы автомобильные",
  "Весы крановые",
  "Весы ювелирные",
  "Вакуумметры",
  "Мановакуумметры",
  "Преобразователи давления",
  "Барометры",
  "Термометры ртутные",
  "Термометры инфракрасные",
  "Терморезисторы",
  "Пирометры",
  "Термогигрометры",
  "Измерители сопротивления",
  "Ваттметры",
  "Измерители заземления",
  "Частотомеры",
  "Генераторы сигналов",
  "Линейки измерительные",
  "Нутромеры",
  "Угломеры",
  "Нивелиры",
  "Толщиномеры",
  "Уровни строительные",
  "Расходомеры газа",
  "Уровнемеры",
  "Счётчики тепла",
  "Люксметры",
  "Виброметры",
  "Алкометры",
  "Дозиметры радиации",
  "Кондуктометры",
  "Анализаторы влажности",
];

// Порядок категорий по популярности
const categoryOrder: string[] = [
  "Масса",
  "Давление",
  "Электрические",
  "Температура",
  "Геометрические",
  "Расход",
  "Испытательное оборудование",
  "Аналитические",
  "Акустические",
  "Оптические",
];

interface CatalogPageProps {
  onOrderClick: (equipmentType: EquipmentType & { subTypeName?: string }) => void;
}

export default function CatalogPageContent({ onOrderClick }: CatalogPageProps) {
  const [types, setTypes] = useState<EquipmentType[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [expandedTypeId, setExpandedTypeId] = useState<number | null>(null);
  const [subTypes, setSubTypes] = useState<Record<number, EquipmentSubType[]>>({});
  const [loadingSubTypes, setLoadingSubTypes] = useState<number | null>(null);
  const [customSubType, setCustomSubType] = useState("");

  useEffect(() => {
    fetch("/api/equipment-types")
      .then((res) => res.json())
      .then((data) => setTypes(data.types || []))
      .catch(() => {});
  }, []);

  const categories = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of types) {
      const cat = t.category || "Другое";
      map[cat] = (map[cat] || 0) + 1;
    }
    return Object.entries(map).sort(([a], [b]) => {
      const ai = categoryOrder.indexOf(a);
      const bi = categoryOrder.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }, [types]);

  const filtered = useMemo(() => {
    let result = types;
    if (activeCategory) {
      result = result.filter((t) => (t.category || "Другое") === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(q));
    }
    // Сортировка по популярности
    result = [...result].sort((a, b) => {
      const ai = popularityOrder.indexOf(a.name);
      const bi = popularityOrder.indexOf(b.name);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
    return result;
  }, [types, activeCategory, search]);

  const getCategoryImage = (category: string | null) => {
    return allCategoryMeta[category || ""]?.image || defaultMeta.image;
  };

  const handleCategoryClick = (cat: string | null) => {
    setActiveCategory(cat);
    setMobileSidebarOpen(false);
  };

  const handleExpandSubTypes = useCallback(async (typeId: number) => {
    if (expandedTypeId === typeId) {
      setExpandedTypeId(null);
      setCustomSubType("");
      return;
    }
    setExpandedTypeId(typeId);
    setCustomSubType("");
    if (!subTypes[typeId]) {
      setLoadingSubTypes(typeId);
      try {
        const res = await fetch(`/api/equipment-types?typeId=${typeId}`);
        const data = await res.json();
        setSubTypes((prev) => ({ ...prev, [typeId]: data.subTypes || [] }));
      } catch {
        setSubTypes((prev) => ({ ...prev, [typeId]: [] }));
      } finally {
        setLoadingSubTypes(null);
      }
    }
  }, [expandedTypeId, subTypes]);

  const handleSubTypeSelect = useCallback((item: EquipmentType, subTypeName: string) => {
    setExpandedTypeId(null);
    setCustomSubType("");
    onOrderClick({ ...item, subTypeName });
  }, [onOrderClick]);

  const hasActiveFilters = !!activeCategory || !!search;

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6">
      {/* Search hero */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-dark dark:text-white mb-2">
          Каталог оборудования
        </h1>
        <p className="text-neutral dark:text-white/60 text-sm mb-5">
          {types.length} типов оборудования — найдите своё и закажите поверку, калибровку или аттестацию
        </p>
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Например: весы, манометр, мультиметр, термометр..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-12 py-4 bg-warm-bg dark:bg-dark-light border-2 border-gray-200 dark:border-white/10 rounded-2xl text-base text-dark dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-dark dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Category filter chips */}
      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !activeCategory
                ? "bg-primary text-white"
                : "bg-warm-bg dark:bg-white/5 text-neutral dark:text-white/60 hover:text-dark dark:hover:text-white border border-gray-200 dark:border-white/10"
            }`}
          >
            Все
          </button>
          {categories.map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-white"
                  : "bg-warm-bg dark:bg-white/5 text-neutral dark:text-white/60 hover:text-dark dark:hover:text-white border border-gray-200 dark:border-white/10"
              }`}
            >
              {cat}
              <span className={`text-xs ${activeCategory === cat ? "text-white/70" : "opacity-50"}`}>{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active filters bar */}
      {hasActiveFilters && (
        <div className="flex items-center gap-3 mb-6 text-sm">
          <span className="text-neutral dark:text-white/50">
            Найдено: {filtered.length} {filtered.length === 1 ? "тип" : filtered.length < 5 ? "типа" : "типов"}
          </span>
          {activeCategory && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">
              {activeCategory}
              <button onClick={() => setActiveCategory(null)} className="hover:text-primary-dark">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {search && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">
              &laquo;{search}&raquo;
              <button onClick={() => setSearch("")} className="hover:text-primary-dark">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          <button
            onClick={() => { setActiveCategory(null); setSearch(""); }}
            className="text-xs text-neutral dark:text-white/50 hover:text-primary transition-colors"
          >
            Сбросить всё
          </button>
        </div>
      )}

      <div className="flex gap-8">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-28">
            <h3 className="text-sm font-bold text-dark dark:text-white uppercase tracking-wider mb-4">Категории</h3>
            <nav className="space-y-1">
              <button
                onClick={() => handleCategoryClick(null)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  !activeCategory
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-neutral dark:text-white/60 hover:bg-warm-bg dark:hover:bg-white/5 hover:text-dark dark:hover:text-white"
                }`}
              >
                <span>Все категории</span>
                <span className="text-xs opacity-60">{types.length}</span>
              </button>
              {categories.map(([cat, count]) => {
                const meta = allCategoryMeta[cat] || defaultMeta;
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryClick(cat)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                      activeCategory === cat
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-neutral dark:text-white/60 hover:bg-warm-bg dark:hover:bg-white/5 hover:text-dark dark:hover:text-white"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0">
                      <img src={meta.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="flex-1 text-left truncate">{cat}</span>
                    <span className="text-xs opacity-60">{count}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-dark-light shadow-2xl p-5 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-dark dark:text-white">Категории</h3>
                <button onClick={() => setMobileSidebarOpen(false)} className="p-1 text-gray-400 hover:text-dark dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="space-y-1">
                <button
                  onClick={() => handleCategoryClick(null)}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm transition-colors ${
                    !activeCategory
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-neutral dark:text-white/60"
                  }`}
                >
                  <span>Все категории</span>
                  <span className="text-xs opacity-60">{types.length}</span>
                </button>
                {categories.map(([cat, count]) => {
                  const meta = allCategoryMeta[cat] || defaultMeta;
                  return (
                    <button
                      key={cat}
                      onClick={() => handleCategoryClick(cat)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors ${
                        activeCategory === cat
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-neutral dark:text-white/60"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                        <img src={meta.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="flex-1 text-left">{cat}</span>
                      <span className="text-xs opacity-60">{count}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-neutral dark:text-white/60 mb-2">Ничего не найдено</p>
              <p className="text-sm text-gray-400">
                Попробуйте другой запрос или{" "}
                <button onClick={() => { setSearch(""); setActiveCategory(null); }} className="text-primary hover:underline">
                  сбросьте фильтры
                </button>
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((item) => {
                const catImage = getCategoryImage(item.category);
                const isExpanded = expandedTypeId === item.id;
                const itemSubTypes = subTypes[item.id] || [];
                const isLoading = loadingSubTypes === item.id;
                return (
                  <div
                    key={item.id}
                    className={`group bg-white dark:bg-dark-light border rounded-2xl overflow-hidden transition-shadow ${
                      isExpanded
                        ? "border-primary/30 shadow-lg shadow-primary/5"
                        : "border-gray-100 dark:border-white/5 hover:shadow-lg hover:border-primary/20"
                    }`}
                  >
                    {/* Card image */}
                    <div className="relative h-36 overflow-hidden bg-gray-50 dark:bg-white/5">
                      <img
                        src={catImage}
                        alt={item.name}
                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      {item.category && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 dark:bg-dark/90 backdrop-blur-sm text-xs font-medium text-dark dark:text-white rounded-lg">
                          {item.category}
                        </span>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="p-4">
                      <h3 className="font-bold text-dark dark:text-white text-sm mb-3 leading-snug line-clamp-2">
                        {item.name}
                      </h3>

                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-neutral dark:text-white/50">
                          Индивидуальный расчёт
                        </p>
                        <button
                          onClick={() => handleExpandSubTypes(item.id)}
                          className={`shrink-0 flex items-center gap-1.5 text-white text-xs font-semibold px-5 py-2 rounded-xl transition-colors ${
                            isExpanded ? "bg-primary-dark" : "bg-primary hover:bg-primary-dark"
                          }`}
                        >
                          Заказать
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                      </div>

                      {/* Sub-type selector (expanded) */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
                          <p className="text-xs font-semibold text-dark dark:text-white mb-2.5">
                            Уточните тип оборудования:
                          </p>
                          {isLoading ? (
                            <div className="flex items-center gap-2 py-3 text-xs text-neutral dark:text-white/50">
                              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                              Загрузка...
                            </div>
                          ) : itemSubTypes.length > 0 ? (
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                              {itemSubTypes.map((sub) => (
                                <button
                                  key={sub.id}
                                  onClick={() => handleSubTypeSelect(item, sub.name)}
                                  className="w-full text-left px-3 py-2 text-xs rounded-lg bg-warm-bg dark:bg-white/5 text-dark dark:text-white hover:bg-primary/10 hover:text-primary transition-colors"
                                >
                                  {sub.name}
                                </button>
                              ))}
                              {/* Custom input */}
                              <div className="pt-1.5">
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Другой тип..."
                                    value={customSubType}
                                    onChange={(e) => setCustomSubType(e.target.value)}
                                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-dark dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary/50"
                                  />
                                  {customSubType.trim() && (
                                    <button
                                      onClick={() => handleSubTypeSelect(item, customSubType.trim())}
                                      className="shrink-0 px-3 py-2 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                                    >
                                      OK
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <p className="text-xs text-neutral dark:text-white/50 mb-2">
                                Введите тип вашего оборудования:
                              </p>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Укажите модель или тип..."
                                  value={customSubType}
                                  onChange={(e) => setCustomSubType(e.target.value)}
                                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-dark dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary/50"
                                />
                                {customSubType.trim() && (
                                  <button
                                    onClick={() => handleSubTypeSelect(item, customSubType.trim())}
                                    className="shrink-0 px-3 py-2 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                                  >
                                    OK
                                  </button>
                                )}
                              </div>
                              <button
                                onClick={() => handleSubTypeSelect(item, "")}
                                className="text-xs text-primary hover:underline mt-1"
                              >
                                Пропустить
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
