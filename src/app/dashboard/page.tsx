"use client";

import Modal from "@/components/Modal";
import OnboardingStepper from "@/components/OnboardingStepper";
import MiniCalendar from "@/components/dashboard/MiniCalendar";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeletons";
import Link from "next/link";
import { useState } from "react";
import { statusConfig } from "@/lib/equipmentStatus";
import { useDashboardStats, useUserInfo, useCalendarEquipment } from "@/lib/hooks/useDashboard";

interface DashboardStats {
  totalEquipment: number;
  upcomingVerifications: number;
  activeRequests: number;
  overdueItems: number;
  activeCount: number;
  pendingCount: number;
  expiredCount: number;
}

interface RequestCounts {
  new: number;
  in_progress: number;
  done: number;
  total: number;
}

interface EquipmentItem {
  id: number;
  name: string;
  type: string | null;
  nextVerification: string;
  status: string;
  category: string;
  pinned?: boolean;
}

interface RecentRequest {
  id: number;
  service: string;
  status: string;
  createdAt: string;
}

interface ActivityItem {
  id: number;
  action: string;
  entityType: string;
  entityId: number | null;
  details: string | null;
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

const equipmentStatusLabels: Record<string, { label: string; color: string }> = statusConfig;

const activityLabels: Record<string, { label: string; icon: string }> = {
  equipment_added: { label: "Добавлено оборудование", icon: "M12 4v16m8-8H4" },
  equipment_updated: { label: "Обновлено оборудование", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
  equipment_deleted: { label: "Удалено оборудование", icon: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" },
  request_created: { label: "Создана заявка", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
};

type WidgetKey = "stats" | "health" | "calendar" | "pinned" | "upcoming" | "requests" | "activity" | "actions" | "weekly";

const WIDGET_LABELS: Record<WidgetKey, string> = {
  stats: "Статистика",
  health: "Здоровье парка",
  calendar: "Календарь поверок",
  pinned: "Закреплённое",
  upcoming: "Ближайшие поверки",
  requests: "Последние заявки",
  activity: "Последние действия",
  actions: "Быстрые действия",
  weekly: "Сводка за неделю",
};

const DEFAULT_WIDGETS: WidgetKey[] = ["stats", "weekly", "health", "calendar", "pinned", "upcoming", "requests", "activity", "actions"];

function getVisibleWidgets(): WidgetKey[] {
  if (typeof window === "undefined") return DEFAULT_WIDGETS;
  try {
    const saved = localStorage.getItem("dashboard_widgets");
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return DEFAULT_WIDGETS;
}

export default function DashboardPage() {
  // SWR-based data fetching with automatic caching and revalidation
  const { data: statsData, isLoading: statsLoading, isValidating: statsValidating, mutate: mutateStats } = useDashboardStats();
  const { data: meData, isLoading: meLoading } = useUserInfo();
  const { data: equipData, isLoading: equipLoading, mutate: mutateEquip } = useCalendarEquipment();

  const loading = statsLoading || meLoading || equipLoading;
  const refreshing = statsValidating && !statsLoading;

  // Derive state from SWR data
  const user: UserInfo | null = meData?.user || null;
  const allEquipment: EquipmentItem[] = equipData?.equipment || [];

  const stats: DashboardStats = statsData ? {
    totalEquipment: statsData.totalEquipment,
    upcomingVerifications: statsData.upcomingItems?.length || 0,
    overdueItems: statsData.overdueItems,
    activeRequests: (statsData.requestCounts?.new || 0) + (statsData.requestCounts?.in_progress || 0),
    activeCount: statsData.activeCount,
    pendingCount: statsData.pendingCount,
    expiredCount: statsData.expiredCount,
  } : { totalEquipment: 0, upcomingVerifications: 0, activeRequests: 0, overdueItems: 0, activeCount: 0, pendingCount: 0, expiredCount: 0 };

  const upcoming: EquipmentItem[] = statsData?.upcomingItems || [];
  const pinnedEquipment: EquipmentItem[] = statsData?.pinnedItems || [];
  const requestCounts: RequestCounts = statsData?.requestCounts || { new: 0, in_progress: 0, done: 0, total: 0 };
  const recentRequests: RecentRequest[] = statsData?.recentRequests || [];
  const activities: ActivityItem[] = statsData?.activities || [];
  const weeklySummary = statsData?.weeklySummary || { equipmentAdded: 0, requestsCreated: 0, verified: 0 };

  const [modalOpen, setModalOpen] = useState(false);
  const [visibleWidgets, setVisibleWidgets] = useState<WidgetKey[]>(getVisibleWidgets);
  const [widgetSettingsOpen, setWidgetSettingsOpen] = useState(false);
  const [overdueHidden, setOverdueHidden] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("overdue_alert_hidden") === "true";
    }
    return false;
  });

  const isWidgetVisible = (key: WidgetKey) => visibleWidgets.includes(key);

  const toggleWidget = (key: WidgetKey) => {
    setVisibleWidgets((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      localStorage.setItem("dashboard_widgets", JSON.stringify(next));
      return next;
    });
  };

  const handleRefresh = () => {
    mutateStats();
    mutateEquip();
  };

  const today = new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Доброе утро";
    if (hour >= 12 && hour < 17) return "Добрый день";
    if (hour >= 17 && hour < 22) return "Добрый вечер";
    return "Доброй ночи";
  };

  const getEquipmentLink = (item: EquipmentItem) => {
    const isIO = item.category === "attestation";
    return `${isIO ? "/dashboard/equipment/io" : "/dashboard/equipment/si"}?id=${item.id}`;
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const statsCards = [
    {
      label: "Всего оборудования",
      value: stats.totalEquipment,
      icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      iconBg: "bg-blue-200 text-blue-600",
      href: "/dashboard/equipment/si",
      pulse: false,
    },
    {
      label: "Поверки (30 дней)",
      value: stats.upcomingVerifications,
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      iconBg: "bg-yellow-200 text-yellow-600",
      href: "/dashboard/schedule/si",
      pulse: false,
    },
    {
      label: "Активные заявки",
      value: stats.activeRequests,
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      bg: "bg-green-50 dark:bg-green-900/20",
      iconBg: "bg-green-200 text-green-600",
      href: "/dashboard/requests",
      pulse: false,
    },
    {
      label: "Просрочено",
      value: stats.overdueItems,
      icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z",
      bg: stats.overdueItems > 0 ? "bg-red-50 dark:bg-red-900/20" : "bg-gray-50 dark:bg-gray-900/20",
      iconBg: stats.overdueItems > 0 ? "bg-red-200 text-red-600" : "bg-gray-200 text-gray-600",
      href: "/dashboard/equipment/si",
      pulse: stats.overdueItems > 0,
    },
  ];

  const healthTotal = stats.activeCount + stats.pendingCount + stats.expiredCount;

  return (
    <div className="space-y-6">
      {/* Greeting + Refresh + Widget Settings */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">
            {getGreeting()}{user ? `, ${user.name}` : ""}!
          </h1>
          <p className="text-sm text-neutral dark:text-white/50 mt-1 capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Widget settings */}
          <div className="relative">
            <button
              onClick={() => setWidgetSettingsOpen(!widgetSettingsOpen)}
              className="p-2 rounded-xl text-neutral dark:text-white/60 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              title="Настроить виджеты"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            {widgetSettingsOpen && (
              <>
                <div className="fixed inset-0 z-10" role="button" tabIndex={-1} onClick={() => setWidgetSettingsOpen(false)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setWidgetSettingsOpen(false); } }} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-dark-light border border-gray-200 dark:border-white/10 rounded-xl shadow-lg py-2 w-56">
                  <p className="px-3 py-1.5 text-xs font-semibold text-neutral dark:text-white/40 uppercase">Виджеты</p>
                  {(Object.keys(WIDGET_LABELS) as WidgetKey[]).map((key) => (
                    <label key={key} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleWidgets.includes(key)}
                        onChange={() => toggleWidget(key)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-dark dark:text-white">{WIDGET_LABELS[key]}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => handleRefresh()}
            disabled={refreshing}
            className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-neutral dark:text-white/60 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
            title="Обновить данные"
          >
            <svg className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">{refreshing ? "Обновляется..." : "Обновить"}</span>
          </button>
        </div>
      </div>

      {/* Overdue alert */}
      {stats.overdueItems > 0 && !overdueHidden && (
        <div className="relative flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-2xl">
          <Link
            href="/dashboard/equipment/si"
            className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 bg-red-200 text-red-600 rounded-xl flex items-center justify-center shrink-0 animate-pulse">
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
          <button
            onClick={() => {
              setOverdueHidden(true);
              sessionStorage.setItem("overdue_alert_hidden", "true");
            }}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-800/30 transition-colors"
            aria-label="Скрыть уведомление"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Nearest verification countdown widget */}
      {upcoming.length > 0 && (() => {
        const nearest = upcoming[0];
        const daysLeft = Math.ceil(
          (new Date(nearest.nextVerification).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        const urgency = daysLeft <= 3 ? "red" : daysLeft <= 7 ? "yellow" : "blue";
        const colors = {
          red: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30",
          yellow: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/30",
          blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30",
        };
        const iconColors = { red: "text-red-500", yellow: "text-yellow-500", blue: "text-blue-500" };
        const textColors = {
          red: "text-red-700 dark:text-red-300",
          yellow: "text-yellow-700 dark:text-yellow-300",
          blue: "text-blue-700 dark:text-blue-300",
        };
        return (
          <Link
            href={getEquipmentLink(nearest)}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-opacity hover:opacity-90 ${colors[urgency]}`}
          >
            <div className={`text-center shrink-0 w-14 ${iconColors[urgency]}`}>
              <div className="text-3xl font-extrabold leading-none">{daysLeft}</div>
              <div className="text-xs font-medium">
                {daysLeft === 1 ? "день" : daysLeft < 5 ? "дня" : "дней"}
              </div>
            </div>
            <div className="w-px h-10 bg-current opacity-20 shrink-0" />
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${textColors[urgency]}`}>
                Ближайшая поверка — {nearest.name}
              </p>
              <p className={`text-xs mt-0.5 opacity-70 ${textColors[urgency]}`}>
                {new Date(nearest.nextVerification).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                {nearest.type ? ` · ${nearest.type}` : ""}
              </p>
            </div>
            <svg className={`w-5 h-5 ml-auto shrink-0 opacity-50 ${iconColors[urgency]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        );
      })()}

      {/* Stats Cards */}
      {isWidgetVisible("stats") && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className={`relative ${card.bg} rounded-2xl p-4 transition-shadow hover:shadow-md`}
            >
              {card.pulse && (
                <span className="absolute top-2 right-2 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
              )}
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
      )}

      {/* Weekly Summary */}
      {isWidgetVisible("weekly") && (
        <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 className="text-sm font-semibold text-dark dark:text-white">Сводка за неделю</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{weeklySummary.equipmentAdded}</div>
              <div className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-0.5">Добавлено</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{weeklySummary.verified}</div>
              <div className="text-xs text-green-600/70 dark:text-green-400/70 mt-0.5">Поверено</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{weeklySummary.requestsCreated}</div>
              <div className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-0.5">Заявок</div>
            </div>
          </div>
        </div>
      )}

      {/* Health Progress Bar */}
      {isWidgetVisible("health") && healthTotal > 0 && (
        <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-dark dark:text-white mb-3">Здоровье парка оборудования</h2>
          <div className="flex rounded-full overflow-hidden h-4 bg-gray-100 dark:bg-white/10">
            {stats.activeCount > 0 && (
              <div
                className="bg-green-500 transition-all relative group"
                style={{ width: `${(stats.activeCount / healthTotal) * 100}%` }}
                title={`Актуальные: ${stats.activeCount}`}
              />
            )}
            {stats.pendingCount > 0 && (
              <div
                className="bg-yellow-400 transition-all"
                style={{ width: `${(stats.pendingCount / healthTotal) * 100}%` }}
                title={`Скоро поверка: ${stats.pendingCount}`}
              />
            )}
            {stats.expiredCount > 0 && (
              <div
                className="bg-red-500 transition-all"
                style={{ width: `${(stats.expiredCount / healthTotal) * 100}%` }}
                title={`Просрочено: ${stats.expiredCount}`}
              />
            )}
          </div>
          <div className="flex gap-4 mt-2 text-xs text-neutral dark:text-white/50">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" />Актуальные: {stats.activeCount} ({healthTotal ? Math.round(stats.activeCount / healthTotal * 100) : 0}%)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />Скоро: {stats.pendingCount} ({healthTotal ? Math.round(stats.pendingCount / healthTotal * 100) : 0}%)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />Просрочено: {stats.expiredCount} ({healthTotal ? Math.round(stats.expiredCount / healthTotal * 100) : 0}%)</span>
          </div>
        </div>
      )}

      {/* Pinned Equipment */}
      {isWidgetVisible("pinned") && pinnedEquipment.length > 0 && (
        <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <h2 className="font-semibold text-dark dark:text-white">Закреплённое оборудование</h2>
          </div>
          <div className="space-y-1">
            {pinnedEquipment.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                href={getEquipmentLink(item)}
                className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 dark:border-white/5 last:border-0 -mx-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-dark dark:text-white truncate">{item.name}</div>
                  <div className="text-xs text-neutral dark:text-white/50">{item.type || "—"}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.nextVerification && (
                    <span className="text-xs text-neutral dark:text-white/50">
                      {new Date(item.nextVerification).toLocaleDateString("ru-RU")}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${equipmentStatusLabels[item.status]?.color || "bg-gray-100 text-gray-600"}`}>
                    {equipmentStatusLabels[item.status]?.label || item.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Calendar + Upcoming + Requests grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calendar widget */}
        {isWidgetVisible("calendar") && stats.totalEquipment > 0 && (
          <MiniCalendar equipment={allEquipment} />
        )}

        {/* Upcoming Verifications */}
        {isWidgetVisible("upcoming") && (
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
              <div className="space-y-1">
                {upcoming.map((item) => (
                  <Link
                    key={item.id}
                    href={getEquipmentLink(item)}
                    className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 dark:border-white/5 last:border-0 -mx-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-dark dark:text-white truncate">{item.name}</div>
                      <div className="text-xs text-neutral dark:text-white/50">{item.type || "—"}</div>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-2">
                      <div>
                        <div className="text-sm text-dark dark:text-white">
                          {new Date(item.nextVerification).toLocaleDateString("ru-RU")}
                        </div>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${equipmentStatusLabels[item.status]?.color || "bg-gray-100 text-gray-600"}`}>
                          {equipmentStatusLabels[item.status]?.label || item.status}
                        </span>
                      </div>
                      <svg className="w-4 h-4 text-gray-300 dark:text-white/20 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recent Requests */}
        {isWidgetVisible("requests") && (
          <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-dark dark:text-white">Последние заявки</h2>
              <Link href="/dashboard/requests" className="text-sm text-primary hover:underline">
                Все
              </Link>
            </div>

            {requestCounts.total > 0 && (
              <div className="mb-4">
                <div className="flex rounded-full overflow-hidden h-2 bg-gray-100 dark:bg-white/10">
                  {requestCounts.new > 0 && (
                    <div className="bg-blue-400" style={{ width: `${(requestCounts.new / requestCounts.total) * 100}%` }} title={`Новые: ${requestCounts.new}`} />
                  )}
                  {requestCounts.in_progress > 0 && (
                    <div className="bg-yellow-400" style={{ width: `${(requestCounts.in_progress / requestCounts.total) * 100}%` }} title={`В работе: ${requestCounts.in_progress}`} />
                  )}
                  {requestCounts.done > 0 && (
                    <div className="bg-green-400" style={{ width: `${(requestCounts.done / requestCounts.total) * 100}%` }} title={`Выполнены: ${requestCounts.done}`} />
                  )}
                </div>
                <div className="flex gap-3 mt-1.5 text-xs text-neutral dark:text-white/40">
                  {requestCounts.new > 0 && <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-blue-400" />Новые: {requestCounts.new}</span>}
                  {requestCounts.in_progress > 0 && <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />В работе: {requestCounts.in_progress}</span>}
                  {requestCounts.done > 0 && <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-green-400" />Выполнены: {requestCounts.done}</span>}
                </div>
              </div>
            )}

            {recentRequests.length === 0 ? (
              <p className="text-sm text-neutral dark:text-white/50 py-4 text-center">Нет заявок</p>
            ) : (
              <div className="space-y-1">
                {recentRequests.map((req) => (
                  <Link
                    key={req.id}
                    href={`/dashboard/requests?expand=${req.id}`}
                    className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-dark dark:text-white truncate">{req.service}</div>
                      <div className="text-xs text-neutral dark:text-white/50">
                        #{req.id} &middot; {new Date(req.createdAt).toLocaleDateString("ru-RU")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusLabels[req.status]?.color || statusLabels.new.color}`}>
                        {statusLabels[req.status]?.label || "Новая"}
                      </span>
                      <svg className="w-4 h-4 text-neutral dark:text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Activity Log */}
        {isWidgetVisible("activity") && activities.length > 0 && (
          <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-6">
            <h2 className="font-semibold text-dark dark:text-white mb-4">Последние действия</h2>
            <div className="space-y-2">
              {activities.map((act) => {
                const config = activityLabels[act.action] || { label: act.action, icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" };
                let detail = "";
                try {
                  if (act.details) {
                    const parsed = JSON.parse(act.details);
                    detail = parsed.name || "";
                  }
                } catch { /* ignore */ }
                return (
                  <div key={act.id} className="flex items-start gap-3 py-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-neutral dark:text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-dark dark:text-white">{config.label}</p>
                      {detail && <p className="text-xs text-neutral dark:text-white/50 truncate">{detail}</p>}
                      <p className="text-xs text-neutral dark:text-white/30 mt-0.5">
                        {new Date(act.createdAt).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Onboarding for new users — hide if stepper is showing */}
      {stats.totalEquipment === 0 && recentRequests.length === 0 && typeof window !== "undefined" && localStorage.getItem("onboarding_completed") === "true" && (
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 border border-primary/20 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-dark dark:text-white mb-1">Начните работу с личным кабинетом</h3>
              <p className="text-sm text-neutral dark:text-white/60 mb-4">
                Добавьте оборудование, чтобы отслеживать сроки поверки и получать уведомления.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard/equipment/si"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Добавить СИ
                </Link>
                <Link
                  href="/dashboard/equipment/io"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-light text-dark dark:text-white border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Добавить ИО
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {isWidgetVisible("actions") && (
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
              href="/dashboard/schedule/si"
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:border-gray-300 hover:bg-gray-50 dark:hover:border-white/20 dark:hover:bg-white/5 transition-colors"
            >
              <svg className="w-5 h-5 shrink-0 text-gray-400 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-neutral dark:text-white/70">График поверок</span>
            </Link>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        showEquipmentCheckbox={true}
        initialValues={user ? { name: user.name } : undefined}
      />

      {/* Onboarding stepper */}
      {!loading && stats.totalEquipment === 0 && (
        <OnboardingStepper userName={user?.name} />
      )}
    </div>
  );
}
