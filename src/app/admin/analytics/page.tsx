"use client";

import { useAdminAuth } from "@/lib/AdminAuthContext";
import { useCallback, useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type PieLabelRenderProps,
} from "recharts";

interface AnalyticsData {
  viewsTimeline: { date: string; views: number }[];
  topPages: { url: string; count: number }[];
  requestsTimeline: { date: string; requests: number }[];
  requestsByStatus: Record<string, number>;
  revenueTimeline: { month: string; revenue: number }[];
  totalRevenue: number;
  totalViews: number;
  totalRequests: number;
  totalUsers: number;
  newUsers: number;
  conversionRate: string;
}

const PIE_COLORS = ["#3b82f6", "#f59e0b", "#10b981"];
const statusNames: Record<string, string> = {
  new: "Новые",
  in_progress: "В работе",
  done: "Завершены",
};

export default function AdminAnalyticsPage() {
  const { password } = useAdminAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/analytics?days=30", {
        headers: { "x-admin-password": password },
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // Analytics are non-critical
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-neutral">
        Не удалось загрузить аналитику
      </div>
    );
  }

  const pieData = Object.entries(data.requestsByStatus).map(([status, count]) => ({
    name: statusNames[status] || status,
    value: count,
  }));

  const formatDate = (d: string) => {
    const parts = d.split("-");
    return `${parts[2]}.${parts[1]}`;
  };

  const formatMonth = (m: string) => {
    const months = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
    const [, month] = m.split("-");
    return months[parseInt(month) - 1] || m;
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-dark">Аналитика</h1>
          <p className="text-xs text-neutral">Последние 30 дней</p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Просмотры", value: data.totalViews, color: "bg-blue-50" },
          { label: "Заявки", value: data.totalRequests, color: "bg-green-50" },
          { label: "Конверсия", value: `${data.conversionRate}%`, color: "bg-yellow-50" },
          { label: "Выручка", value: `${data.totalRevenue.toLocaleString("ru-RU")} ₽`, color: "bg-purple-50" },
          { label: "Пользователи", value: `${data.newUsers} / ${data.totalUsers}`, color: "bg-pink-50" },
        ].map((card) => (
          <div key={card.label} className={`${card.color} rounded-xl p-4`}>
            <div className="text-xs text-neutral mb-1">{card.label}</div>
            <div className="text-lg font-bold text-dark">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Requests per day */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-dark mb-3">Заявки по дням</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.requestsTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={(l) => `Дата: ${l}`} />
                <Line type="monotone" dataKey="requests" stroke="#e8733a" strokeWidth={2} dot={false} name="Заявки" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status pie */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-dark mb-3">Заявки по статусу</h3>
          <div className="h-48 flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(props: PieLabelRenderProps) => `${props.name || ""} ${((Number(props.percent) || 0) * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-neutral text-sm">Нет данных</div>
            )}
          </div>
        </div>

        {/* Revenue by month */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-dark mb-3">Выручка по месяцам</h3>
          <div className="h-48">
            {data.revenueTimeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.revenueTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={(l) => `Месяц: ${l}`} formatter={(val) => [`${Number(val).toLocaleString("ru-RU")} ₽`, "Выручка"]} />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Выручка" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-neutral text-sm">Нет данных</div>
            )}
          </div>
        </div>

        {/* Top pages */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-dark mb-3">Популярные страницы</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {data.topPages.length > 0 ? (
              data.topPages.map((page) => (
                <div key={page.url} className="flex items-center justify-between text-sm">
                  <span className="text-neutral truncate mr-3">{page.url}</span>
                  <span className="font-medium text-dark shrink-0">{page.count}</span>
                </div>
              ))
            ) : (
              <div className="text-neutral text-sm text-center py-4">Нет данных</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
