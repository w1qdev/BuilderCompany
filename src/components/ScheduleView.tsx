"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

interface ScheduleViewProps {
  title: string;
  categories: string[];
  equipmentLink: string;
  equipmentLinkLabel?: string;
}

export default function ScheduleView({
  title,
  categories,
  equipmentLink,
  equipmentLinkLabel = "Всё оборудование",
}: ScheduleViewProps) {
  const [groups, setGroups] = useState<MonthGroup[]>([]);
  const [loading, setLoading] = useState(true);

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

        const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
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

  const getUrgencyColor = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = diff / (1000 * 60 * 60 * 24);

    if (days < 0) return "border-l-red-500 bg-red-50 dark:bg-red-900/10";
    if (days < 14) return "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10";
    return "border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10";
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-dark dark:text-white">{title}</h1>
        <Link
          href={equipmentLink}
          className="text-sm text-primary hover:underline"
        >
          {equipmentLinkLabel}
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-white/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-dark dark:text-white mb-2">Нет запланированных событий</h3>
          <p className="text-neutral dark:text-white/70">Добавьте оборудование с датами в разделе оборудования</p>
        </div>
      ) : (
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
    </div>
  );
}
