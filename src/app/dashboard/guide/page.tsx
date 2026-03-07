"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

type Section = "requests" | "equipment" | "organization" | "calculator" | "profile" | "notifications" | "admin";

interface GuideSection {
  id: Section;
  title: string;
  icon: string;
  description: string;
}

const sections: GuideSection[] = [
  {
    id: "requests",
    title: "Подача заявки",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    description: "Как создать и отслеживать заявку на поверку, калибровку или аттестацию",
  },
  {
    id: "equipment",
    title: "Оборудование",
    icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    description: "Управление парком оборудования: добавление, импорт, экспорт и графики поверки",
  },
  {
    id: "organization",
    title: "Организация",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    description: "Создание организации, приглашение сотрудников и совместная работа",
  },
  {
    id: "calculator",
    title: "Калькулятор МПИ",
    icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
    description: "Расчёт межповерочного интервала и планирование поверок",
  },
  {
    id: "profile",
    title: "Профиль и настройки",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    description: "Управление личными данными, оформление и безопасность аккаунта",
  },
  {
    id: "notifications",
    title: "Уведомления",
    icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
    description: "Настройка email и push-уведомлений о статусах заявок и поверок",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

// ─── Mini Preview Components ─────────────────────────────────────────────────

function PreviewRequestForm() {
  return (
    <div className="bg-white dark:bg-dark rounded-xl border border-gray-200 dark:border-white/10 p-4 space-y-3 text-xs">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span className="font-semibold text-dark dark:text-white">Новая заявка</span>
      </div>
      <div className="space-y-2">
        <div className="h-7 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 flex items-center text-neutral dark:text-white/40">
          Поверка манометра МП-3У
        </div>
        <div className="h-7 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 flex items-center text-neutral dark:text-white/40">
          +7 (900) 123-45-67
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-7 rounded-lg bg-primary/10 border border-primary/20 px-2 flex items-center text-primary font-medium">
            Поверка
          </div>
          <div className="h-7 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 flex items-center text-neutral dark:text-white/40">
            Калибровка
          </div>
        </div>
      </div>
      <div className="h-7 rounded-lg bg-primary text-white flex items-center justify-center font-medium">
        Отправить заявку
      </div>
    </div>
  );
}

function PreviewRequestStatus() {
  const statuses = [
    { label: "Новая", color: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400" },
    { label: "В работе", color: "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" },
    { label: "Выполнена", color: "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400" },
  ];
  return (
    <div className="bg-white dark:bg-dark rounded-xl border border-gray-200 dark:border-white/10 p-4 text-xs">
      <div className="font-semibold text-dark dark:text-white mb-3">Статусы заявок</div>
      <div className="space-y-2">
        {statuses.map((s) => (
          <div key={s.label} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-gray-50 dark:bg-white/5">
            <span className="text-neutral dark:text-white/60">Заявка #{Math.floor(Math.random() * 900 + 100)}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${s.color}`}>{s.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-neutral dark:text-white/40">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Статусы обновляются в реальном времени
      </div>
    </div>
  );
}

function PreviewEquipmentTable() {
  const items = [
    { name: "Манометр МП-3У", serial: "МП-001234", status: "active", next: "15.06.2026" },
    { name: "Термометр ТЛ-4", serial: "ТЛ-005678", status: "pending", next: "02.04.2026" },
    { name: "Вольтметр В7-78", serial: "В7-009012", status: "expired", next: "01.01.2026" },
  ];
  const statusMap: Record<string, { label: string; color: string }> = {
    active: { label: "Активно", color: "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400" },
    pending: { label: "Скоро", color: "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" },
    expired: { label: "Просрочено", color: "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400" },
  };
  return (
    <div className="bg-white dark:bg-dark rounded-xl border border-gray-200 dark:border-white/10 p-4 text-xs">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-dark dark:text-white">Оборудование СИ</span>
        <div className="flex gap-1">
          <div className="px-2 py-1 rounded-md bg-gray-100 dark:bg-white/5 text-neutral dark:text-white/40">Фильтр</div>
          <div className="px-2 py-1 rounded-md bg-primary/10 text-primary">+ Добавить</div>
        </div>
      </div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.serial} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-gray-50 dark:bg-white/5">
            <div>
              <div className="font-medium text-dark dark:text-white">{item.name}</div>
              <div className="text-neutral dark:text-white/40">{item.serial}</div>
            </div>
            <div className="text-right">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusMap[item.status].color}`}>
                {statusMap[item.status].label}
              </span>
              <div className="text-neutral dark:text-white/40 mt-0.5">{item.next}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewImportExport() {
  return (
    <div className="bg-white dark:bg-dark rounded-xl border border-gray-200 dark:border-white/10 p-4 text-xs">
      <div className="font-semibold text-dark dark:text-white mb-3">Импорт / Экспорт</div>
      <div className="grid grid-cols-2 gap-2">
        <div className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-lg p-3 text-center">
          <svg className="w-6 h-6 mx-auto mb-1 text-neutral dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <div className="text-neutral dark:text-white/40">Загрузить .xlsx</div>
        </div>
        <div className="border border-gray-200 dark:border-white/10 rounded-lg p-3 text-center flex flex-col items-center justify-center gap-1">
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="text-primary font-medium">Скачать .xlsx</div>
        </div>
      </div>
    </div>
  );
}

function PreviewOrganization() {
  const members = [
    { name: "Иванов А.С.", role: "Администратор", avatar: "И" },
    { name: "Петрова М.В.", role: "Сотрудник", avatar: "П" },
    { name: "Сидоров К.Л.", role: "Сотрудник", avatar: "С" },
  ];
  return (
    <div className="bg-white dark:bg-dark rounded-xl border border-gray-200 dark:border-white/10 p-4 text-xs">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-dark dark:text-white">ООО «Метрология Плюс»</span>
        <div className="px-2 py-1 rounded-md bg-primary/10 text-primary">+ Пригласить</div>
      </div>
      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.name} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-gray-50 dark:bg-white/5">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
              {m.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-dark dark:text-white truncate">{m.name}</div>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${m.role === "Администратор" ? "bg-primary/10 text-primary" : "bg-gray-100 dark:bg-white/10 text-neutral dark:text-white/50"}`}>
              {m.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewInvite() {
  return (
    <div className="bg-white dark:bg-dark rounded-xl border border-gray-200 dark:border-white/10 p-4 text-xs">
      <div className="font-semibold text-dark dark:text-white mb-3">Приглашение по email</div>
      <div className="space-y-2">
        <div className="h-7 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 flex items-center text-neutral dark:text-white/40">
          colleague@company.ru
        </div>
        <div className="flex gap-2">
          <div className="flex-1 h-7 rounded-lg bg-primary/10 border border-primary/20 px-2 flex items-center text-primary font-medium">
            Сотрудник
          </div>
          <div className="flex-1 h-7 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 flex items-center text-neutral dark:text-white/40">
            Администратор
          </div>
        </div>
        <div className="h-7 rounded-lg bg-primary text-white flex items-center justify-center font-medium">
          Отправить приглашение
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-neutral dark:text-white/40">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Приглашённый получит email со ссылкой
      </div>
    </div>
  );
}

function PreviewMPICalculator() {
  return (
    <div className="bg-white dark:bg-dark rounded-xl border border-gray-200 dark:border-white/10 p-4 text-xs">
      <div className="font-semibold text-dark dark:text-white mb-3">Калькулятор МПИ</div>
      <div className="space-y-2">
        <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-gray-50 dark:bg-white/5">
          <span className="text-neutral dark:text-white/60">Базовый МПИ</span>
          <span className="font-medium text-dark dark:text-white">12 мес.</span>
        </div>
        <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-gray-50 dark:bg-white/5">
          <span className="text-neutral dark:text-white/60">Условия эксплуатации</span>
          <span className="font-medium text-yellow-600 dark:text-yellow-400">Повышенные</span>
        </div>
        <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-gray-50 dark:bg-white/5">
          <span className="text-neutral dark:text-white/60">Коэффициент</span>
          <span className="font-medium text-dark dark:text-white">0.85</span>
        </div>
        <div className="border-t border-gray-200 dark:border-white/10 pt-2">
          <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-primary/10">
            <span className="text-primary font-medium">Рекомендуемый МПИ</span>
            <span className="font-bold text-primary">10 мес.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewProfile() {
  return (
    <div className="bg-white dark:bg-dark rounded-xl border border-gray-200 dark:border-white/10 p-4 text-xs">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
          И
        </div>
        <div>
          <div className="font-semibold text-dark dark:text-white">Иванов Алексей</div>
          <div className="text-neutral dark:text-white/40">ivanov@company.ru</div>
        </div>
      </div>
      <div className="flex gap-1 mb-3">
        {["Личные данные", "Оформление", "Безопасность"].map((tab, i) => (
          <div key={tab} className={`px-2 py-1 rounded-md text-[10px] font-medium ${i === 0 ? "bg-primary/10 text-primary" : "text-neutral dark:text-white/40"}`}>
            {tab}
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <div className="h-7 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 flex items-center text-neutral dark:text-white/60">
          Иванов Алексей Сергеевич
        </div>
        <div className="h-7 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 flex items-center text-neutral dark:text-white/60">
          +7 (900) 123-45-67
        </div>
      </div>
    </div>
  );
}

function PreviewThemes() {
  const themes = [
    { name: "Оранжевый", color: "bg-orange-500" },
    { name: "Синий", color: "bg-blue-500" },
    { name: "Зелёный", color: "bg-emerald-500" },
    { name: "Фиолетовый", color: "bg-violet-500" },
  ];
  return (
    <div className="bg-white dark:bg-dark rounded-xl border border-gray-200 dark:border-white/10 p-4 text-xs">
      <div className="font-semibold text-dark dark:text-white mb-3">Темы оформления</div>
      <div className="grid grid-cols-2 gap-2">
        {themes.map((t) => (
          <div key={t.name} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-gray-50 dark:bg-white/5">
            <div className={`w-4 h-4 rounded-full ${t.color}`} />
            <span className="text-dark dark:text-white">{t.name}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <div className="flex-1 py-1.5 rounded-lg bg-white border border-gray-200 text-center text-dark font-medium">
          Светлая
        </div>
        <div className="flex-1 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-center text-white font-medium">
          Тёмная
        </div>
      </div>
    </div>
  );
}

function PreviewNotifications() {
  return (
    <div className="bg-white dark:bg-dark rounded-xl border border-gray-200 dark:border-white/10 p-4 text-xs">
      <div className="font-semibold text-dark dark:text-white mb-3">Настройки уведомлений</div>
      <div className="space-y-2.5">
        {[
          { label: "Изменение статуса заявки", on: true },
          { label: "Приближение даты поверки", on: true },
          { label: "Новый сотрудник в организации", on: false },
        ].map((n) => (
          <div key={n.label} className="flex items-center justify-between py-1 px-2 rounded-lg bg-gray-50 dark:bg-white/5">
            <span className="text-dark dark:text-white">{n.label}</span>
            <div className={`w-8 h-4.5 rounded-full relative ${n.on ? "bg-primary" : "bg-gray-300 dark:bg-white/20"}`}>
              <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${n.on ? "left-[calc(100%-16px)]" : "left-0.5"}`} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-neutral dark:text-white/40">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Уведомления приходят на email
      </div>
    </div>
  );
}

// ─── Section Content Mapping ─────────────────────────────────────────────────

function SectionRequests() {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <PreviewRequestForm />
        <PreviewRequestStatus />
      </div>
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-dark dark:text-white">Как подать заявку</h3>
        <div className="space-y-3">
          <Step n={1} text='Нажмите кнопку "Оставить заявку" на главной странице или в личном кабинете' />
          <Step n={2} text="Заполните форму: укажите услугу (поверка, калибровка, аттестация), контактные данные и описание" />
          <Step n={3} text="При необходимости прикрепите файл (PDF, Word, изображение до 10 МБ)" />
          <Step n={4} text="Отправьте заявку — она появится в разделе «Мои заявки» со статусом «Новая»" />
          <Step n={5} text="Отслеживайте статус в реальном времени: Новая → В работе → Выполнена" />
        </div>
        <Tip text='Если вы авторизованы, заявка автоматически привяжется к вашему аккаунту, и вы сможете отслеживать её в разделе "Мои заявки"' />
      </div>
    </div>
  );
}

function SectionEquipment() {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <PreviewEquipmentTable />
        <PreviewImportExport />
      </div>
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-dark dark:text-white">Управление оборудованием</h3>
        <div className="space-y-3">
          <Step n={1} text="Оборудование принадлежит организации — для работы с ним создайте или вступите в организацию" />
          <Step n={2} text='Перейдите в раздел "Оборудование СИ" или "Оборудование ИО" в боковом меню' />
          <Step n={3} text='Добавьте оборудование вручную через кнопку "Добавить" или импортируйте из Excel-файла (.xlsx)' />
          <Step n={4} text="Для каждого прибора укажите: название, серийный номер, дату поверки и межповерочный интервал" />
          <Step n={5} text="Система автоматически рассчитает дату следующей поверки и покажет статус (активно / скоро / просрочено)" />
        </div>
        <Tip text="Используйте массовые операции: выберите несколько приборов и удалите или экспортируйте их одним действием" />

        <h3 className="text-base font-semibold text-dark dark:text-white mt-6">Графики поверки</h3>
        <p className="text-sm text-neutral dark:text-white/60">
          В разделах «График поверки (СИ)» и «График аттестации (ИО)» вы увидите календарное представление
          предстоящих поверок. Просроченные выделены красным, приближающиеся — жёлтым.
        </p>
      </div>
    </div>
  );
}

function SectionOrganization() {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <PreviewOrganization />
        <PreviewInvite />
      </div>
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-dark dark:text-white">Создание организации</h3>
        <div className="space-y-3">
          <Step n={1} text='Перейдите в раздел "Моя организация" в боковом меню' />
          <Step n={2} text='Нажмите "Создать организацию" и укажите название' />
          <Step n={3} text="Вы автоматически станете администратором созданной организации" />
        </div>

        <h3 className="text-base font-semibold text-dark dark:text-white mt-6">Приглашение сотрудников</h3>
        <div className="space-y-3">
          <Step n={1} text="Откройте страницу организации и нажмите «Пригласить сотрудника»" />
          <Step n={2} text="Введите email коллеги — он должен быть зарегистрирован в системе" />
          <Step n={3} text='Выберите роль: "Сотрудник" (просмотр и редактирование) или "Администратор" (полный доступ)' />
          <Step n={4} text="Приглашённый сотрудник получит доступ к общему оборудованию организации" />
        </div>
        <Tip text="Все сотрудники организации видят и могут редактировать общее оборудование. Администратор может управлять участниками." />
      </div>
    </div>
  );
}

function SectionCalculator() {
  return (
    <div className="space-y-6">
      <div className="max-w-sm">
        <PreviewMPICalculator />
      </div>
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-dark dark:text-white">Расчёт МПИ</h3>
        <div className="space-y-3">
          <Step n={1} text='Перейдите в раздел "Калькулятор МПИ" в боковом меню' />
          <Step n={2} text="Укажите базовый межповерочный интервал из документации на прибор" />
          <Step n={3} text="Выберите условия эксплуатации: нормальные, повышенные или тяжёлые" />
          <Step n={4} text="Система рассчитает рекомендуемый МПИ с учётом корректирующего коэффициента" />
        </div>
        <Tip text="Калькулятор носит рекомендательный характер. Окончательный МПИ определяется нормативной документацией." />
      </div>
    </div>
  );
}

function SectionProfile() {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <PreviewProfile />
        <PreviewThemes />
      </div>
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-dark dark:text-white">Личные данные</h3>
        <div className="space-y-3">
          <Step n={1} text='Нажмите на своё имя в нижней части бокового меню и выберите "Профиль"' />
          <Step n={2} text="На вкладке «Личные данные» заполните ФИО, телефон, должность и реквизиты организации" />
          <Step n={3} text="Загрузите аватар — он будет отображаться в боковом меню и в организации" />
        </div>

        <h3 className="text-base font-semibold text-dark dark:text-white mt-6">Оформление</h3>
        <p className="text-sm text-neutral dark:text-white/60">
          На вкладке «Оформление» выберите цветовую тему (оранжевая, синяя, зелёная и др.)
          и режим отображения (светлый или тёмный). Настройки сохраняются автоматически.
        </p>

        <h3 className="text-base font-semibold text-dark dark:text-white mt-6">Безопасность</h3>
        <p className="text-sm text-neutral dark:text-white/60">
          На вкладке «Безопасность» вы можете сменить пароль. Укажите текущий и новый пароль дважды для подтверждения.
        </p>
      </div>
    </div>
  );
}

function SectionNotifications() {
  return (
    <div className="space-y-6">
      <div className="max-w-sm">
        <PreviewNotifications />
      </div>
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-dark dark:text-white">Настройка уведомлений</h3>
        <div className="space-y-3">
          <Step n={1} text="Нажмите на колокольчик в верхней панели или перейдите в Профиль → Уведомления" />
          <Step n={2} text="Включите или отключите типы уведомлений: статусы заявок, приближение поверки, новые участники" />
          <Step n={3} text="Уведомления приходят на email, указанный в профиле" />
        </div>
        <Tip text="Если дата поверки приближается, система заблаговременно отправит напоминание." />
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
        {n}
      </div>
      <p className="text-sm text-neutral dark:text-white/70 leading-relaxed">{text}</p>
    </div>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">{text}</p>
    </div>
  );
}

const sectionContent: Record<Section, () => JSX.Element> = {
  requests: SectionRequests,
  equipment: SectionEquipment,
  organization: SectionOrganization,
  calculator: SectionCalculator,
  profile: SectionProfile,
  notifications: SectionNotifications,
  admin: () => <div />,
};

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function GuidePage() {
  const [active, setActive] = useState<Section>("requests");
  const ActiveContent = sectionContent[active];

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div {...fadeUp}>
        <h1 className="text-2xl font-bold text-dark dark:text-white mb-1">
          Руководство пользователя
        </h1>
        <p className="text-neutral dark:text-white/60 text-sm mb-6">
          Узнайте, как использовать все возможности личного кабинета
        </p>
      </motion.div>

      {/* Section navigation */}
      <motion.div {...fadeUp} transition={{ delay: 0.05, duration: 0.35 }}>
        <div className="flex flex-wrap gap-2 mb-8">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-shadow transition-colors ${
                active === s.id
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-white dark:bg-dark-light text-neutral dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 border border-gray-200 dark:border-white/10"
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={s.icon} />
              </svg>
              {s.title}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Active section content */}
      <motion.div
        key={active}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-dark-light rounded-2xl border border-gray-200 dark:border-white/10 p-6 sm:p-8"
      >
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-white/10">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={sections.find((s) => s.id === active)!.icon} />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-dark dark:text-white">
              {sections.find((s) => s.id === active)!.title}
            </h2>
            <p className="text-xs text-neutral dark:text-white/50">
              {sections.find((s) => s.id === active)!.description}
            </p>
          </div>
        </div>
        <ActiveContent />
      </motion.div>

      {/* Quick links */}
      <motion.div {...fadeUp} transition={{ delay: 0.1, duration: 0.35 }} className="mt-8">
        <div className="grid sm:grid-cols-3 gap-4">
          <QuickLink
            href="/dashboard/requests"
            label="Мои заявки"
            desc="Перейти к заявкам"
            icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
          <QuickLink
            href="/dashboard/equipment/si"
            label="Оборудование"
            desc="Управление приборами"
            icon="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
          <QuickLink
            href="/dashboard/organization"
            label="Организация"
            desc="Управление командой"
            icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </div>
      </motion.div>
    </div>
  );
}

function QuickLink({ href, label, desc, icon }: { href: string; label: string; desc: string; icon: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-dark-light border border-gray-200 dark:border-white/10 hover:border-primary/30 dark:hover:border-primary/30 transition-colors"
    >
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
        <svg className="w-4.5 h-4.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
        </svg>
      </div>
      <div>
        <div className="text-sm font-medium text-dark dark:text-white">{label}</div>
        <div className="text-xs text-neutral dark:text-white/40">{desc}</div>
      </div>
    </Link>
  );
}
