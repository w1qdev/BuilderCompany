"use client";

import { useAdminAuth } from "@/lib/AdminAuthContext";
import { useCallback, useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface UserStats {
  registrationsByMonth: { month: string; count: number }[];
  topUsers: { id: number; name: string; email: string; requests: number; equipment: number }[];
  totalUsers: number;
  bannedUsers: number;
  activeUsers: number;
}

interface AnalyticsData {
  viewsTimeline: { date: string; views: number }[];
  topPages: { url: string; count: number }[];
  requestsTimeline: { date: string; requests: number }[];
  requestsByStatus: Record<string, number>;
  totalViews: number;
  totalRequests: number;
  totalUsers: number;
  newUsers: number;
  conversionRate: string;
}

const pageNames: Record<string, string> = {
  "/": "Главная",
  "/contacts": "Контакты",
  "/portfolio": "Портфолио",
  "/privacy": "Политика конфиденциальности",
  "/sitemap": "Карта сайта",
  "/login": "Вход",
  "/register": "Регистрация",
  "/forgot-password": "Восстановление пароля",
  "/reset-password": "Сброс пароля",
  "/dashboard": "Личный кабинет",
  "/dashboard/calculator": "Калькулятор погрешностей",
  "/dashboard/converter": "Конвертер единиц",
  "/dashboard/accuracy": "Классы точности",
  "/dashboard/gosts": "База ГОСТов",
  "/dashboard/equipment": "Оборудование",
  "/dashboard/schedule": "График поверки",
  "/dashboard/companies": "Компании",
  "/dashboard/uncertainty": "Неопределённость",
  "/dashboard/protocol": "Протокол поверки",
  "/dashboard/requests": "Мои заявки",
  "/dashboard/profile": "Профиль",
  "/admin": "Админ: Заявки",
  "/admin/analytics": "Админ: Аналитика",
  "/admin/settings": "Админ: Настройки",
};

const COLORS = {
  primary: "#E87A2E",
  green: "#22c55e",
  yellow: "#f59e0b",
  red: "#ef4444",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  pink: "#ec4899",
  indigo: "#6366f1",
  gray: "#6b7280",
};

const statusNames: Record<string, string> = {
  new: "Новые",
  in_progress: "В работе",
  done: "Завершены",
};

const STATUS_COLORS = [COLORS.blue, COLORS.yellow, COLORS.green];

const PERIOD_OPTIONS = [
  { label: "7 дней", value: 7 },
  { label: "14 дней", value: 14 },
  { label: "30 дней", value: 30 },
  { label: "90 дней", value: 90 },
];

// --- Shared Components ---

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string; color?: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-dark-light border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 shadow-xl text-sm backdrop-blur-sm">
        <p className="font-semibold text-dark dark:text-white mb-1.5 text-xs uppercase tracking-wide">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color || COLORS.primary }} />
            <span className="text-neutral dark:text-white/70">{p.name}:</span>
            <span className="font-bold text-dark dark:text-white">{Number(p.value || 0).toLocaleString("ru-RU")}</span>
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
    <div className={`relative bg-white dark:bg-dark-light rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow ${className}`}>
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

function DonutCenter({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <span className="text-2xl font-bold text-dark dark:text-white">{value}</span>
      <span className="text-[10px] text-neutral dark:text-white/40 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  accentColor,
  bgClass,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accentColor: string;
  bgClass: string;
}) {
  return (
    <div className="relative bg-white dark:bg-dark-light rounded-2xl p-5 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-[0.06]" style={{ background: accentColor, transform: "translate(30%, -30%)" }} />
      <div className={`w-9 h-9 ${bgClass} rounded-xl flex items-center justify-center mb-3`} style={{ color: accentColor }}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-dark dark:text-white leading-tight">{value}</div>
      <div className="text-xs text-neutral dark:text-white/50 mt-1">{label}</div>
      {sub && <div className="text-xs text-green-500 mt-0.5">{sub}</div>}
    </div>
  );
}

// --- Main Page ---

export default function AdminAnalyticsPage() {
  const { password } = useAdminAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetchAnalytics = useCallback(async (period: number) => {
    setLoading(true);
    try {
      const headers = { "x-admin-password": password };
      const [analyticsRes, userStatsRes] = await Promise.all([
        fetch(`/api/admin/analytics?days=${period}`, { headers }),
        fetch("/api/admin/users/stats", { headers }),
      ]);
      if (analyticsRes.ok) setData(await analyticsRes.json());
      if (userStatsRes.ok) setUserStats(await userStatsRes.json());
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => {
    fetchAnalytics(days);
  }, [fetchAnalytics, days]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-white/10 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={`skel-kpi-${i}`} className="h-28 bg-gray-200 dark:bg-white/10 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={`skel-chart-${i}`} className="h-72 bg-gray-200 dark:bg-white/10 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-neutral dark:text-white/50">
        Не удалось загрузить аналитику
      </div>
    );
  }

  const pieData = Object.entries(data.requestsByStatus).map(([status, count]) => ({
    name: statusNames[status] || status,
    value: count,
  }));

  const comboTimeline = data.viewsTimeline.map((v) => {
    const req = data.requestsTimeline.find((r) => r.date === v.date);
    return { date: v.date, views: v.views, requests: req?.requests || 0 };
  });

  const formatDate = (d: string) => {
    const parts = d.split("-");
    return `${parts[2]}.${parts[1]}`;
  };

  const totalRequestsByStatus = pieData.reduce((s, e) => s + e.value, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Аналитика</h1>
          <p className="text-sm text-neutral dark:text-white/60 mt-1">
            Сводная статистика за последние {days} дней
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-gray-100 dark:bg-white/5 p-0.5">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  days === opt.value
                    ? "bg-white dark:bg-dark-light text-dark dark:text-white shadow-sm"
                    : "text-neutral dark:text-white/50 hover:text-dark dark:hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => window.print()}
            className="print:hidden p-2.5 rounded-xl bg-white dark:bg-dark-light text-neutral dark:text-white/60 border border-gray-200 dark:border-white/10 hover:bg-gray-50 transition-colors"
            title="Экспорт PDF"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Просмотры"
          value={data.totalViews.toLocaleString("ru-RU")}
          accentColor={COLORS.blue}
          bgClass="bg-blue-50 dark:bg-blue-500/10"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        />
        <StatCard
          label="Заявки"
          value={data.totalRequests.toLocaleString("ru-RU")}
          accentColor={COLORS.green}
          bgClass="bg-green-50 dark:bg-green-500/10"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          label="Конверсия"
          value={`${data.conversionRate}%`}
          accentColor={COLORS.primary}
          bgClass="bg-orange-50 dark:bg-orange-500/10"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        <StatCard
          label="Пользователи"
          value={data.totalUsers.toLocaleString("ru-RU")}
          sub={`+${data.newUsers} новых`}
          accentColor={COLORS.pink}
          bgClass="bg-pink-50 dark:bg-pink-500/10"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
      </div>

      {/* Row 1: Views+Requests combo + Status donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Просмотры и заявки"
          subtitle={`Динамика за ${days} дней`}
          accentColor={COLORS.blue}
          icon={
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        >
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={comboTimeline} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.blue} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={COLORS.blue} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradRequests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} labelFormatter={(l) => formatDate(l as string)} />
              <Area type="monotone" dataKey="views" stroke={COLORS.blue} strokeWidth={2.5} fill="url(#gradViews)" name="Просмотры" dot={false} activeDot={{ r: 4, stroke: COLORS.blue, strokeWidth: 2, fill: "#fff" }} />
              <Area type="monotone" dataKey="requests" stroke={COLORS.primary} strokeWidth={2.5} fill="url(#gradRequests)" name="Заявки" dot={false} activeDot={{ r: 4, stroke: COLORS.primary, strokeWidth: 2, fill: "#fff" }} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-5 mt-3 justify-center">
            <div className="flex items-center gap-1.5 text-xs text-neutral dark:text-white/50">
              <span className="w-3 h-0.5 rounded-full" style={{ background: COLORS.blue }} />
              Просмотры
            </div>
            <div className="flex items-center gap-1.5 text-xs text-neutral dark:text-white/50">
              <span className="w-3 h-0.5 rounded-full" style={{ background: COLORS.primary }} />
              Заявки
            </div>
          </div>
        </ChartCard>

        <ChartCard
          title="Заявки по статусу"
          subtitle="Текущее распределение"
          accentColor={COLORS.green}
          icon={
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          }
        >
          {pieData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-neutral dark:text-white/40">Нет данных</div>
          ) : (
            <div className="flex items-center">
              <div className="relative w-1/2">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" strokeWidth={0}>
                      {pieData.map((_, i) => (
                        <Cell key={`status-${i}`} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <DonutCenter value={totalRequestsByStatus} label="всего" />
              </div>
              <div className="flex-1 space-y-3 pl-4">
                {pieData.map((item, i) => {
                  const pct = totalRequestsByStatus > 0 ? Math.round((item.value / totalRequestsByStatus) * 100) : 0;
                  return (
                    <div key={item.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: STATUS_COLORS[i % STATUS_COLORS.length] }} />
                          <span className="text-xs font-medium text-dark dark:text-white">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-neutral dark:text-white/40">{pct}%</span>
                          <span className="text-xs font-bold text-dark dark:text-white">{item.value}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: STATUS_COLORS[i % STATUS_COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Row 2: Top pages + User registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Популярные страницы"
          subtitle={`Топ-${data.topPages.length} за период`}
          accentColor={COLORS.primary}
          icon={
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        >
          {data.topPages.length > 0 ? (
            <div className="space-y-3">
              {(() => {
                const maxCount = Math.max(...data.topPages.map((p) => p.count));
                return data.topPages.map((page, idx) => (
                  <div key={page.url}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2 min-w-0 mr-3">
                        <span className="text-[10px] text-neutral/40 dark:text-white/20 font-mono w-4 shrink-0 text-right">{idx + 1}</span>
                        <span className="text-xs font-medium text-dark dark:text-white truncate">{pageNames[page.url] || page.url}</span>
                      </div>
                      <span className="text-xs font-bold text-dark dark:text-white shrink-0">{page.count.toLocaleString("ru-RU")}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden ml-6">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${maxCount > 0 ? (page.count / maxCount) * 100 : 0}%`,
                          background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.primary}80)`,
                        }}
                      />
                    </div>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center text-sm text-neutral dark:text-white/40">Нет данных</div>
          )}
        </ChartCard>

        {userStats && (
          <ChartCard
            title="Регистрации пользователей"
            subtitle="По месяцам"
            accentColor={COLORS.indigo}
            icon={
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            }
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={userStats.registrationsByMonth} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="25%">
                <defs>
                  <linearGradient id="gradIndigo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.indigo} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={COLORS.indigo} stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="url(#gradIndigo)" radius={[6, 6, 2, 2]} name="Регистрации" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Row 3: User summary cards + Top users table */}
      {userStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User breakdown */}
          <ChartCard
            title="Пользователи"
            subtitle="Сводка по статусам"
            accentColor={COLORS.pink}
            icon={
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          >
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: userStats.totalUsers, label: "Всего", color: COLORS.indigo, bg: "bg-indigo-50 dark:bg-indigo-900/10" },
                { value: userStats.activeUsers, label: "Активные", color: COLORS.green, bg: "bg-green-50 dark:bg-green-900/10" },
                { value: userStats.bannedUsers, label: "Заблокированы", color: COLORS.red, bg: "bg-red-50 dark:bg-red-900/10" },
              ].map((item) => (
                <div key={item.label} className={`relative ${item.bg} rounded-xl p-4 overflow-hidden text-center`}>
                  <div className="absolute top-0 right-0 w-12 h-12 rounded-full opacity-[0.07]" style={{ background: item.color, transform: "translate(30%, -30%)" }} />
                  <p className="text-2xl font-bold mb-0.5" style={{ color: item.color }}>{item.value}</p>
                  <p className="text-[10px] text-neutral dark:text-white/40 font-medium uppercase tracking-wider">{item.label}</p>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Top users */}
          {userStats.topUsers.length > 0 && (
            <ChartCard
              title="Топ пользователей"
              subtitle="По количеству заявок"
              accentColor={COLORS.purple}
              icon={
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              }
            >
              <div className="space-y-2.5">
                {userStats.topUsers.map((user, idx) => (
                  <div key={user.id} className="flex items-center gap-3 py-1.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      idx === 0 ? "bg-amber-100 dark:bg-amber-900/20 text-amber-600" :
                      idx === 1 ? "bg-gray-100 dark:bg-white/10 text-gray-500" :
                      idx === 2 ? "bg-orange-100 dark:bg-orange-900/20 text-orange-600" :
                      "bg-gray-50 dark:bg-white/5 text-gray-400"
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark dark:text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-neutral dark:text-white/40 truncate">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-center">
                        <p className="text-sm font-bold text-dark dark:text-white">{user.requests}</p>
                        <p className="text-[9px] text-neutral dark:text-white/30 uppercase">заявки</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-dark dark:text-white">{user.equipment}</p>
                        <p className="text-[9px] text-neutral dark:text-white/30 uppercase">приборы</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          )}
        </div>
      )}
    </div>
  );
}
