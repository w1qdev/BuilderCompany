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
  Area,
  AreaChart,
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

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string; color?: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-dark-light border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 shadow-xl text-sm backdrop-blur-sm">
        <p className="font-semibold text-dark dark:text-white mb-1.5 text-xs uppercase tracking-wide">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color || COLORS.primary }} />
            <span className="text-neutral dark:text-white/70">{p.name}:</span>
            <span className="font-bold text-dark dark:text-white">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

function ChartCard({
  title,
  subtitle,
  icon,
  accentColor,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative bg-white dark:bg-dark-light rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-shadow ${className}`}>
      <div className="absolute top-0 left-0 right-0 h-1 opacity-80" style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}00)` }} />
      <div className="p-5 pb-2">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-dark dark:text-white">{title}</h3>
            {subtitle && <p className="text-xs text-neutral dark:text-white/40 mt-0.5">{subtitle}</p>}
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accentColor}15` }}>
            <div style={{ color: accentColor }}>{icon}</div>
          </div>
        </div>
      </div>
      <div className="px-5 pb-5">{children}</div>
    </div>
  );
}

function DonutCenter({ value, label }: { value: number; label: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <span className="text-2xl font-bold text-dark dark:text-white">{value}</span>
      <span className="text-[10px] text-neutral dark:text-white/40 uppercase tracking-wider">{label}</span>
    </div>
  );
}

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

      {/* Charts row 1 — Bar charts with gradient fills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Просмотры и заявки"
          subtitle="Динамика за последние 12 месяцев"
          accentColor={COLORS.primary}
          icon={
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        >
          {data.requests.total === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-neutral dark:text-white/40">
              Заявок пока нет
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.requests.monthly} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradientPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke={COLORS.primary} strokeWidth={2.5} fill="url(#gradientPrimary)" name="Заявок" dot={{ r: 3, fill: COLORS.primary, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 5, stroke: COLORS.primary, strokeWidth: 2, fill: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Заявки по статусу"
          subtitle="Текущее распределение"
          accentColor={COLORS.blue}
          icon={
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          }
        >
          {requestStatusData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-neutral dark:text-white/40">
              Заявок пока нет
            </div>
          ) : (
            <div className="flex items-center">
              <div className="relative w-1/2">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={requestStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {requestStatusData.map((entry, index) => (
                        <Cell key={`req-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <DonutCenter value={data.requests.total} label="всего" />
              </div>
              <div className="flex-1 space-y-3 pl-4">
                {requestStatusData.map((item) => {
                  const pct = data.requests.total > 0 ? Math.round((item.value / data.requests.total) * 100) : 0;
                  return (
                    <div key={item.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: item.color }} />
                          <span className="text-xs font-medium text-dark dark:text-white">{item.name}</span>
                        </div>
                        <span className="text-xs font-bold text-dark dark:text-white">{item.value}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: item.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Charts row 2 — Donuts + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Статус оборудования"
          subtitle="Текущее состояние парка"
          accentColor={COLORS.green}
          icon={
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        >
          {equipmentStatusData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-neutral dark:text-white/40">
              Оборудование не добавлено
            </div>
          ) : (
            <div className="flex items-center">
              <div className="relative w-1/2">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={equipmentStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {equipmentStatusData.map((entry, index) => (
                        <Cell key={`eq-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <DonutCenter value={data.equipment.total - data.equipment.archived} label="в работе" />
              </div>
              <div className="flex-1 space-y-3 pl-4">
                {equipmentStatusData.map((item) => {
                  const total = data.equipment.active + data.equipment.upcoming + data.equipment.overdue;
                  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                  return (
                    <div key={item.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: item.color }} />
                          <span className="text-xs font-medium text-dark dark:text-white">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-neutral dark:text-white/40">{pct}%</span>
                          <span className="text-xs font-bold text-dark dark:text-white">{item.value}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: item.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Предстоящие поверки"
          subtitle="По месяцам на ближайшие 6 мес."
          accentColor={COLORS.blue}
          icon={
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        >
          {data.equipment.total === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-neutral dark:text-white/40">
              Оборудование не добавлено
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.upcomingByMonth} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="25%">
                <defs>
                  <linearGradient id="gradientBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.blue} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={COLORS.blue} stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="url(#gradientBlue)" radius={[6, 6, 2, 2]} name="Поверок" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Charts row 3 — Trend lines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Рост парка оборудования"
          subtitle="Новые приборы за 12 месяцев"
          accentColor={COLORS.green}
          icon={
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        >
          {data.equipment.total === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-neutral dark:text-white/40">
              Оборудование не добавлено
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.fleetGrowth || []} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradientGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.green} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={COLORS.green} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke={COLORS.green} strokeWidth={2.5} fill="url(#gradientGreen)" name="Добавлено" dot={{ r: 3, fill: COLORS.green, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 5, stroke: COLORS.green, strokeWidth: 2, fill: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Проведённые поверки"
          subtitle="Завершённые поверки за 12 месяцев"
          accentColor={COLORS.purple}
          icon={
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
        >
          {data.equipment.total === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-neutral dark:text-white/40">
              Данных пока нет
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.verificationsPerMonth || []} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="25%">
                <defs>
                  <linearGradient id="gradientPurple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.purple} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={COLORS.purple} stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="url(#gradientPurple)" radius={[6, 6, 2, 2]} name="Поверок" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* SI / IO breakdown — premium cards */}
      <ChartCard
        title="Разбивка по типу оборудования"
        subtitle="Структура парка приборов"
        accentColor={COLORS.primary}
        icon={
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: data.equipment.si, label: "Средства измерений", sub: "СИ", color: COLORS.primary, bg: "bg-orange-50 dark:bg-orange-900/10" },
            { value: data.equipment.io, label: "Испытательное оборудование", sub: "ИО", color: COLORS.blue, bg: "bg-blue-50 dark:bg-blue-900/10" },
            { value: data.equipment.archived, label: "В архиве", sub: "Архив", color: COLORS.gray, bg: "bg-gray-50 dark:bg-white/5" },
            { value: data.equipment.total, label: "Всего в системе", sub: "Итого", color: COLORS.purple, bg: "bg-purple-50 dark:bg-purple-900/10" },
          ].map((item) => (
            <div key={item.sub} className={`relative ${item.bg} rounded-xl p-4 overflow-hidden`}>
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-[0.07]" style={{ background: item.color, transform: "translate(30%, -30%)" }} />
              <p className="text-3xl font-bold mb-1" style={{ color: item.color }}>{item.value}</p>
              <p className="text-xs font-medium text-dark dark:text-white/80">{item.sub}</p>
              <p className="text-[10px] text-neutral dark:text-white/40 mt-0.5 leading-tight">{item.label}</p>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
