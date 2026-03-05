"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const features = [
  {
    id: "equipment",
    title: "Учёт оборудования",
    description:
      "Ведите реестр средств измерений и испытательного оборудования. Импорт и экспорт в Excel, быстрый поиск и фильтрация.",
    icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    preview: {
      headers: ["Наименование", "Зав. №", "Поверка до", "Статус"],
      rows: [
        ["Манометр МП-100", "А-1234", "15.08.2026", "active"],
        ["Мультиметр Fluke 87V", "F-5678", "03.04.2026", "pending"],
        ["Весы CAS SW-10", "W-9012", "22.01.2026", "expired"],
      ],
    },
  },
  {
    id: "schedule",
    title: "Графики поверки",
    description:
      "Автоматический контроль сроков поверки и аттестации. Напоминания за 30, 14 и 7 дней до окончания.",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    preview: {
      months: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн"],
      items: [
        { name: "Манометр МП-100", month: 4, color: "bg-emerald-400" },
        { name: "Мультиметр Fluke 87V", month: 1, color: "bg-amber-400" },
        { name: "Весы CAS SW-10", month: 0, color: "bg-red-400" },
        { name: "Термометр ТЦМ-9", month: 5, color: "bg-emerald-400" },
      ],
    },
  },
  {
    id: "requests",
    title: "Заявки онлайн",
    description:
      "Подавайте заявки на поверку и калибровку прямо из личного кабинета. Отслеживайте статус в реальном времени.",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    preview: {
      requests: [
        { id: "№ 1042", service: "Поверка СИ", status: "Выполнена", color: "bg-emerald-100 text-emerald-700" },
        { id: "№ 1043", service: "Калибровка", status: "В работе", color: "bg-blue-100 text-blue-700" },
        { id: "№ 1044", service: "Аттестация ИО", status: "Новая", color: "bg-amber-100 text-amber-700" },
      ],
    },
  },
  {
    id: "analytics",
    title: "Аналитика",
    description:
      "Наглядная статистика по оборудованию: сколько на учёте, сколько требует поверки, динамика по месяцам.",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    preview: {
      bars: [35, 52, 48, 65, 72, 58, 80, 68, 90, 75, 85, 92],
      labels: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
    },
  },
  {
    id: "themes",
    title: "Персонализация",
    description:
      "23 темы оформления, выбор размера шрифта и компактный режим. Настройте интерфейс под себя.",
    icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
    preview: {
      themes: [
        { name: "Апельсин", bg: "#FFF8F0", primary: "#E87A2E", card: "#FFFFFF" },
        { name: "Океан", bg: "#F0F7FF", primary: "#2563EB", card: "#FFFFFF" },
        { name: "Изумруд", bg: "#F0FDF5", primary: "#10B981", card: "#FFFFFF" },
        { name: "Обсидиан", bg: "#0A0A0A", primary: "#F5F5F5", card: "#171717" },
        { name: "Аврора", bg: "#0F172A", primary: "#38BDF8", card: "#1E293B" },
        { name: "Слива", bg: "#1A0B2E", primary: "#D946EF", card: "#2E1065" },
      ],
    },
  },
];

function EquipmentPreview({ data }: { data: { headers: string[]; rows: string[][] } }) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set([1]));
  const statusMap: Record<string, { label: string; class: string; dot: string }> = {
    active: { label: "Действует", class: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
    pending: { label: "Скоро", class: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
    expired: { label: "Просрочено", class: "bg-red-100 text-red-700", dot: "bg-red-500" },
  };
  const toggleRow = (i: number) => {
    setSelectedRows(prev => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next; });
  };
  return (
    <div className="space-y-3">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Всего СИ", value: "147", icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z", color: "text-blue-600 bg-blue-50" },
          { label: "Поверено", value: "128", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-emerald-600 bg-emerald-50" },
          { label: "Требуют внимания", value: "19", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z", color: "text-amber-600 bg-amber-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-gray-100 p-2.5 flex items-center gap-2 hover:shadow-sm transition-shadow cursor-default">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${s.color}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} /></svg>
            </div>
            <div>
              <div className="text-sm font-bold text-gray-800 leading-none">{s.value}</div>
              <div className="text-[9px] text-gray-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-7 bg-white rounded-lg border border-gray-200 px-2.5 flex items-center gap-1.5 hover:border-gray-300 transition-colors cursor-text">
          <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <span className="text-[10px] text-gray-300">Поиск оборудования...</span>
        </div>
        <div className="h-7 px-2.5 rounded-lg text-[10px] font-medium flex items-center gap-1 cursor-pointer hover:opacity-90 transition-opacity" style={{ backgroundColor: "#E87A2E", color: "#fff" }}>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Добавить
        </div>
        <div className="h-7 px-2 rounded-lg border border-gray-200 bg-white text-[10px] text-gray-500 flex items-center gap-1 cursor-pointer hover:bg-gray-50 transition-colors">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          Фильтры
        </div>
      </div>
      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-[16px_1fr_auto_auto_auto] gap-2 px-3 py-2 bg-gray-50/80 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
          <span />
          {data.headers.map((h) => <span key={h}>{h}</span>)}
        </div>
        {data.rows.map((row, i) => (
          <div
            key={i}
            className={`grid grid-cols-[16px_1fr_auto_auto_auto] gap-2 px-3 py-2.5 text-xs text-gray-600 items-center cursor-pointer transition-colors ${
              i > 0 ? "border-t border-gray-50" : ""
            } ${hoveredRow === i ? "bg-orange-50/40" : ""} ${selectedRows.has(i) ? "bg-orange-50/60" : ""}`}
            onMouseEnter={() => setHoveredRow(i)}
            onMouseLeave={() => setHoveredRow(null)}
            onClick={() => toggleRow(i)}
          >
            <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-colors ${
              selectedRows.has(i) ? "border-[#E87A2E] bg-[#E87A2E]" : "border-gray-300"
            }`}>
              {selectedRows.has(i) && <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className="font-medium text-gray-800">{row[0]}</span>
            <span className="font-mono text-[10px]">{row[1]}</span>
            <span>{row[2]}</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium w-fit ${statusMap[row[3]]?.class}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusMap[row[3]]?.dot}`} />
              {statusMap[row[3]]?.label}
            </span>
          </div>
        ))}
        <div className="px-3 py-2 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[10px] text-gray-400">Показано 3 из 147</span>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[9px] text-gray-400 cursor-pointer hover:bg-gray-200 transition-colors">&lt;</div>
            <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] text-white font-bold cursor-pointer" style={{ backgroundColor: "#E87A2E" }}>1</div>
            <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[9px] text-gray-500 cursor-pointer hover:bg-gray-200 transition-colors">2</div>
            <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[9px] text-gray-500 cursor-pointer hover:bg-gray-200 transition-colors">3</div>
            <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[9px] text-gray-400 cursor-pointer hover:bg-gray-200 transition-colors">&gt;</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SchedulePreview({ data }: { data: { months: string[]; items: { name: string; month: number; color: string }[] } }) {
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ row: number; col: number } | null>(null);
  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex items-center gap-4">
        {[
          { color: "bg-emerald-400", label: "В срок" },
          { color: "bg-amber-400", label: "Скоро истекает" },
          { color: "bg-red-400", label: "Просрочено" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
            <span className="text-[10px] text-gray-500">{l.label}</span>
          </div>
        ))}
      </div>
      {/* Gantt chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header months */}
        <div className="flex items-center border-b border-gray-100">
          <div className="w-36 shrink-0 px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase">Оборудование</div>
          <div className="flex-1 grid grid-cols-6 gap-px">
            {data.months.map((m) => (
              <div key={m} className="text-center py-2 text-[10px] font-medium text-gray-400 bg-gray-50/50">{m}</div>
            ))}
          </div>
        </div>
        {/* Rows */}
        {data.items.map((item, i) => (
          <div
            key={i}
            className={`flex items-center transition-colors ${i > 0 ? "border-t border-gray-50" : ""} ${hoveredItem === i ? "bg-gray-50/50" : ""}`}
            onMouseEnter={() => setHoveredItem(i)}
            onMouseLeave={() => { setHoveredItem(null); setTooltip(null); }}
          >
            <div className="w-36 shrink-0 px-3 py-2.5">
              <div className="text-[11px] font-medium text-gray-700 truncate">{item.name}</div>
              <div className="text-[9px] text-gray-400">Зав. № {["А-1234", "F-5678", "W-9012", "T-3456"][i]}</div>
            </div>
            <div className="flex-1 grid grid-cols-6 gap-px">
              {data.months.map((_, mi) => (
                <div
                  key={mi}
                  className={`h-10 flex items-center justify-center px-0.5 cursor-pointer transition-colors ${
                    mi === item.month ? "" : "bg-gray-50/30 hover:bg-gray-100/50"
                  }`}
                  onMouseEnter={() => mi === item.month && setTooltip({ row: i, col: mi })}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {mi === item.month && (
                    <div className="relative w-full">
                      <div className={`w-full h-6 rounded ${item.color} flex items-center justify-center transition-transform ${tooltip?.row === i && tooltip?.col === mi ? "scale-105" : ""}`}>
                        <svg className="w-3 h-3 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.color.includes("emerald") ? "M5 13l4 4L19 7" : item.color.includes("red") ? "M6 18L18 6M6 6l12 12" : "M12 8v4m0 4h.01"} />
                        </svg>
                      </div>
                      {tooltip?.row === i && tooltip?.col === mi && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                          {item.color.includes("emerald") ? "Поверка действует" : item.color.includes("red") ? "Срок истёк!" : "Истекает скоро"}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {/* Footer */}
        <div className="px-3 py-2 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[10px] text-gray-400">4 единицы на контроле</span>
          <div className="flex items-center gap-1 text-[10px] text-emerald-500">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            Напоминания включены
          </div>
        </div>
      </div>
    </div>
  );
}

function RequestsPreview({ data }: { data: { requests: { id: string; service: string; status: string; color: string }[] } }) {
  const [expanded, setExpanded] = useState<string | null>("№ 1043");
  const steps = ["Подана", "Принята", "В работе", "Готово"];
  const statusStep: Record<string, number> = { "Выполнена": 4, "В работе": 3, "Новая": 1 };
  const extraInfo: Record<string, { date: string; items: number; manager: string }> = {
    "№ 1042": { date: "28.02.2026", items: 5, manager: "Петрова А.С." },
    "№ 1043": { date: "04.03.2026", items: 3, manager: "Сидоров В.И." },
    "№ 1044": { date: "05.03.2026", items: 1, manager: "—" },
  };
  return (
    <div className="space-y-3">
      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Активные", value: "2", color: "text-blue-600" },
          { label: "Завершённые", value: "8", color: "text-emerald-600" },
          { label: "Всего", value: "10", color: "text-gray-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-gray-100 p-2 text-center hover:shadow-sm transition-shadow cursor-default">
            <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[9px] text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>
      {/* Request cards */}
      {data.requests.map((r) => {
        const current = statusStep[r.status] || 1;
        const isExpanded = expanded === r.id;
        const info = extraInfo[r.id];
        return (
          <div
            key={r.id}
            className={`bg-white rounded-xl shadow-sm border p-3 space-y-2.5 cursor-pointer transition-all ${isExpanded ? "border-[#E87A2E]/30 shadow-md" : "border-gray-100 hover:shadow-md"}`}
            onClick={() => setExpanded(isExpanded ? null : r.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className={`w-3 h-3 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                <span className="text-xs font-bold text-gray-800">{r.id}</span>
                <span className="text-[10px] text-gray-400">·</span>
                <span className="text-[11px] text-gray-500">{r.service}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${r.color}`}>{r.status}</span>
            </div>
            {/* Progress steps */}
            <div className="flex items-center gap-1">
              {steps.map((step, si) => (
                <div key={step} className="flex items-center gap-1 flex-1">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold ${
                    si < current
                      ? "text-white"
                      : "bg-gray-100 text-gray-400"
                  }`} style={si < current ? { backgroundColor: "#E87A2E" } : {}}>
                    {si < current ? "✓" : si + 1}
                  </div>
                  <span className={`text-[8px] hidden sm:inline ${si < current ? "text-gray-700 font-medium" : "text-gray-300"}`}>{step}</span>
                  {si < steps.length - 1 && <div className={`flex-1 h-px ${si < current - 1 ? "bg-[#E87A2E]" : "bg-gray-100"}`} />}
                </div>
              ))}
            </div>
            {/* Expanded details */}
            {isExpanded && info && (
              <div className="pt-2 border-t border-gray-100 grid grid-cols-3 gap-2">
                <div>
                  <div className="text-[9px] text-gray-400">Дата подачи</div>
                  <div className="text-[10px] font-medium text-gray-700">{info.date}</div>
                </div>
                <div>
                  <div className="text-[9px] text-gray-400">Позиций</div>
                  <div className="text-[10px] font-medium text-gray-700">{info.items} ед.</div>
                </div>
                <div>
                  <div className="text-[9px] text-gray-400">Менеджер</div>
                  <div className="text-[10px] font-medium text-gray-700">{info.manager}</div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AnalyticsPreview({ data }: { data: { bars: number[]; labels: string[] } }) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const max = Math.max(...data.bars);
  const calibrations = [12, 18, 15, 22, 25, 20, 28, 24, 32, 26, 30, 34];
  return (
    <div className="space-y-3">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Всего поверок", value: "740", change: "+12%", up: true, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
          { label: "Среднее/мес", value: "62", change: "+8%", up: true, icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
          { label: "Успешных", value: "98%", change: "+2%", up: true, icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" },
          { label: "Просрочено", value: "3", change: "-25%", up: false, icon: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-gray-100 p-2 hover:shadow-sm transition-shadow cursor-default">
            <div className="flex items-center justify-between mb-1">
              <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} /></svg>
              <div className={`text-[9px] font-medium flex items-center gap-0.5 ${s.up ? "text-emerald-500" : "text-red-500"}`}>
                <svg className={`w-2 h-2 ${s.up ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                {s.change}
              </div>
            </div>
            <div className="text-sm font-bold text-gray-800">{s.value}</div>
            <div className="text-[9px] text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>
      {/* Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-gray-700">Поверки по месяцам</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: "#E87A2E" }} />
              <span className="text-[9px] text-gray-400">Поверки</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-blue-400" />
              <span className="text-[9px] text-gray-400">Калибровки</span>
            </div>
          </div>
        </div>
        <div className="flex items-end gap-1" style={{ height: 90 }}>
          {data.bars.map((v, i) => {
            const pct = (v / max) * 100;
            const calPct = (calibrations[i] / max) * 100;
            const isHovered = hoveredBar === i;
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-end h-full gap-px cursor-pointer relative"
                onMouseEnter={() => setHoveredBar(i)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {isHovered && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[8px] px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-10">
                    {v} / {calibrations[i]}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-[3px] border-transparent border-t-gray-800" />
                  </div>
                )}
                <div className="w-full flex items-end gap-px justify-center" style={{ height: pct * 0.9 }}>
                  <motion.div
                    className="flex-1 rounded-t-sm transition-opacity"
                    style={{ backgroundColor: "#E87A2E", opacity: isHovered ? 1 : 0.85 }}
                    initial={{ height: 0 }}
                    animate={{ height: pct * 0.9 }}
                    transition={{ delay: i * 0.04, duration: 0.4 }}
                  />
                  <motion.div
                    className="flex-1 rounded-t-sm bg-blue-400 transition-opacity"
                    style={{ opacity: isHovered ? 1 : 0.85 }}
                    initial={{ height: 0 }}
                    animate={{ height: calPct * 0.9 }}
                    transition={{ delay: i * 0.04 + 0.1, duration: 0.4 }}
                  />
                </div>
                <span className={`text-[8px] mt-0.5 transition-colors ${isHovered ? "text-gray-700 font-medium" : "text-gray-400"}`}>{data.labels[i]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ThemesPreview({ data }: { data: { themes: { name: string; bg: string; primary: string; card: string }[] } }) {
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [fontSize, setFontSize] = useState(1);
  const [compact, setCompact] = useState(false);
  const fontSizes = ["S", "M", "L"];
  const t = data.themes[selectedTheme];
  return (
    <div className="space-y-3">
      {/* Profile mockup header — reacts to selected theme */}
      <div className="rounded-xl shadow-sm border overflow-hidden transition-colors" style={{ backgroundColor: t.card, borderColor: `${t.primary}20` }}>
        <div className="h-8 relative" style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.primary}CC)` }}>
          <div className="absolute -bottom-4 left-3 w-9 h-9 rounded-full border-2 flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: t.card, borderColor: t.card, color: t.primary }}>ИИ</div>
        </div>
        <div className="pt-5 px-3 pb-2.5">
          <div className="text-xs font-semibold" style={{ color: t.bg.startsWith("#0") || t.bg.startsWith("#1") ? "#E5E5E5" : "#1F2937" }}>Иванов Иван</div>
          <div className="text-[10px]" style={{ color: t.bg.startsWith("#0") || t.bg.startsWith("#1") ? "#888" : "#9CA3AF" }}>Инженер-метролог · ЦСМ</div>
        </div>
      </div>
      {/* Theme label */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-gray-600">Выберите тему оформления</span>
        <span className="text-[10px] text-gray-400">23 темы</span>
      </div>
      {/* Theme grid */}
      <div className="grid grid-cols-3 gap-2">
        {data.themes.map((theme, i) => (
          <div
            key={theme.name}
            className={`rounded-lg overflow-hidden shadow-sm cursor-pointer transition-all hover:scale-[1.03] ${
              selectedTheme === i ? "" : "border border-gray-100 hover:shadow-md"
            }`}
            style={selectedTheme === i ? { outline: `2px solid ${theme.primary}`, outlineOffset: "-1px" } : {}}
            onClick={() => setSelectedTheme(i)}
          >
            {/* Mini dashboard mockup */}
            <div className="p-1.5" style={{ backgroundColor: theme.bg }}>
              <div className="flex gap-1">
                <div className="w-3 space-y-1">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: theme.primary }} />
                  <div className="w-3 h-1 rounded-full" style={{ backgroundColor: theme.primary, opacity: 0.3 }} />
                  <div className="w-3 h-1 rounded-full" style={{ backgroundColor: theme.primary, opacity: 0.15 }} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="h-2 w-2/3 rounded-full" style={{ backgroundColor: theme.primary, opacity: 0.6 }} />
                  <div className="h-5 rounded" style={{ backgroundColor: theme.card, border: "1px solid rgba(0,0,0,0.06)" }}>
                    <div className="h-1 w-3/4 rounded-full mt-1 mx-1" style={{ backgroundColor: theme.primary, opacity: 0.2 }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-1.5 py-1 flex items-center justify-between" style={{ backgroundColor: theme.card.includes("#FFF") || theme.card === "#FFFFFF" ? "#FAFAFA" : theme.card }}>
              <span className="text-[9px] font-medium" style={{ color: theme.bg.startsWith("#0") || theme.bg.startsWith("#1") ? "#999" : "#666" }}>{theme.name}</span>
              {selectedTheme === i && <div className="w-2.5 h-2.5 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.primary }}><svg className="w-1.5 h-1.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>}
            </div>
          </div>
        ))}
      </div>
      {/* Font size / compact toggles — interactive */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-white rounded-lg border border-gray-100 px-2 py-1">
          <span className="text-[9px] text-gray-400">Aa</span>
          <div className="flex gap-0.5">
            {fontSizes.map((s, si) => (
              <div
                key={s}
                className={`w-4 h-4 rounded text-[8px] flex items-center justify-center cursor-pointer transition-colors ${
                  fontSize === si ? "text-white font-bold" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                }`}
                style={fontSize === si ? { backgroundColor: t.primary } : {}}
                onClick={() => setFontSize(si)}
              >{s}</div>
            ))}
          </div>
        </div>
        <div
          className="flex items-center gap-1.5 bg-white rounded-lg border border-gray-100 px-2 py-1 cursor-pointer"
          onClick={() => setCompact(!compact)}
        >
          <span className="text-[9px] text-gray-400">Компактный</span>
          <div className={`w-6 h-3.5 rounded-full relative transition-colors ${compact ? "" : "bg-gray-200"}`} style={compact ? { backgroundColor: t.primary } : {}}>
            <div className={`w-2.5 h-2.5 rounded-full bg-white shadow-sm absolute top-0.5 transition-all ${compact ? "left-[calc(100%-14px)]" : "left-0.5"}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const previewComponents: Record<string, React.FC<{ data: any }>> = {
  equipment: EquipmentPreview,
  schedule: SchedulePreview,
  requests: RequestsPreview,
  analytics: AnalyticsPreview,
  themes: ThemesPreview,
};

export default function DashboardShowcase() {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = (delay = 5000) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % features.length);
    }, delay);
  };

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabClick = (i: number) => {
    setActive(i);
    resetTimer(12000);
  };

  const handlePreviewInteraction = () => {
    resetTimer(12000);
  };

  const feature = features[active];
  const PreviewComponent = previewComponents[feature.id];

  return (
    <section className="py-20 bg-warm-bg dark:bg-dark relative overflow-hidden" id="dashboard">
      <div className="max-w-8xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Личный кабинет
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-dark dark:text-white">
            Всё оборудование — под контролем
          </h2>
          <p className="text-neutral dark:text-white/60 mt-3 max-w-2xl mx-auto">
            Управляйте средствами измерений, следите за сроками поверки и подавайте заявки — всё в одном месте
          </p>
        </motion.div>

        {/* Content */}
        <div className="grid lg:grid-cols-7 gap-8 items-start">
          {/* Feature tabs — left */}
          <div className="lg:col-span-3 space-y-2">
            {features.map((f, i) => (
              <motion.button
                key={f.id}
                onClick={() => handleTabClick(i)}
                className={`w-full text-left px-5 py-4 rounded-2xl transition-all duration-200 ${
                  active === i
                    ? "bg-white dark:bg-dark-light shadow-lg shadow-primary/10 border border-primary/20"
                    : "bg-white/50 dark:bg-dark-light/50 border border-transparent hover:bg-white dark:hover:bg-dark-light hover:shadow-md"
                }`}
                whileHover={{ x: active === i ? 0 : 4 }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    active === i ? "bg-primary/10 text-primary" : "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/40"
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={f.icon} />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-sm font-bold mb-0.5 ${
                      active === i ? "text-primary" : "text-dark dark:text-white"
                    }`}>
                      {f.title}
                    </h3>
                    <p className={`text-xs leading-relaxed ${
                      active === i ? "text-gray-600 dark:text-white/60" : "text-gray-400 dark:text-white/40"
                    }`}>
                      {f.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Preview — right */}
          <div className="lg:col-span-4">
            <div className="bg-gray-50 dark:bg-dark-light rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-white/10 min-h-[400px]">
              {/* Address bar */}
              <div className="flex items-center gap-2 mb-5">
                <div className="flex-1 h-7 bg-white dark:bg-dark rounded-lg px-3 flex items-center gap-2 border border-gray-200 dark:border-white/10">
                  <svg className="w-3 h-3 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-[10px] text-gray-400">csm-center.ru/dashboard</span>
                </div>
              </div>

              {/* Preview content */}
              {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
              <div onClick={handlePreviewInteraction}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    {PreviewComponent && <PreviewComponent data={feature.preview} />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-5 flex items-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 gradient-primary text-white px-6 py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/30 transition-shadow"
              >
                Открыть личный кабинет
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium text-primary hover:underline"
              >
                Регистрация
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
