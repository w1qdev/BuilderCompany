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
  Legend,
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

const PIE_COLORS = ["#3b82f6", "#f59e0b", "#10b981"];
const statusNames: Record<string, string> = {
  new: "Новые",
  in_progress: "В работе",
  done: "Завершены",
};

const PERIOD_OPTIONS = [
  { label: "7 дней", value: 7 },
  { label: "14 дней", value: 14 },
  { label: "30 дней", value: 30 },
  { label: "90 дней", value: 90 },
];

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
      // Analytics are non-critical
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => {
    fetchAnalytics(days);
  }, [fetchAnalytics, days]);

  const handlePeriodChange = (period: number) => {
    setDays(period);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
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

  // Merge views + requests timelines for combo chart
  const comboTimeline = data.viewsTimeline.map((v) => {
    const req = data.requestsTimeline.find((r) => r.date === v.date);
    return {
      date: v.date,
      views: v.views,
      requests: req?.requests || 0,
    };
  });

  const formatDate = (d: string) => {
    const parts = d.split("-");
    return `${parts[2]}.${parts[1]}`;
  };

  const kpiCards = [
    {
      label: "Просмотры",
      value: data.totalViews.toLocaleString("ru-RU"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-500/10",
    },
    {
      label: "Заявки",
      value: data.totalRequests.toLocaleString("ru-RU"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-500/10",
    },
    {
      label: "Конверсия",
      value: `${data.conversionRate}%`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: "text-yellow-500",
      bg: "bg-yellow-50 dark:bg-yellow-500/10",
    },
    {
      label: "Пользователи",
      value: data.totalUsers.toLocaleString("ru-RU"),
      subtitle: `+${data.newUsers} новых`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: "text-pink-500",
      bg: "bg-pink-50 dark:bg-pink-500/10",
    },
  ];

  return (
    <div>
      {/* Header with period selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-dark dark:text-white">Аналитика</h1>
            <p className="text-xs text-neutral dark:text-white/50">Последние {days} дней</p>
          </div>
        </div>

        <div className="flex bg-white dark:bg-dark-light rounded-xl p-1 shadow-sm">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handlePeriodChange(opt.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                days === opt.value
                  ? "bg-primary text-white shadow-sm"
                  : "text-neutral dark:text-white/60 hover:text-dark dark:hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards — single responsive row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-dark-light rounded-2xl p-4 shadow-sm"
          >
            <div className={`w-9 h-9 ${card.bg} rounded-lg flex items-center justify-center ${card.color} mb-3`}>
              {card.icon}
            </div>
            <div className="text-2xl font-bold text-dark dark:text-white leading-tight">
              {card.value}
            </div>
            <div className="text-xs text-neutral dark:text-white/50 mt-1">{card.label}</div>
            {card.subtitle && (
              <div className="text-xs text-green-500 mt-0.5">{card.subtitle}</div>
            )}
          </div>
        ))}
      </div>

      {/* Charts row: Views+Requests combo (60%) + Status pie (40%) */}
      <div className="grid lg:grid-cols-5 gap-4 mb-6">
        {/* Combo chart — Views + Requests */}
        <div className="lg:col-span-3 bg-white dark:bg-dark-light rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-dark dark:text-white mb-4">Просмотры и заявки</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={comboTimeline}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e8733a" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#e8733a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  labelFormatter={(l) => formatDate(l as string)}
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    fontSize: "13px",
                  }}
                  formatter={(value, name) => [
                    Number(value || 0).toLocaleString("ru-RU"),
                    name === "views" ? "Просмотры" : "Заявки",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorViews)"
                  name="views"
                />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="#e8733a"
                  strokeWidth={2}
                  fill="url(#colorRequests)"
                  name="requests"
                />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs text-neutral dark:text-white/60">
                      {value === "views" ? "Просмотры" : "Заявки"}
                    </span>
                  )}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status pie chart */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-light rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-dark dark:text-white mb-4">Заявки по статусу</h3>
          <div className="h-52 flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255,255,255,0.95)",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                      fontSize: "13px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-neutral dark:text-white/50 text-sm">Нет данных</div>
            )}
          </div>
          {/* Legend */}
          {pieData.length > 0 && (
            <div className="space-y-2 mt-4">
              {pieData.map((entry, i) => {
                const total = pieData.reduce((s, e) => s + e.value, 0);
                const pct = total > 0 ? ((entry.value / total) * 100).toFixed(0) : "0";
                return (
                  <div key={entry.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-neutral dark:text-white/60">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-dark dark:text-white">{entry.value}</span>
                      <span className="text-neutral-light dark:text-white/40 text-xs">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top pages */}
      <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-5 mb-6">
        <h3 className="text-sm font-semibold text-dark dark:text-white mb-4">Популярные страницы</h3>
        <div className="space-y-3">
          {data.topPages.length > 0 ? (
            (() => {
              const maxCount = Math.max(...data.topPages.map((p) => p.count));
              return data.topPages.map((page, idx) => (
                <div key={page.url}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2 min-w-0 mr-3">
                      <span className="text-xs text-neutral-light dark:text-white/30 font-mono w-5 shrink-0 text-right">
                        {idx + 1}
                      </span>
                      <span className="text-neutral dark:text-white/70 truncate">{pageNames[page.url] || page.url}</span>
                    </div>
                    <span className="font-semibold text-dark dark:text-white shrink-0">
                      {page.count.toLocaleString("ru-RU")}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden ml-7">
                    <div
                      className="h-full bg-primary/50 dark:bg-primary/40 rounded-full transition-all"
                      style={{ width: `${maxCount > 0 ? (page.count / maxCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ));
            })()
          ) : (
            <div className="text-neutral dark:text-white/50 text-sm text-center py-4">Нет данных</div>
          )}
        </div>
      </div>

      {/* User metrics section */}
      {userStats && (
        <>
          <h2 className="text-lg font-bold text-dark dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Пользователи
          </h2>

          <div className="grid lg:grid-cols-5 gap-4 mb-6">
            {/* Registration trend */}
            <div className="lg:col-span-3 bg-white dark:bg-dark-light rounded-2xl shadow-sm p-5">
              <h3 className="text-sm font-semibold text-dark dark:text-white mb-4">Регистрации по месяцам</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userStats.registrationsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.95)",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                        fontSize: "13px",
                      }}
                      formatter={(value) => [Number(value || 0), "Регистрации"]}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* User summary */}
            <div className="lg:col-span-2 bg-white dark:bg-dark-light rounded-2xl shadow-sm p-5">
              <h3 className="text-sm font-semibold text-dark dark:text-white mb-4">Сводка</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral dark:text-white/60">Всего пользователей</span>
                  <span className="text-lg font-bold text-dark dark:text-white">{userStats.totalUsers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral dark:text-white/60">Активные</span>
                  <span className="text-lg font-bold text-green-500">{userStats.activeUsers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral dark:text-white/60">Заблокированные</span>
                  <span className="text-lg font-bold text-red-500">{userStats.bannedUsers}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top users table */}
          {userStats.topUsers.length > 0 && (
            <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-5">
              <h3 className="text-sm font-semibold text-dark dark:text-white mb-4">Топ пользователей</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/10">
                      <th className="text-left py-2 pr-4 text-xs font-semibold text-neutral dark:text-white/50 uppercase tracking-wider">#</th>
                      <th className="text-left py-2 pr-4 text-xs font-semibold text-neutral dark:text-white/50 uppercase tracking-wider">Имя</th>
                      <th className="text-left py-2 pr-4 text-xs font-semibold text-neutral dark:text-white/50 uppercase tracking-wider">Email</th>
                      <th className="text-center py-2 pr-4 text-xs font-semibold text-neutral dark:text-white/50 uppercase tracking-wider">Заявки</th>
                      <th className="text-center py-2 text-xs font-semibold text-neutral dark:text-white/50 uppercase tracking-wider">Оборудование</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userStats.topUsers.map((user, idx) => (
                      <tr key={user.id} className="border-b border-gray-50 dark:border-white/5 last:border-0">
                        <td className="py-2.5 pr-4 text-neutral-light dark:text-white/30 font-mono text-xs">{idx + 1}</td>
                        <td className="py-2.5 pr-4 font-medium text-dark dark:text-white">{user.name}</td>
                        <td className="py-2.5 pr-4 text-neutral dark:text-white/60">{user.email}</td>
                        <td className="py-2.5 pr-4 text-center font-semibold text-dark dark:text-white">{user.requests}</td>
                        <td className="py-2.5 text-center font-semibold text-dark dark:text-white">{user.equipment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
