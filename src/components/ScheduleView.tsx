"use client";

import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface Equipment {
  id: number;
  name: string;
  type: string | null;
  serialNumber: string | null;
  registryNumber: string | null;
  nextVerification: string | null;
  category: string;
  status: string;
}

interface MonthGroup {
  key: string;
  label: string;
  items: Equipment[];
  isOverdue?: boolean;
}

const categoryLabels: Record<string, string> = {
  verification: "Поверка",
  calibration: "Калибровка",
  attestation: "Аттестация",
};

const categoryDotColors: Record<string, string> = {
  verification: "bg-blue-500",
  calibration: "bg-purple-500",
  attestation: "bg-amber-500",
};

const categoryBadgeStyles: Record<string, string> = {
  verification: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  calibration: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  attestation: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const categoryBorderStyles: Record<string, string> = {
  verification: "border-l-blue-500 bg-blue-50 dark:bg-blue-900/10",
  calibration: "border-l-purple-500 bg-purple-50 dark:bg-purple-900/10",
  attestation: "border-l-amber-500 bg-amber-50 dark:bg-amber-900/10",
};

const overdueBadge = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
const overdueBorder = "border-l-red-500 bg-red-50 dark:bg-red-900/10";

const monthNames = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

interface ScheduleViewProps {
  title: string;
  categories: string[];
  equipmentLink: string;
  equipmentLinkLabel?: string;
  exportType: "si" | "io";
}

type ViewMode = "list" | "calendar";

export default function ScheduleView({
  title,
  categories,
  equipmentLink,
  equipmentLinkLabel = "Всё оборудование",
  exportType,
}: ScheduleViewProps) {
  const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);
  const [groups, setGroups] = useState<MonthGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportingArshin, setExportingArshin] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setSelectedDay(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleExportWord = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      categories.forEach((c) => params.append("category", c));
      params.set("type", exportType);
      const res = await fetch(`/api/equipment/export-word?${params}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}_${new Date().getFullYear()}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Файл скачан");
    } catch {
      toast.error("Ошибка экспорта");
    } finally {
      setExporting(false);
    }
  };

  const handleExportWordWithArshin = async () => {
    try {
      setExportingArshin(true);
      toast.info("Запрашиваем актуальные даты из Аршин...");

      // First, run Arshin check to update dates in DB
      await fetch("/api/equipment/arshin-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });

      // Then export
      const params = new URLSearchParams();
      categories.forEach((c) => params.append("category", c));
      params.set("type", exportType);
      const res = await fetch(`/api/equipment/export-word?${params}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}_Аршин_${new Date().getFullYear()}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("График с данными Аршин скачан");
    } catch {
      toast.error("Ошибка экспорта");
    } finally {
      setExportingArshin(false);
    }
  };

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const params = new URLSearchParams();
        params.set("limit", "500");
        categories.forEach((c) => params.append("category", c));

        const res = await fetch(`/api/equipment?${params}`);
        if (!res.ok) return;
        const data = await res.json();
        const equipment: Equipment[] = data.equipment || [];

        setAllEquipment(equipment.filter((e) => e.nextVerification));

        const now = new Date();
        const withDates = equipment.filter((e) => e.nextVerification);

        const overdue = withDates.filter((e) => new Date(e.nextVerification!) < now);
        const upcoming = withDates
          .filter((e) => new Date(e.nextVerification!) >= now)
          .sort((a, b) => new Date(a.nextVerification!).getTime() - new Date(b.nextVerification!).getTime());

        const monthGroups: MonthGroup[] = [];

        if (overdue.length > 0) {
          monthGroups.push({
            key: "overdue",
            label: "Просрочено",
            items: overdue.sort((a, b) => new Date(a.nextVerification!).getTime() - new Date(b.nextVerification!).getTime()),
            isOverdue: true,
          });
        }

        const monthMap = new Map<string, Equipment[]>();
        for (const eq of upcoming) {
          const d = new Date(eq.nextVerification!);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          if (!monthMap.has(key)) monthMap.set(key, []);
          monthMap.get(key)!.push(eq);
        }

        for (const [key, items] of monthMap) {
          const [year, month] = key.split("-");
          monthGroups.push({
            key,
            label: `${monthNames[parseInt(month) - 1]} ${year}`,
            items,
          });
        }

        setGroups(monthGroups);
      } catch (error) {
        console.error("Schedule fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build a map of date -> equipment[] for calendar
  const dateMap = useMemo(() => {
    const map = new Map<string, Equipment[]>();
    for (const eq of allEquipment) {
      if (!eq.nextVerification) continue;
      const d = new Date(eq.nextVerification);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(eq);
    }
    return map;
  }, [allEquipment]);

  // Calendar grid helpers
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1);
    const lastDay = new Date(calYear, calMonth + 1, 0);
    // Monday = 0, Sunday = 6 (ISO)
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month days
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(calYear, calMonth, -i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({ date: new Date(calYear, calMonth, d), isCurrentMonth: true });
    }

    // Next month days to fill 6 rows max
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        days.push({ date: new Date(calYear, calMonth + 1, d), isCurrentMonth: false });
      }
    }

    return days;
  }, [calYear, calMonth]);

  const navigateMonth = (delta: number) => {
    setSelectedDay(null);
    let newMonth = calMonth + delta;
    let newYear = calYear;
    if (newMonth > 11) { newMonth = 0; newYear++; }
    if (newMonth < 0) { newMonth = 11; newYear--; }
    setCalMonth(newMonth);
    setCalYear(newYear);
  };

  const goToToday = () => {
    setSelectedDay(null);
    const now = new Date();
    setCalMonth(now.getMonth());
    setCalYear(now.getFullYear());
  };

  const getUrgencyColor = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = diff / (1000 * 60 * 60 * 24);

    if (days < 0) return "border-l-red-500 bg-red-50 dark:bg-red-900/10";
    if (days < 14) return "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10";
    return "border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10";
  };

  const getDayKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const isToday = (d: Date) => {
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-dark dark:text-white">{title}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          {/* View mode toggle */}
          <div className="inline-flex rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === "list"
                  ? "gradient-primary text-white"
                  : "bg-white dark:bg-dark-light text-neutral dark:text-white/70 hover:bg-gray-50 dark:hover:bg-dark"
              }`}
            >
              <svg className="w-4 h-4 inline-block mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Список
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === "calendar"
                  ? "gradient-primary text-white"
                  : "bg-white dark:bg-dark-light text-neutral dark:text-white/70 hover:bg-gray-50 dark:hover:bg-dark"
              }`}
            >
              <svg className="w-4 h-4 inline-block mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Календарь
            </button>
          </div>
          <button
            onClick={handleExportWord}
            disabled={exporting || exportingArshin}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-dark-light text-dark dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-dark transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {exporting ? "Скачивание..." : "Скачать (.docx)"}
          </button>
          <button
            onClick={handleExportWordWithArshin}
            disabled={exporting || exportingArshin}
            title="Сначала проверяет актуальные даты в ФГИС Аршин, затем скачивает обновлённый график"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/30 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
          >
            {exportingArshin ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {exportingArshin ? "Проверка Аршин..." : "Экспорт с проверкой Аршин"}
          </button>
          <Link
            href={equipmentLink}
            className="text-sm text-primary hover:underline whitespace-nowrap"
          >
            {equipmentLinkLabel}
          </Link>
        </div>
      </div>

      {/* Empty state */}
      {allEquipment.length === 0 && (
        <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm">
          <EmptyState
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            title="Нет запланированных событий"
            description="Добавьте оборудование с датами поверки в разделе оборудования, чтобы увидеть график"
            action={
              <Link
                href="/dashboard/equipment/si"
                className="inline-flex items-center gap-2 gradient-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
              >
                Перейти к оборудованию
              </Link>
            }
          />
        </div>
      )}

      {/* ─── List View ─── */}
      {viewMode === "list" && allEquipment.length > 0 && (
        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.key}>
              <h2 className={`text-lg font-bold mb-4 ${group.isOverdue ? "text-red-600" : "text-dark dark:text-white"}`}>
                {group.isOverdue && (
                  <svg className="w-5 h-5 inline-block mr-2 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
                {group.label}
                <span className="text-sm font-normal text-neutral ml-2">({group.items.length})</span>
              </h2>
              <div className="space-y-2">
                {group.items.map((eq) => (
                  <div
                    key={eq.id}
                    className={`border-l-4 rounded-xl p-4 ${getUrgencyColor(eq.nextVerification!)}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-medium text-dark dark:text-white">{eq.name}</div>
                        <div className="text-sm text-neutral dark:text-white/60">
                          {eq.type || "\u2014"}
                          {eq.serialNumber && <span className="ml-2">Зав.№ {eq.serialNumber}</span>}
                          {eq.registryNumber && <span className="ml-2">Реестр {eq.registryNumber}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold text-dark dark:text-white">
                          {new Date(eq.nextVerification!).toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <span className="text-xs text-neutral">
                          {categoryLabels[eq.category] || eq.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Calendar View ─── */}
      {viewMode === "calendar" && allEquipment.length > 0 && (
        <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm overflow-hidden">
          {/* Month navigation */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-white/5">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <svg className="w-5 h-5 text-dark dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-dark dark:text-white">
                {monthNames[calMonth]} {calYear}
              </h2>
              <button
                onClick={goToToday}
                className="text-xs font-medium text-primary hover:underline"
              >
                Сегодня
              </button>
            </div>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <svg className="w-5 h-5 text-dark dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Legend */}
          <div className="px-4 sm:px-6 py-2 border-b border-gray-100 dark:border-white/5 flex flex-wrap items-center gap-4 text-xs text-neutral dark:text-white/50">
            {categories.includes("verification") && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Поверка
              </span>
            )}
            {categories.includes("calibration") && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                Калибровка
              </span>
            )}
            {categories.includes("attestation") && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Аттестация
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              Просрочено
            </span>
          </div>

          {/* Week day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100 dark:border-white/5">
            {weekDays.map((d) => (
              <div
                key={d}
                className="py-2 text-center text-xs font-semibold text-neutral dark:text-white/40 uppercase tracking-wider"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map(({ date, isCurrentMonth }, idx) => {
              const dayKey = getDayKey(date);
              const events = dateMap.get(dayKey) || [];
              const today = isToday(date);
              const hasOverdue = events.some((e) => new Date(e.nextVerification!) < new Date());
              const isSelected = selectedDay === dayKey;

              return (
                <div
                  key={idx}
                  className={`relative min-h-[80px] sm:min-h-[100px] border-b border-r border-gray-50 dark:border-white/5 p-1 sm:p-2 transition-colors ${
                    isCurrentMonth
                      ? "bg-white dark:bg-dark-light"
                      : "bg-gray-50/50 dark:bg-dark/50"
                  } ${events.length > 0 ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5" : ""}`}
                  onClick={() => {
                    if (events.length > 0) {
                      setSelectedDay(isSelected ? null : dayKey);
                    }
                  }}
                >
                  {/* Day number */}
                  <div className={`text-sm font-medium mb-1 ${
                    !isCurrentMonth
                      ? "text-gray-300 dark:text-white/20"
                      : today
                        ? "text-white"
                        : "text-dark dark:text-white"
                  }`}>
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${
                      today ? "gradient-primary" : ""
                    }`}>
                      {date.getDate()}
                    </span>
                  </div>

                  {/* Event indicators */}
                  {events.length > 0 && isCurrentMonth && (
                    <div className="space-y-0.5">
                      {events.length <= 3 ? (
                        events.map((eq) => {
                          const isOverdue = new Date(eq.nextVerification!) < new Date();
                          return (
                            <div
                              key={eq.id}
                              className={`text-[10px] sm:text-xs leading-tight px-1.5 py-0.5 rounded truncate ${
                                isOverdue
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  : `${categoryDotColors[eq.category] === "bg-blue-500" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : ""} ${categoryDotColors[eq.category] === "bg-purple-500" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : ""} ${categoryDotColors[eq.category] === "bg-amber-500" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : ""}`
                              }`}
                            >
                              {eq.name}
                            </div>
                          );
                        })
                      ) : (
                        <>
                          {events.slice(0, 2).map((eq) => {
                            const isOverdue = new Date(eq.nextVerification!) < new Date();
                            return (
                              <div
                                key={eq.id}
                                className={`text-[10px] sm:text-xs leading-tight px-1.5 py-0.5 rounded truncate ${
                                  isOverdue
                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                    : `${categoryDotColors[eq.category] === "bg-blue-500" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : ""} ${categoryDotColors[eq.category] === "bg-purple-500" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : ""} ${categoryDotColors[eq.category] === "bg-amber-500" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : ""}`
                                }`}
                              >
                                {eq.name}
                              </div>
                            );
                          })}
                          <div className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded font-medium ${
                            hasOverdue
                              ? "text-red-600 dark:text-red-400"
                              : "text-primary"
                          }`}>
                            +{events.length - 2} ещё
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Dots for non-current month */}
                  {events.length > 0 && !isCurrentMonth && (
                    <div className="flex gap-0.5 flex-wrap">
                      {events.slice(0, 5).map((eq) => (
                        <span
                          key={eq.id}
                          className={`w-1.5 h-1.5 rounded-full ${
                            new Date(eq.nextVerification!) < new Date()
                              ? "bg-red-400"
                              : categoryDotColors[eq.category] || "bg-gray-400"
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Day detail popover */}
                  {isSelected && events.length > 0 && (
                    <div
                      ref={popoverRef}
                      className="absolute z-20 top-full left-0 sm:left-1/2 sm:-translate-x-1/2 mt-1 w-72 bg-white dark:bg-dark-light border border-gray-200 dark:border-white/10 rounded-xl shadow-xl p-3 space-y-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-sm font-semibold text-dark dark:text-white mb-2">
                        {date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                        <span className="text-neutral font-normal ml-1">({events.length})</span>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1.5">
                        {events.map((eq) => {
                          const isOverdue = new Date(eq.nextVerification!) < new Date();
                          return (
                            <div
                              key={eq.id}
                              className={`border-l-3 rounded-lg p-2 text-xs ${
                                isOverdue
                                  ? "border-l-red-500 bg-red-50 dark:bg-red-900/10"
                                  : `border-l-2 ${categoryDotColors[eq.category] === "bg-blue-500" ? "border-l-blue-500 bg-blue-50 dark:bg-blue-900/10" : ""} ${categoryDotColors[eq.category] === "bg-purple-500" ? "border-l-purple-500 bg-purple-50 dark:bg-purple-900/10" : ""} ${categoryDotColors[eq.category] === "bg-amber-500" ? "border-l-amber-500 bg-amber-50 dark:bg-amber-900/10" : ""}`
                              }`}
                            >
                              <div className="font-medium text-dark dark:text-white">{eq.name}</div>
                              <div className="text-neutral dark:text-white/50 mt-0.5">
                                {categoryLabels[eq.category]}
                                {eq.serialNumber && <span> · Зав.№ {eq.serialNumber}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
