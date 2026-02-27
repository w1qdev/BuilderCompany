"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const gostCategories = [
  {
    title: "Общие стандарты метрологии",
    gosts: [
      { code: "ГОСТ", name: "ГСИ. Основные положения" },
      { code: "ГОСТ", name: "ГСИ. Методики (методы) измерений" },
      { code: "ГОСТ", name: "ГСИ. Аттестация испытательного оборудования" },
      { code: "ГОСТ", name: "ГСИ. Методики калибровки средств измерений" },
    ],
  },
  {
    title: "Поверка средств измерений",
    gosts: [
      { code: "ГОСТ", name: "ГСИ. Нормальные условия измерений при поверке" },
      { code: "ГОСТ", name: "ГСИ. Метрологическое обеспечение измерительных систем" },
      { code: "ГОСТ", name: "ГСИ. Поверочные схемы. Содержание и построение" },
      { code: "ГОСТ", name: "ГСИ. Нормируемые метрологические характеристики средств измерений" },
    ],
  },
  {
    title: "Измерения физических величин",
    gosts: [
      { code: "ГОСТ", name: "ГСИ. Единицы величин" },
      { code: "ГОСТ", name: "ГСИ. Прямые измерения с многократными наблюдениями" },
      { code: "ГОСТ", name: "ГСИ. Методики выполнения измерений" },
      { code: "ГОСТ", name: "ГСИ. Классы точности средств измерений" },
    ],
  },
  {
    title: "Температурные измерения",
    gosts: [
      { code: "ГОСТ", name: "ГСИ. Государственная поверочная схема для средств измерений температуры" },
      { code: "ГОСТ", name: "Термопреобразователи сопротивления из платины, меди и никеля" },
      { code: "ГОСТ", name: "ГСИ. Термопары. Номинальные статические характеристики преобразования" },
      { code: "ГОСТ", name: "Термометры жидкостные стеклянные" },
    ],
  },
  {
    title: "Измерения давления",
    gosts: [
      { code: "ГОСТ", name: "ГСИ. Средства измерений давления. Термины и определения" },
      { code: "ГОСТ", name: "Манометры, вакуумметры, мановакуумметры, напоромеры" },
      { code: "ГОСТ", name: "ГСИ. Манометры, вакуумметры, мановакуумметры. Методы поверки" },
      { code: "ГОСТ", name: "ГСИ. Государственная поверочная схема для средств измерений избыточного давления" },
    ],
  },
  {
    title: "Электрические измерения",
    gosts: [
      { code: "ГОСТ", name: "ГСИ. Государственная поверочная схема для средств измерений постоянного электрического напряжения и ЭДС" },
      { code: "ГОСТ", name: "ГСИ. Государственный первичный эталон и государственная поверочная схема для средств измерений силы постоянного электрического тока" },
      { code: "ГОСТ", name: "ГСИ. Государственный первичный эталон и государственная поверочная схема для средств измерений электрического сопротивления" },
      { code: "ГОСТ", name: "Средства измерений электрических и магнитных величин. Общие технические условия" },
    ],
  },
];

export default function GostsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<number | null>(0);

  const filteredCategories = gostCategories
    .map((category) => ({
      ...category,
      gosts: category.gosts.filter(
        (gost) =>
          gost.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          gost.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    }))
    .filter((category) => category.gosts.length > 0);

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
          <h1 className="text-2xl sm:text-3xl font-bold text-dark dark:text-white mb-2">
            Справочник ГОСТов
          </h1>
          <p className="text-neutral dark:text-white/70 mb-6">
            Государственные стандарты в области метрологии и измерений
          </p>

          {/* Search */}
          <div className="relative mb-6">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Поиск по номеру или названию ГОСТа..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-light text-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          {/* Categories */}
          <div className="space-y-4">
            {filteredCategories.map((category, categoryIndex) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.1 }}
                className="bg-white dark:bg-dark-light rounded-2xl shadow-lg overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedCategory(
                      expandedCategory === categoryIndex ? null : categoryIndex,
                    )
                  }
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <h2 className="font-semibold text-dark dark:text-white">
                    {category.title}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral dark:text-white/50">
                      {category.gosts.length} стандартов
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedCategory === categoryIndex ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>
                {expandedCategory === categoryIndex && (
                  <div className="px-6 pb-4 space-y-2">
                    {category.gosts.map((gost) => (
                      <div
                        key={gost.code}
                        className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"
                      >
                        <span className="font-mono text-sm text-primary font-medium whitespace-nowrap">
                          {gost.code}
                        </span>
                        <span className="text-sm text-dark dark:text-white/80">
                          {gost.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-neutral dark:text-white/70">
                По запросу «{searchTerm}» ничего не найдено
              </p>
            </div>
          )}

      </motion.div>
    </div>
  );
}
