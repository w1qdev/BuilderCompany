"use client";

import { useState } from "react";

export default function UncertaintyPage() {
  const [mode, setMode] = useState<"typeA" | "typeB">("typeA");

  // Type A: statistical
  const [measurements, setMeasurements] = useState("");
  const [typeAResult, setTypeAResult] = useState<{
    mean: number;
    stdDev: number;
    uncertainty: number;
    expandedUncertainty: number;
    n: number;
  } | null>(null);

  // Type B: non-statistical
  const [rangeLimit, setRangeLimit] = useState("");
  const [distribution, setDistribution] = useState<"uniform" | "normal" | "triangular">("uniform");
  const [confidenceLevel, setConfidenceLevel] = useState("0.95");
  const [typeBResult, setTypeBResult] = useState<{
    uncertainty: number;
    expandedUncertainty: number;
    divisor: number;
  } | null>(null);

  const calculateTypeA = () => {
    const values = measurements
      .split(/[\s,;]+/)
      .map((v) => parseFloat(v.replace(",", ".")))
      .filter((v) => !isNaN(v));

    if (values.length < 2) return;

    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);
    const stdDev = Math.sqrt(variance);
    const uncertainty = stdDev / Math.sqrt(n);

    // Student's t-coefficient for 95% confidence
    const tTable: Record<number, number> = {
      2: 12.71, 3: 4.303, 4: 3.182, 5: 2.776, 6: 2.571,
      7: 2.447, 8: 2.365, 9: 2.306, 10: 2.262, 15: 2.145,
      20: 2.093, 25: 2.064, 30: 2.045, 50: 2.009, 100: 1.984,
    };
    const df = n - 1;
    let t = 1.96;
    const keys = Object.keys(tTable).map(Number).sort((a, b) => a - b);
    for (const k of keys) {
      if (df <= k) { t = tTable[k]; break; }
    }

    const expandedUncertainty = uncertainty * t;

    setTypeAResult({ mean, stdDev, uncertainty, expandedUncertainty, n });
  };

  const calculateTypeB = () => {
    const limit = parseFloat(rangeLimit.replace(",", "."));
    if (isNaN(limit) || limit <= 0) return;

    const divisors: Record<string, number> = {
      uniform: Math.sqrt(3),
      normal: 3,
      triangular: Math.sqrt(6),
    };

    const divisor = divisors[distribution];
    const uncertainty = limit / divisor;

    const k = parseFloat(confidenceLevel) === 0.99 ? 2.576 : parseFloat(confidenceLevel) === 0.95 ? 1.96 : 1.645;
    const expandedUncertainty = uncertainty * k;

    setTypeBResult({ uncertainty, expandedUncertainty, divisor });
  };

  const formatNum = (n: number, digits = 6) => n.toFixed(digits).replace(/\.?0+$/, "") || "0";

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-dark dark:text-white mb-2">
        Калькулятор неопределённости измерений
      </h1>
      <p className="text-sm text-neutral dark:text-white/60 mb-6">
        Расчёт стандартной и расширенной неопределённости по типу A и типу B (ГОСТ Р 54500.3)
      </p>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode("typeA")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            mode === "typeA"
              ? "gradient-primary text-white shadow-md"
              : "bg-white dark:bg-dark-light text-neutral hover:bg-gray-50"
          }`}
        >
          Тип A (статистический)
        </button>
        <button
          onClick={() => setMode("typeB")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            mode === "typeB"
              ? "gradient-primary text-white shadow-md"
              : "bg-white dark:bg-dark-light text-neutral hover:bg-gray-50"
          }`}
        >
          Тип B (нестатистический)
        </button>
      </div>

      {mode === "typeA" && (
        <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-dark dark:text-white mb-1">Оценка типа A</h2>
          <p className="text-xs text-neutral dark:text-white/50 mb-4">
            Введите результаты измерений (через запятую, пробел или каждое на новой строке)
          </p>

          <textarea
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm font-mono min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="10.05, 10.02, 10.08, 9.98, 10.03"
            value={measurements}
            onChange={(e) => setMeasurements(e.target.value)}
          />

          <button
            onClick={calculateTypeA}
            className="mt-4 px-6 py-2.5 gradient-primary text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/30 transition-shadow"
          >
            Рассчитать
          </button>

          {typeAResult && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-3">
              <h3 className="font-semibold text-dark dark:text-white">Результаты</h3>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-neutral">Число измерений (n):</span>
                  <span className="ml-2 font-medium text-dark dark:text-white">{typeAResult.n}</span>
                </div>
                <div>
                  <span className="text-neutral">Среднее значение:</span>
                  <span className="ml-2 font-medium text-dark dark:text-white font-mono">{formatNum(typeAResult.mean)}</span>
                </div>
                <div>
                  <span className="text-neutral">СКО (S):</span>
                  <span className="ml-2 font-medium text-dark dark:text-white font-mono">{formatNum(typeAResult.stdDev)}</span>
                </div>
                <div>
                  <span className="text-neutral">u(A) стандартная:</span>
                  <span className="ml-2 font-semibold text-primary font-mono">{formatNum(typeAResult.uncertainty)}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-neutral">U расширенная (P=0.95):</span>
                  <span className="ml-2 font-bold text-primary text-lg font-mono">{formatNum(typeAResult.expandedUncertainty)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === "typeB" && (
        <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-dark dark:text-white mb-1">Оценка типа B</h2>
          <p className="text-xs text-neutral dark:text-white/50 mb-4">
            Введите границу допускаемой погрешности и выберите закон распределения
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral mb-1">Граница погрешности (a)</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="0.05"
                value={rangeLimit}
                onChange={(e) => setRangeLimit(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral mb-1">Закон распределения</label>
              <div className="flex gap-2">
                {[
                  { value: "uniform", label: "Равномерное", desc: "k = √3" },
                  { value: "normal", label: "Нормальное", desc: "k = 3" },
                  { value: "triangular", label: "Треугольное", desc: "k = √6" },
                ].map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDistribution(d.value as typeof distribution)}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-colors ${
                      distribution === d.value
                        ? "gradient-primary text-white"
                        : "bg-gray-100 dark:bg-white/5 text-neutral hover:bg-gray-200"
                    }`}
                  >
                    <div>{d.label}</div>
                    <div className="text-xs opacity-70">{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral mb-1">Уровень доверия</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                value={confidenceLevel}
                onChange={(e) => setConfidenceLevel(e.target.value)}
              >
                <option value="0.90">P = 0.90 (k = 1.645)</option>
                <option value="0.95">P = 0.95 (k = 1.96)</option>
                <option value="0.99">P = 0.99 (k = 2.576)</option>
              </select>
            </div>

            <button
              onClick={calculateTypeB}
              className="px-6 py-2.5 gradient-primary text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/30 transition-shadow"
            >
              Рассчитать
            </button>
          </div>

          {typeBResult && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-3">
              <h3 className="font-semibold text-dark dark:text-white">Результаты</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-neutral">Делитель распределения:</span>
                  <span className="ml-2 font-medium text-dark dark:text-white font-mono">{formatNum(typeBResult.divisor, 4)}</span>
                </div>
                <div>
                  <span className="text-neutral">u(B) стандартная:</span>
                  <span className="ml-2 font-semibold text-primary font-mono">{formatNum(typeBResult.uncertainty)}</span>
                </div>
                <div>
                  <span className="text-neutral">U расширенная:</span>
                  <span className="ml-2 font-bold text-primary text-lg font-mono">{formatNum(typeBResult.expandedUncertainty)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reference info */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-5">
        <h3 className="font-semibold text-dark dark:text-white mb-2">Справка</h3>
        <div className="text-sm text-neutral dark:text-white/60 space-y-1">
          <p><strong>Тип A</strong> — статистический анализ серии наблюдений. Стандартная неопределённость u(A) = S/√n.</p>
          <p><strong>Тип B</strong> — оценка на основе паспортных данных, класса точности, предыдущего опыта.</p>
          <p>Расширенная неопределённость U = k·u, где k — коэффициент охвата для заданного уровня доверия.</p>
          <p className="text-xs mt-2">Нормативная база: ГОСТ Р 54500.3-2011 (ISO/IEC Guide 98-3:2008), РМГ 43-2001</p>
        </div>
      </div>
    </div>
  );
}
