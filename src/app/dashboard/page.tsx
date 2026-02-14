"use client";

import Modal from "@/components/Modal";
import Link from "next/link";
import { useEffect, useState } from "react";

interface DashboardStats {
  totalEquipment: number;
  upcomingVerifications: number;
  activeRequests: number;
  overdueItems: number;
}

interface UpcomingItem {
  id: number;
  name: string;
  type: string | null;
  nextVerification: string;
  status: string;
}

interface RecentRequest {
  id: number;
  service: string;
  status: string;
  createdAt: string;
}

interface UserInfo {
  name: string;
  company: string | null;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  new: { label: "Новая", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  in_progress: { label: "В работе", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  done: { label: "Выполнена", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
};

const equipmentStatusLabels: Record<string, { label: string; color: string }> = {
  active: { label: "Активно", color: "bg-green-100 text-green-800" },
  pending: { label: "Скоро поверка", color: "bg-yellow-100 text-yellow-800" },
  expired: { label: "Просрочено", color: "bg-red-100 text-red-800" },
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ totalEquipment: 0, upcomingVerifications: 0, activeRequests: 0, overdueItems: 0 });
  const [upcoming, setUpcoming] = useState<UpcomingItem[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [equipRes, reqRes, meRes] = await Promise.all([
          fetch("/api/equipment?limit=100"),
          fetch("/api/user/requests"),
          fetch("/api/auth/me"),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          setUser(meData.user);
        }

        if (equipRes.ok) {
          const equipData = await equipRes.json();
          const equipment = equipData.equipment || [];
          const now = new Date();
          const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

          const overdue = equipment.filter((e: UpcomingItem) =>
            e.nextVerification && new Date(e.nextVerification) < now
          );
          const upcomingItems = equipment
            .filter((e: UpcomingItem) => {
              if (!e.nextVerification) return false;
              const d = new Date(e.nextVerification);
              return d >= now && d <= in30Days;
            })
            .sort((a: UpcomingItem, b: UpcomingItem) =>
              new Date(a.nextVerification).getTime() - new Date(b.nextVerification).getTime()
            )
            .slice(0, 5);

          setStats((prev) => ({
            ...prev,
            totalEquipment: equipment.length,
            upcomingVerifications: upcomingItems.length,
            overdueItems: overdue.length,
          }));
          setUpcoming(upcomingItems);
        }

        if (reqRes.ok) {
          const reqData = await reqRes.json();
          const requests = reqData.requests || [];
          const active = requests.filter((r: RecentRequest) => r.status !== "done");
          setStats((prev) => ({ ...prev, activeRequests: active.length }));
          setRecentRequests(requests.slice(0, 5));
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const statsCards = [
    {
      label: "Всего оборудования",
      value: stats.totalEquipment,
      icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      iconBg: "bg-blue-200 text-blue-600",
      href: "/dashboard/equipment/si",
    },
    {
      label: "Поверки (30 дней)",
      value: stats.upcomingVerifications,
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      iconBg: "bg-yellow-200 text-yellow-600",
      href: "/dashboard/schedule/si",
    },
    {
      label: "Активные заявки",
      value: stats.activeRequests,
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      bg: "bg-green-50 dark:bg-green-900/20",
      iconBg: "bg-green-200 text-green-600",
      href: "/dashboard/requests",
    },
    {
      label: "Просрочено",
      value: stats.overdueItems,
      icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z",
      bg: stats.overdueItems > 0 ? "bg-red-50 dark:bg-red-900/20" : "bg-gray-50 dark:bg-gray-900/20",
      iconBg: stats.overdueItems > 0 ? "bg-red-200 text-red-600" : "bg-gray-200 text-gray-600",
      href: "/dashboard/equipment/si",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const today = new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-dark dark:text-white">
          Добро пожаловать{user ? `, ${user.name}` : ""}!
        </h1>
        <p className="text-sm text-neutral dark:text-white/50 mt-1 capitalize">{today}</p>
      </div>

      {/* Overdue alert */}
      {stats.overdueItems > 0 && (
        <Link
          href="/dashboard/equipment/si"
          className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
        >
          <div className="w-10 h-10 bg-red-200 text-red-600 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">
              {stats.overdueItems} ед. оборудования с просроченной поверкой
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">
              Нажмите, чтобы просмотреть и оформить заявку
            </p>
          </div>
        </Link>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`${card.bg} rounded-2xl p-4 transition-shadow hover:shadow-md`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                </svg>
              </div>
              <div>
                <div className="text-3xl font-bold text-dark dark:text-white">{card.value}</div>
                <div className="text-xs text-neutral dark:text-white/60">{card.label}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Verifications */}
        <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-dark dark:text-white">Ближайшие поверки</h2>
            <Link href="/dashboard/schedule/si" className="text-sm text-primary hover:underline">
              Все
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-neutral dark:text-white/50 py-4 text-center">
              Нет предстоящих поверок
            </p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-dark dark:text-white truncate">{item.name}</div>
                    <div className="text-xs text-neutral dark:text-white/50">{item.type || "—"}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm text-dark dark:text-white">
                      {new Date(item.nextVerification).toLocaleDateString("ru-RU")}
                    </div>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${equipmentStatusLabels[item.status]?.color || "bg-gray-100 text-gray-600"}`}>
                      {equipmentStatusLabels[item.status]?.label || item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Requests */}
        <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-dark dark:text-white">Последние заявки</h2>
            <Link href="/dashboard/requests" className="text-sm text-primary hover:underline">
              Все
            </Link>
          </div>
          {recentRequests.length === 0 ? (
            <p className="text-sm text-neutral dark:text-white/50 py-4 text-center">
              Нет заявок
            </p>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-dark dark:text-white truncate">{req.service}</div>
                    <div className="text-xs text-neutral dark:text-white/50">
                      #{req.id} &middot; {new Date(req.createdAt).toLocaleDateString("ru-RU")}
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusLabels[req.status]?.color || statusLabels.new.color}`}>
                    {statusLabels[req.status]?.label || "Новая"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-dark dark:text-white mb-4">Быстрые действия</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/dashboard/equipment/si"
            className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:border-gray-300 hover:bg-gray-50 dark:hover:border-white/20 dark:hover:bg-white/5 transition-colors"
          >
            <svg className="w-5 h-5 shrink-0 text-gray-400 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm text-neutral dark:text-white/70">Добавить оборудование</span>
          </Link>
          <Link
            href="/dashboard/requests"
            className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:border-gray-300 hover:bg-gray-50 dark:hover:border-white/20 dark:hover:bg-white/5 transition-colors"
          >
            <svg className="w-5 h-5 shrink-0 text-gray-400 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm text-neutral dark:text-white/70">Мои заявки</span>
          </Link>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:border-gray-300 hover:bg-gray-50 dark:hover:border-white/20 dark:hover:bg-white/5 transition-colors text-left"
          >
            <svg className="w-5 h-5 shrink-0 text-gray-400 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" />
            </svg>
            <span className="text-sm text-neutral dark:text-white/70">Подать заявку</span>
          </button>
          <Link
            href="/dashboard/equipment/si"
            className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:border-gray-300 hover:bg-gray-50 dark:hover:border-white/20 dark:hover:bg-white/5 transition-colors"
          >
            <svg className="w-5 h-5 shrink-0 text-gray-400 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-sm text-neutral dark:text-white/70">Импорт из Excel</span>
          </Link>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialValues={user ? { name: user.name } : undefined}
      />
    </div>
  );
}
