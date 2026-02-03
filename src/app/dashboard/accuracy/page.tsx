"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const accuracyData = [
  {
    title: "Классы точности по ГОСТ 8.401-80",
    description: "Общие требования к классам точности средств измерений",
    tables: [
      {
        name: "Приборы с аддитивной погрешностью",
        headers: ["Класс точности", "Пределы допускаемой погрешности, %"],
        rows: [
          ["0,05", "±0,05"],
          ["0,1", "±0,1"],
          ["0,2", "±0,2"],
          ["0,5", "±0,5"],
          ["1,0", "±1,0"],
          ["1,5", "±1,5"],
          ["2,5", "±2,5"],
          ["4,0", "±4,0"],
        ],
      },
    ],
  },
  {
    title: "Манометры (ГОСТ 2405-88)",
    description: "Классы точности манометров, вакуумметров и мановакуумметров",
    tables: [
      {
        name: "Классы точности",
        headers: ["Класс точности", "Допускаемая погрешность, %", "Применение"],
        rows: [
          ["0,15", "±0,15", "Образцовые"],
          ["0,25", "±0,25", "Образцовые"],
          ["0,4", "±0,4", "Образцовые/Рабочие"],
          ["0,6", "±0,6", "Рабочие повышенной точности"],
          ["1,0", "±1,0", "Рабочие"],
          ["1,5", "±1,5", "Рабочие"],
          ["2,5", "±2,5", "Рабочие"],
          ["4,0", "±4,0", "Технические"],
        ],
      },
    ],
  },
  {
    title: "Термопреобразователи сопротивления (ГОСТ 6651-2009)",
    description: "Классы допуска для платиновых, медных и никелевых термопреобразователей",
    tables: [
      {
        name: "Платиновые термопреобразователи (Pt100)",
        headers: ["Класс допуска", "Допуск при 0°C", "Диапазон температур"],
        rows: [
          ["AA (1/10 DIN)", "±0,03°C", "-50...+250°C"],
          ["A (1/3 DIN)", "±0,15°C", "-100...+450°C"],
          ["B", "±0,30°C", "-196...+600°C"],
          ["C", "±0,60°C", "-196...+600°C"],
        ],
      },
      {
        name: "Формула расчёта допуска",
        headers: ["Класс", "Формула (t в °C)"],
        rows: [
          ["AA", "±(0,03 + 0,0005|t|)"],
          ["A", "±(0,15 + 0,002|t|)"],
          ["B", "±(0,30 + 0,005|t|)"],
          ["C", "±(0,60 + 0,01|t|)"],
        ],
      },
    ],
  },
  {
    title: "Термопары (ГОСТ Р 8.585-2001)",
    description: "Классы допуска для термоэлектрических преобразователей",
    tables: [
      {
        name: "Термопары типа K (хромель-алюмель)",
        headers: ["Класс", "Допуск", "Диапазон"],
        rows: [
          ["1", "±1,5°C или ±0,004|t|", "-40...+1000°C"],
          ["2", "±2,5°C или ±0,0075|t|", "-40...+1200°C"],
          ["3", "±2,5°C или ±0,015|t|", "-200...+40°C"],
        ],
      },
      {
        name: "Термопары типа T (медь-константан)",
        headers: ["Класс", "Допуск", "Диапазон"],
        rows: [
          ["1", "±0,5°C или ±0,004|t|", "-40...+350°C"],
          ["2", "±1,0°C или ±0,0075|t|", "-40...+350°C"],
          ["3", "±1,0°C или ±0,015|t|", "-200...+40°C"],
        ],
      },
    ],
  },
  {
    title: "Электроизмерительные приборы (ГОСТ 22261-94)",
    description: "Классы точности аналоговых электроизмерительных приборов",
    tables: [
      {
        name: "Классы точности",
        headers: ["Класс", "Погрешность, %", "Тип прибора"],
        rows: [
          ["0,05", "±0,05", "Образцовые"],
          ["0,1", "±0,1", "Образцовые"],
          ["0,2", "±0,2", "Лабораторные"],
          ["0,5", "±0,5", "Лабораторные"],
          ["1,0", "±1,0", "Технические"],
          ["1,5", "±1,5", "Технические"],
          ["2,5", "±2,5", "Щитовые"],
          ["4,0", "±4,0", "Индикаторные"],
        ],
      },
    ],
  },
];

export default function AccuracyPage() {
  const [activeSection, setActiveSection] = useState(0);

  return (
    <div className="min-h-screen bg-warm-bg dark:bg-dark">
      {/* Header */}
      <div className="gradient-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="font-bold">ЦСМ</span>
          </Link>
          <span className="text-white/40 text-sm">/ Классы точности</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-dark dark:text-white mb-2">
            Классы точности
          </h1>
          <p className="text-neutral dark:text-white/70 mb-6">
            Справочные таблицы классов точности измерительных приборов
          </p>

          {/* Navigation */}
          <div className="flex flex-wrap gap-2 mb-6">
            {accuracyData.map((section, index) => (
              <button
                key={index}
                onClick={() => setActiveSection(index)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeSection === index
                    ? "gradient-primary text-white shadow-lg shadow-primary/30"
                    : "bg-white dark:bg-dark-light text-dark dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                }`}
              >
                {section.title.split("(")[0].trim()}
              </button>
            ))}
          </div>

          {/* Active Section */}
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-dark-light rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-xl font-bold text-dark dark:text-white mb-2">
              {accuracyData[activeSection].title}
            </h2>
            <p className="text-neutral dark:text-white/70 mb-6">
              {accuracyData[activeSection].description}
            </p>

            <div className="space-y-8">
              {accuracyData[activeSection].tables.map((table, tableIndex) => (
                <div key={tableIndex}>
                  <h3 className="text-sm font-semibold text-dark dark:text-white mb-3">
                    {table.name}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-white/5">
                          {table.headers.map((header, i) => (
                            <th
                              key={i}
                              className="px-4 py-3 text-left font-semibold text-dark dark:text-white"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.map((row, rowIndex) => (
                          <tr
                            key={rowIndex}
                            className="border-t border-gray-100 dark:border-white/5"
                          >
                            {row.map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className={`px-4 py-3 ${
                                  cellIndex === 0
                                    ? "font-mono font-medium text-primary"
                                    : "text-dark dark:text-white/80"
                                }`}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Back link */}
          <div className="mt-8 text-center">
            <Link href="/dashboard" className="text-primary hover:underline text-sm font-medium">
              ← Вернуться в личный кабинет
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
