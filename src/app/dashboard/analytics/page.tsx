"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

interface AnalyticsData {
  equipment: {
    total: number;
    si: number;
    io: number;
    archived: number;
    overdue: number;
    upcoming: number;
    active: number;
  };
  requests: {
    total: number;
    byStatus: { new: number; in_progress: number; done: number };
    monthly: { month: string; count: number }[];
  };
  upcomingByMonth: { month: string; count: number }[];
  fleetGrowth: { month: string; count: number }[];
  verificationsPerMonth: { month: string; count: number }[];
}

const COLORS = {
  primary: "#E87A2E",
  green: "#22c55e",
  yellow: "#f59e0b",
  red: "#ef4444",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  gray: "#6b7280",
};

function StatCard({
  label,
  value,
  sub,
  color = "primary",
}: {
  label: string;
  value: number | string;
  sub?: string;
  color?: "primary" | "green" | "yellow" | "red" | "blue";
}) {
  const colors: Record<string, string> = {
    primary: "bg-orange-50 dark:bg-orange-900/20 text-primary",
    green: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
    yellow: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400",
    red: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
  };
  return (
    <div className="bg-white dark:bg-dark-light rounded-2xl p-5 shadow-sm">
      <p className="text-sm text-neutral dark:text-white/60 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${colors[color].split(" ").pop()}`}>{value}</p>
      {sub && <p className="text-xs text-neutral dark:text-white/40 mt-1">{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-dark-light border border-gray-100 dark:border-white/10 rounded-xl px-3 py-2 shadow-lg text-sm">
        <p className="font-medium text-dark dark:text-white mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-neutral dark:text-white/70">{p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/analytics")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-white/10 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-white/10 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-72 bg-gray-200 dark:bg-white/10 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const equipmentStatusData = [
    { name: "Актуальные", value: data.equipment.active, color: COLORS.green },
    { name: "Скоро истекает", value: data.equipment.upcoming, color: COLORS.yellow },
    { name: "Просрочено", value: data.equipment.overdue, color: COLORS.red },
  ].filter((d) => d.value > 0);

  const requestStatusData = [
    { name: "Новые", value: data.requests.byStatus.new, color: COLORS.blue },
    { name: "В работе", value: data.requests.byStatus.in_progress, color: COLORS.yellow },
    { name: "Завершённые", value: data.requests.byStatus.done, color: COLORS.green },
  ].filter((d) => d.value > 0);

  return (
    <div id="analytics-print" className="space-y-6">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #analytics-print, #analytics-print * { visibility: visible; }
          #analytics-print { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Аналитика</h1>
          <p className="text-sm text-neutral dark:text-white/60 mt-1">
            Сводная статистика по вашему оборудованию и заявкам
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="print:hidden inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-dark-light text-dark dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Экспорт PDF
        </button>
      </div>

      {/* Equipment summary */}
      <div>
        <h2 className="text-sm font-semibold text-neutral dark:text-white/60 uppercase tracking-wider mb-3">
          Парк оборудования
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Всего приборов" value={data.equipment.total} color="primary" />
          <StatCard label="Просрочено" value={data.equipment.overdue} sub="требуют поверки" color="red" />
          <StatCard label="Скоро истекает" value={data.equipment.upcoming} sub="в ближайшие 30 дней" color="yellow" />
          <StatCard label="Актуальные" value={data.equipment.active} sub="поверка действительна" color="green" />
        </div>
      </div>

      {/* Requests summary */}
      <div>
        <h2 className="text-sm font-semibold text-neutral dark:text-white/60 uppercase tracking-wider mb-3">
          Заявки
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Всего заявок" value={data.requests.total} color="primary" />
          <StatCard label="Новые" value={data.requests.byStatus.new} color="blue" />
          <StatCard label="В работе" value={data.requests.byStatus.in_progress} color="yellow" />
          <StatCard label="Завершённые" value={data.requests.byStatus.done} color="green" />
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly requests */}
        <div className="bg-white dark:bg-dark-light rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-dark dark:text-white mb-4">
            Заявки по месяцам (последние 12 мес.)
          </h3>
          {data.requests.total === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-neutral dark:text-white/40">
              Заявок пока нет
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.requests.monthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} name="Заявок" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Upcoming verifications by month */}
        <div className="bg-white dark:bg-dark-light rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-dark dark:text-white mb-4">
            Предстоящие поверки по месяцам (6 мес.)
          </h3>
          {data.equipment.total === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-neutral dark:text-white/40">
              Оборудование не добавлено
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.upcomingByMonth} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill={COLORS.blue} radius={[4, 4, 0, 0]} name="Поверок" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts row 2 — Pie charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment status */}
        <div className="bg-white dark:bg-dark-light rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-dark dark:text-white mb-4">
            Статус оборудования
          </h3>
          {equipmentStatusData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-neutral dark:text-white/40">
              Оборудование не добавлено
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="60%" height={180}>
                <PieChart>
                  <Pie
                    data={equipmentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {equipmentStatusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2">
                {equipmentStatusData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: item.color }} />
                    <span className="text-neutral dark:text-white/70">{item.name}</span>
                    <span className="font-semibold text-dark dark:text-white ml-auto pl-2">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Request status */}
        <div className="bg-white dark:bg-dark-light rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-dark dark:text-white mb-4">
            Статусы заявок
          </h3>
          {requestStatusData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-neutral dark:text-white/40">
              Заявок пока нет
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="60%" height={180}>
                <PieChart>
                  <Pie
                    data={requestStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {requestStatusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2">
                {requestStatusData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: item.color }} />
                    <span className="text-neutral dark:text-white/70">{item.name}</span>
                    <span className="font-semibold text-dark dark:text-white ml-auto pl-2">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts row 3 — Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fleet growth */}
        <div className="bg-white dark:bg-dark-light rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-dark dark:text-white mb-4">
            Рост парка оборудования (12 мес.)
          </h3>
          {data.equipment.total === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-neutral dark:text-white/40">
              Оборудование не добавлено
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.fleetGrowth || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="count" stroke={COLORS.green} strokeWidth={2} dot={{ r: 3 }} name="Добавлено" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Verifications performed */}
        <div className="bg-white dark:bg-dark-light rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-dark dark:text-white mb-4">
            Проведённые поверки (12 мес.)
          </h3>
          {data.equipment.total === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-neutral dark:text-white/40">
              Данных пока нет
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.verificationsPerMonth || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill={COLORS.purple} radius={[4, 4, 0, 0]} name="Поверок" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* SI / IO breakdown */}
      <div className="bg-white dark:bg-dark-light rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-dark dark:text-white mb-4">
          Разбивка по типу оборудования
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-warm-bg dark:bg-dark rounded-xl">
            <p className="text-2xl font-bold text-primary">{data.equipment.si}</p>
            <p className="text-xs text-neutral dark:text-white/60 mt-1">Средств измерений (СИ)</p>
          </div>
          <div className="text-center p-4 bg-warm-bg dark:bg-dark rounded-xl">
            <p className="text-2xl font-bold text-blue-500">{data.equipment.io}</p>
            <p className="text-xs text-neutral dark:text-white/60 mt-1">Испытательное оборудование (ИО)</p>
          </div>
          <div className="text-center p-4 bg-warm-bg dark:bg-dark rounded-xl">
            <p className="text-2xl font-bold text-gray-400">{data.equipment.archived}</p>
            <p className="text-xs text-neutral dark:text-white/60 mt-1">В архиве</p>
          </div>
          <div className="text-center p-4 bg-warm-bg dark:bg-dark rounded-xl">
            <p className="text-2xl font-bold text-dark dark:text-white">{data.equipment.total}</p>
            <p className="text-xs text-neutral dark:text-white/60 mt-1">Всего активного</p>
          </div>
        </div>
      </div>
    </div>
  );
}
