"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

interface EquipmentItem {
  id: number;
  name: string;
  type: string | null;
  nextVerification: string;
  status?: string;
  category?: string;
}

export default function MiniCalendar({ equipment }: { equipment: EquipmentItem[] }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const verificationDates = useMemo(() => {
    const map: Record<string, EquipmentItem[]> = {};
    equipment.forEach((eq) => {
      if (!eq.nextVerification) return;
      const key = eq.nextVerification.split("T")[0];
      if (!map[key]) map[key] = [];
      map[key].push(eq);
    });
    return map;
  }, [equipment]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay() || 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split("T")[0];

  const days: (number | null)[] = [];
  for (let i = 1; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthName = currentMonth.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
  const selectedEquipment = selectedDate ? verificationDates[selectedDate] || [] : [];

  return (
    <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-dark dark:text-white text-sm">Календарь поверок</h2>
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/5">
            <svg className="w-4 h-4 text-neutral" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-xs text-neutral dark:text-white/60 min-w-[120px] text-center capitalize">{monthName}</span>
          <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/5">
            <svg className="w-4 h-4 text-neutral" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-xs mb-1">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
          <div key={d} className="text-neutral dark:text-white/40 py-1 font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasVerification = !!verificationDates[dateStr];
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          return (
            <button
              key={day}
              onClick={() => hasVerification ? setSelectedDate(isSelected ? null : dateStr) : undefined}
              className={`relative py-1.5 rounded text-xs transition-colors ${
                isSelected ? "bg-primary text-white" :
                isToday ? "bg-primary/10 text-primary font-bold" :
                hasVerification ? "hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer font-medium text-dark dark:text-white" :
                "text-neutral dark:text-white/40"
              }`}
            >
              {day}
              {hasVerification && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
      {selectedDate && selectedEquipment.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
          <p className="text-xs text-neutral dark:text-white/50 mb-2">
            {new Date(selectedDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} — {selectedEquipment.length} ед.
          </p>
          <div className="space-y-1">
            {selectedEquipment.slice(0, 5).map((eq) => (
              <Link
                key={eq.id}
                href={`${eq.category === "attestation" ? "/dashboard/equipment/io" : "/dashboard/equipment/si"}?highlight=${eq.id}`}
                className="block text-xs text-dark dark:text-white hover:text-primary transition-colors truncate"
              >
                {eq.name} {eq.type ? `(${eq.type})` : ""}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
