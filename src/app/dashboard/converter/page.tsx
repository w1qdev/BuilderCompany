"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

type Category = "length" | "mass" | "pressure" | "temperature" | "force" | "energy";

interface Unit {
  name: string;
  symbol: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

const unitCategories: Record<Category, { name: string; units: Unit[] }> = {
  length: {
    name: "Длина",
    units: [
      { name: "Метр", symbol: "м", toBase: (v) => v, fromBase: (v) => v },
      { name: "Километр", symbol: "км", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { name: "Сантиметр", symbol: "см", toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      { name: "Миллиметр", symbol: "мм", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { name: "Микрометр", symbol: "мкм", toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
      { name: "Нанометр", symbol: "нм", toBase: (v) => v / 1e9, fromBase: (v) => v * 1e9 },
      { name: "Дюйм", symbol: "in", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
      { name: "Фут", symbol: "ft", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    ],
  },
  mass: {
    name: "Масса",
    units: [
      { name: "Килограмм", symbol: "кг", toBase: (v) => v, fromBase: (v) => v },
      { name: "Грамм", symbol: "г", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { name: "Миллиграмм", symbol: "мг", toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
      { name: "Тонна", symbol: "т", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { name: "Фунт", symbol: "lb", toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
      { name: "Унция", symbol: "oz", toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
    ],
  },
  pressure: {
    name: "Давление",
    units: [
      { name: "Паскаль", symbol: "Па", toBase: (v) => v, fromBase: (v) => v },
      { name: "Килопаскаль", symbol: "кПа", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { name: "Мегапаскаль", symbol: "МПа", toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
      { name: "Бар", symbol: "бар", toBase: (v) => v * 1e5, fromBase: (v) => v / 1e5 },
      { name: "Миллибар", symbol: "мбар", toBase: (v) => v * 100, fromBase: (v) => v / 100 },
      { name: "Атмосфера", symbol: "атм", toBase: (v) => v * 101325, fromBase: (v) => v / 101325 },
      { name: "мм рт. ст.", symbol: "мм рт.ст.", toBase: (v) => v * 133.322, fromBase: (v) => v / 133.322 },
      { name: "кгс/см²", symbol: "кгс/см²", toBase: (v) => v * 98066.5, fromBase: (v) => v / 98066.5 },
      { name: "PSI", symbol: "psi", toBase: (v) => v * 6894.76, fromBase: (v) => v / 6894.76 },
    ],
  },
  temperature: {
    name: "Температура",
    units: [
      { name: "Цельсий", symbol: "°C", toBase: (v) => v, fromBase: (v) => v },
      { name: "Кельвин", symbol: "K", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
      { name: "Фаренгейт", symbol: "°F", toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
    ],
  },
  force: {
    name: "Сила",
    units: [
      { name: "Ньютон", symbol: "Н", toBase: (v) => v, fromBase: (v) => v },
      { name: "Килоньютон", symbol: "кН", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { name: "Меганьютон", symbol: "МН", toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
      { name: "Дин", symbol: "дин", toBase: (v) => v / 1e5, fromBase: (v) => v * 1e5 },
      { name: "Килограмм-сила", symbol: "кгс", toBase: (v) => v * 9.80665, fromBase: (v) => v / 9.80665 },
      { name: "Фунт-сила", symbol: "lbf", toBase: (v) => v * 4.44822, fromBase: (v) => v / 4.44822 },
    ],
  },
  energy: {
    name: "Энергия",
    units: [
      { name: "Джоуль", symbol: "Дж", toBase: (v) => v, fromBase: (v) => v },
      { name: "Килоджоуль", symbol: "кДж", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { name: "Мегаджоуль", symbol: "МДж", toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
      { name: "Калория", symbol: "кал", toBase: (v) => v * 4.184, fromBase: (v) => v / 4.184 },
      { name: "Килокалория", symbol: "ккал", toBase: (v) => v * 4184, fromBase: (v) => v / 4184 },
      { name: "Ватт-час", symbol: "Вт·ч", toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
      { name: "Киловатт-час", symbol: "кВт·ч", toBase: (v) => v * 3.6e6, fromBase: (v) => v / 3.6e6 },
      { name: "Электронвольт", symbol: "эВ", toBase: (v) => v * 1.602e-19, fromBase: (v) => v / 1.602e-19 },
    ],
  },
};

export default function ConverterPage() {
  const [category, setCategory] = useState<Category>("length");
  const [fromUnit, setFromUnit] = useState(0);
  const [toUnit, setToUnit] = useState(1);
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");

  const currentUnits = unitCategories[category].units;

  useEffect(() => {
    setFromUnit(0);
    setToUnit(1);
    setFromValue("");
    setToValue("");
  }, [category]);

  const convert = (value: string, direction: "from" | "to") => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      if (direction === "from") setToValue("");
      else setFromValue("");
      return;
    }

    if (direction === "from") {
      const baseValue = currentUnits[fromUnit].toBase(numValue);
      const result = currentUnits[toUnit].fromBase(baseValue);
      setToValue(formatNumber(result));
    } else {
      const baseValue = currentUnits[toUnit].toBase(numValue);
      const result = currentUnits[fromUnit].fromBase(baseValue);
      setFromValue(formatNumber(result));
    }
  };

  const formatNumber = (num: number): string => {
    if (Math.abs(num) < 0.0001 || Math.abs(num) >= 1e10) {
      return num.toExponential(6);
    }
    return num.toPrecision(10).replace(/\.?0+$/, "");
  };

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setFromValue(toValue);
    setToValue(fromValue);
  };

  return (
    <div className="min-h-screen bg-warm-bg dark:bg-dark">
      {/* Header */}
      <div className="gradient-dark text-white">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="font-bold">ЦСМ</span>
          </Link>
          <span className="text-white/40 text-sm">/ Конвертер единиц</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-dark dark:text-white mb-2">
            Конвертер единиц измерения
          </h1>
          <p className="text-neutral dark:text-white/70 mb-6">
            Перевод между единицами измерения физических величин
          </p>

          {/* Category Selector */}
          <div className="flex flex-wrap gap-2 mb-6">
            {(Object.keys(unitCategories) as Category[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  category === cat
                    ? "gradient-primary text-white shadow-lg shadow-primary/30"
                    : "bg-white dark:bg-dark-light text-dark dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                }`}
              >
                {unitCategories[cat].name}
              </button>
            ))}
          </div>

          {/* Converter */}
          <div className="bg-white dark:bg-dark-light rounded-2xl shadow-lg p-6">
            <div className="space-y-4">
              {/* From */}
              <div>
                <label className="block text-sm font-medium text-dark dark:text-white mb-2">
                  Из
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={fromValue}
                    onChange={(e) => {
                      setFromValue(e.target.value);
                      convert(e.target.value, "from");
                    }}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Введите значение"
                  />
                  <select
                    value={fromUnit}
                    onChange={(e) => {
                      setFromUnit(parseInt(e.target.value));
                      if (fromValue) convert(fromValue, "from");
                    }}
                    className="px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    {currentUnits.map((unit, index) => (
                      <option key={index} value={index}>
                        {unit.name} ({unit.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Swap button */}
              <div className="flex justify-center">
                <button
                  onClick={swapUnits}
                  className="p-2 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                >
                  <svg className="w-5 h-5 text-dark dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
              </div>

              {/* To */}
              <div>
                <label className="block text-sm font-medium text-dark dark:text-white mb-2">
                  В
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={toValue}
                    onChange={(e) => {
                      setToValue(e.target.value);
                      convert(e.target.value, "to");
                    }}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Результат"
                  />
                  <select
                    value={toUnit}
                    onChange={(e) => {
                      setToUnit(parseInt(e.target.value));
                      if (fromValue) convert(fromValue, "from");
                    }}
                    className="px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    {currentUnits.map((unit, index) => (
                      <option key={index} value={index}>
                        {unit.name} ({unit.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick result */}
              {fromValue && toValue && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <p className="text-center text-dark dark:text-white">
                    <span className="font-semibold">{fromValue}</span>{" "}
                    <span className="text-neutral dark:text-white/70">{currentUnits[fromUnit].symbol}</span>
                    {" = "}
                    <span className="font-semibold text-primary">{toValue}</span>{" "}
                    <span className="text-neutral dark:text-white/70">{currentUnits[toUnit].symbol}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

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
