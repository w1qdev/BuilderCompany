"use client";

import { useEffect, useState } from "react";

interface Equipment {
  id: number;
  name: string;
  type: string | null;
  serialNumber: string | null;
  verificationDate: string | null;
  nextVerification: string | null;
  interval: number;
  category: string;
  status: string;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("ru-RU");
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export default function MpiPage() {
  // Manual calculator state
  const [lastDate, setLastDate] = useState("");
  const [mpi, setMpi] = useState("12");
  const [calcResult, setCalcResult] = useState<{
    next: Date;
    daysLeft: number;
    status: "ok" | "soon" | "overdue";
  } | null>(null);

  // Equipment-based analysis
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [eqLoading, setEqLoading] = useState(true);

  useEffect(() => {
    fetch("/api/equipment")
      .then((r) => r.json())
      .then((data) => setEquipment(data.equipment || []))
      .catch(() => {})
      .finally(() => setEqLoading(false));
  }, []);

  const calculate = () => {
    const date = new Date(lastDate);
    const months = parseInt(mpi, 10);
    if (isNaN(date.getTime()) || isNaN(months) || months <= 0) return;

    const next = addMonths(date, months);
    const now = new Date();
    const daysLeft = daysBetween(now, next);
    let status: "ok" | "soon" | "overdue" = "ok";
    if (daysLeft < 0) status = "overdue";
    else if (daysLeft <= 14) status = "soon";

    setCalcResult({ next, daysLeft, status });
  };

  const statusColor = {
    ok: "text-green-600 dark:text-green-400",
    soon: "text-yellow-600 dark:text-yellow-400",
    overdue: "text-red-600 dark:text-red-400",
  };

  const statusLabel = {
    ok: "Поверка не требуется",
    soon: "Скоро требуется поверка",
    overdue: "Поверка просрочена",
  };

  // Statistics from equipment
  const siItems = equipment.filter((e) => e.category === "verification");
  const overdue = siItems.filter((e) => {
    if (!e.nextVerification) return false;
    return new Date(e.nextVerification) < new Date();
  });
  const soon = siItems.filter((e) => {
    if (!e.nextVerification) return false;
    const d = daysBetween(new Date(), new Date(e.nextVerification));
    return d >= 0 && d <= 14;
  });
  const avgMpi =
    siItems.length > 0
      ? Math.round(siItems.reduce((s, e) => s + e.interval, 0) / siItems.length)
      : null;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark dark:text-white">Калькулятор МПИ</h1>
        <p className="text-neutral dark:text-white/60 text-sm mt-1">
          Расчёт следующей даты поверки и анализ межповерочных интервалов
        </p>
      </div>

      {/* Manual Calculator */}
      <div className="bg-white dark:bg-dark-light rounded-2xl p-6 border border-gray-100 dark:border-white/10">
        <h2 className="text-base font-semibold text-dark dark:text-white mb-4">
          Расчёт даты следующей поверки
        </h2>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-neutral dark:text-white/60 mb-1">
              Дата последней поверки
            </label>
            <input
              type="date"
              value={lastDate}
              onChange={(e) => { setLastDate(e.target.value); setCalcResult(null); }}
              className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-warm-bg dark:bg-dark px-3 py-2 text-dark dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral dark:text-white/60 mb-1">
              МПИ (месяцев)
            </label>
            <input
              type="number"
              min={1}
              max={120}
              value={mpi}
              onChange={(e) => { setMpi(e.target.value); setCalcResult(null); }}
              className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-warm-bg dark:bg-dark px-3 py-2 text-dark dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="12"
            />
          </div>
        </div>

        <button
          onClick={calculate}
          disabled={!lastDate || !mpi}
          className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Рассчитать
        </button>

        {calcResult && (
          <div className="mt-5 p-4 rounded-xl bg-gray-50 dark:bg-dark border border-gray-100 dark:border-white/10">
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-neutral dark:text-white/40 uppercase tracking-wider mb-1">Следующая поверка</div>
                <div className="text-xl font-bold text-dark dark:text-white">{fmtDate(calcResult.next)}</div>
              </div>
              <div>
                <div className="text-xs text-neutral dark:text-white/40 uppercase tracking-wider mb-1">
                  {calcResult.daysLeft >= 0 ? "Осталось дней" : "Просрочено на"}
                </div>
                <div className={`text-xl font-bold ${statusColor[calcResult.status]}`}>
                  {Math.abs(calcResult.daysLeft)} дн.
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral dark:text-white/40 uppercase tracking-wider mb-1">Статус</div>
                <div className={`text-sm font-semibold ${statusColor[calcResult.status]}`}>
                  {statusLabel[calcResult.status]}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Standard MPI reference */}
      <div className="bg-white dark:bg-dark-light rounded-2xl p-6 border border-gray-100 dark:border-white/10">
        <h2 className="text-base font-semibold text-dark dark:text-white mb-4">
          Типовые межповерочные интервалы
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10">
                <th className="text-left py-2 pr-4 text-neutral dark:text-white/50 font-medium">Тип СИ</th>
                <th className="text-left py-2 pr-4 text-neutral dark:text-white/50 font-medium">МПИ</th>
                <th className="text-left py-2 text-neutral dark:text-white/50 font-medium">Нормативный документ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
              {[
                ["Манометры", "12 мес.", "ГОСТ 2405-88"],
                ["Термометры ртутные", "12 мес.", "ГОСТ 28498-90"],
                ["Весы лабораторные", "12 мес.", "ГОСТ OIML R 76-1"],
                ["Счётчики электроэнергии", "16 лет (однофаз.) / 10 лет (трёхфаз.)", "ПП РФ № 442"],
                ["Тепловычислители", "4 года", "ГОСТ Р 54964"],
                ["Расходомеры", "4 года", "МИ 2539"],
                ["Мультиметры", "12 мес.", "ПО на прибор"],
                ["Микрометры", "12 мес.", "ГОСТ 6507-90"],
                ["Штангенциркули", "12 мес.", "ГОСТ 166-89"],
                ["Термогигрометры", "12 мес.", "ПО на прибор"],
              ].map(([type, mpiVal, doc]) => (
                <tr key={type}>
                  <td className="py-2.5 pr-4 text-dark dark:text-white font-medium">{type}</td>
                  <td className="py-2.5 pr-4 text-primary font-semibold">{mpiVal}</td>
                  <td className="py-2.5 text-neutral dark:text-white/50">{doc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-neutral dark:text-white/40 mt-3">
          * Интервалы могут отличаться в зависимости от условий эксплуатации и требований конкретного предприятия.
        </p>
      </div>

      {/* Equipment stats */}
      {!eqLoading && siItems.length > 0 && (
        <div className="bg-white dark:bg-dark-light rounded-2xl p-6 border border-gray-100 dark:border-white/10">
          <h2 className="text-base font-semibold text-dark dark:text-white mb-4">
            Анализ вашего парка СИ
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            {[
              { label: "Всего СИ", value: siItems.length, color: "text-dark dark:text-white" },
              { label: "Просрочено", value: overdue.length, color: overdue.length > 0 ? "text-red-600 dark:text-red-400" : "text-dark dark:text-white" },
              { label: "Скоро (<14 дн.)", value: soon.length, color: soon.length > 0 ? "text-yellow-600 dark:text-yellow-400" : "text-dark dark:text-white" },
              { label: "Средний МПИ", value: avgMpi ? `${avgMpi} мес.` : "—", color: "text-primary" },
            ].map((s) => (
              <div key={s.label} className="bg-warm-bg dark:bg-dark rounded-xl p-4 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-neutral dark:text-white/40 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {overdue.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                Просроченные поверки
              </div>
              <div className="space-y-2">
                {overdue.map((eq) => (
                  <div
                    key={eq.id}
                    className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-400/20"
                  >
                    <div>
                      <div className="text-sm font-medium text-dark dark:text-white">{eq.name}</div>
                      {eq.serialNumber && (
                        <div className="text-xs text-neutral dark:text-white/40">№ {eq.serialNumber}</div>
                      )}
                    </div>
                    <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                      {eq.nextVerification
                        ? `${Math.abs(daysBetween(new Date(), new Date(eq.nextVerification)))} дн. назад`
                        : "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
