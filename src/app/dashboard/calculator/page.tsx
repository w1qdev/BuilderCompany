"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { motion } from "framer-motion";

type CalculatorType = "absolute" | "relative" | "class" | "combined";

export default function CalculatorPage() {
  const [calculatorType, setCalculatorType] = useState<CalculatorType>("absolute");

  // Absolute error inputs
  const [measuredValue, setMeasuredValue] = useState("");
  const [referenceValue, setReferenceValue] = useState("");

  // Class error inputs
  const [classValue, setClassValue] = useState("");
  const [scaleMax, setScaleMax] = useState("");

  // Combined error inputs
  const [errors, setErrors] = useState<string[]>(["", ""]);

  const calculateAbsoluteError = () => {
    const measured = parseFloat(measuredValue);
    const reference = parseFloat(referenceValue);
    if (isNaN(measured) || isNaN(reference)) return null;
    return Math.abs(measured - reference);
  };

  const calculateRelativeError = () => {
    const absolute = calculateAbsoluteError();
    const reference = parseFloat(referenceValue);
    if (absolute === null || isNaN(reference) || reference === 0) return null;
    return (absolute / Math.abs(reference)) * 100;
  };

  const calculateClassError = () => {
    const cls = parseFloat(classValue);
    const max = parseFloat(scaleMax);
    if (isNaN(cls) || isNaN(max)) return null;
    return (cls / 100) * max;
  };

  const calculateCombinedError = () => {
    const numericErrors = errors.map(e => parseFloat(e)).filter(e => !isNaN(e));
    if (numericErrors.length < 2) return null;
    return Math.sqrt(numericErrors.reduce((sum, e) => sum + e * e, 0));
  };

  const addErrorInput = () => {
    if (errors.length < 6) {
      setErrors([...errors, ""]);
    }
  };

  const updateError = (index: number, value: string) => {
    const newErrors = [...errors];
    newErrors[index] = value;
    setErrors(newErrors);
  };

  const removeError = (index: number) => {
    if (errors.length > 2) {
      setErrors(errors.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="min-h-screen bg-warm-bg dark:bg-dark">
      {/* Header */}
      <div className="gradient-dark text-white">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo size="sm" />
          </Link>
          <span className="text-white/40 text-sm">/ Калькулятор погрешностей</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-dark dark:text-white mb-2">
            Калькулятор погрешностей
          </h1>
          <p className="text-neutral dark:text-white/70 mb-6">
            Расчёт различных видов погрешностей измерений
          </p>

          {/* Calculator Type Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            {[
              { type: "absolute" as const, label: "Абсолютная" },
              { type: "relative" as const, label: "Относительная" },
              { type: "class" as const, label: "По классу" },
              { type: "combined" as const, label: "Суммарная" },
            ].map(({ type, label }) => (
              <button
                key={type}
                onClick={() => setCalculatorType(type)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  calculatorType === type
                    ? "gradient-primary text-white shadow-lg shadow-primary/30"
                    : "bg-white dark:bg-dark-light text-dark dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Calculator */}
          <div className="bg-white dark:bg-dark-light rounded-2xl shadow-lg p-6">
            {/* Absolute & Relative Error */}
            {(calculatorType === "absolute" || calculatorType === "relative") && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-dark dark:text-white mb-4">
                  {calculatorType === "absolute" ? "Абсолютная погрешность" : "Относительная погрешность"}
                </h2>

                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 mb-4">
                  <p className="text-sm text-neutral dark:text-white/70">
                    {calculatorType === "absolute"
                      ? "Δ = |X - X₀|, где X — измеренное значение, X₀ — истинное (эталонное) значение"
                      : "δ = (Δ / |X₀|) × 100%, где Δ — абсолютная погрешность, X₀ — истинное значение"}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark dark:text-white mb-1">
                      Измеренное значение (X)
                    </label>
                    <input
                      type="number"
                      value={measuredValue}
                      onChange={(e) => setMeasuredValue(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Например: 100.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark dark:text-white mb-1">
                      Эталонное значение (X₀)
                    </label>
                    <input
                      type="number"
                      value={referenceValue}
                      onChange={(e) => setReferenceValue(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Например: 100.0"
                    />
                  </div>
                </div>

                {/* Results */}
                {measuredValue && referenceValue && (
                  <div className="mt-6 p-4 gradient-primary rounded-xl text-white">
                    <p className="text-sm opacity-80 mb-1">Результат:</p>
                    {calculatorType === "absolute" ? (
                      <p className="text-2xl font-bold">
                        Δ = {calculateAbsoluteError()?.toFixed(6)} ед.
                      </p>
                    ) : (
                      <p className="text-2xl font-bold">
                        δ = {calculateRelativeError()?.toFixed(4)}%
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Class Error */}
            {calculatorType === "class" && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-dark dark:text-white mb-4">
                  Погрешность по классу точности
                </h2>

                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 mb-4">
                  <p className="text-sm text-neutral dark:text-white/70">
                    Δ = (γ / 100) × X_max, где γ — класс точности в %, X_max — верхний предел измерения
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark dark:text-white mb-1">
                      Класс точности (γ), %
                    </label>
                    <input
                      type="number"
                      value={classValue}
                      onChange={(e) => setClassValue(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Например: 0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark dark:text-white mb-1">
                      Верхний предел шкалы (X_max)
                    </label>
                    <input
                      type="number"
                      value={scaleMax}
                      onChange={(e) => setScaleMax(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Например: 100"
                    />
                  </div>
                </div>

                {classValue && scaleMax && (
                  <div className="mt-6 p-4 gradient-primary rounded-xl text-white">
                    <p className="text-sm opacity-80 mb-1">Допускаемая абсолютная погрешность:</p>
                    <p className="text-2xl font-bold">
                      Δ = ±{calculateClassError()?.toFixed(4)} ед.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Combined Error */}
            {calculatorType === "combined" && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-dark dark:text-white mb-4">
                  Суммарная погрешность (корень из суммы квадратов)
                </h2>

                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 mb-4">
                  <p className="text-sm text-neutral dark:text-white/70">
                    Δ_сум = √(Δ₁² + Δ₂² + ... + Δₙ²)
                  </p>
                </div>

                <div className="space-y-3">
                  {errors.map((error, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-dark dark:text-white mb-1">
                          Погрешность Δ{index + 1}
                        </label>
                        <input
                          type="number"
                          value={error}
                          onChange={(e) => updateError(index, e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          placeholder="Значение погрешности"
                        />
                      </div>
                      {errors.length > 2 && (
                        <button
                          onClick={() => removeError(index)}
                          className="self-end p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {errors.length < 6 && (
                  <button
                    onClick={addErrorInput}
                    className="text-primary hover:underline text-sm font-medium"
                  >
                    + Добавить погрешность
                  </button>
                )}

                {errors.filter(e => e !== "").length >= 2 && (
                  <div className="mt-6 p-4 gradient-primary rounded-xl text-white">
                    <p className="text-sm opacity-80 mb-1">Суммарная погрешность:</p>
                    <p className="text-2xl font-bold">
                      Δ_сум = {calculateCombinedError()?.toFixed(6)} ед.
                    </p>
                  </div>
                )}
              </div>
            )}
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
