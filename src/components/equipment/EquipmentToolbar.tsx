"use client";

import React from "react";

// ARSHIN_ENABLED: set to true when Arshin integration is ready
const ARSHIN_ENABLED = false;

interface EquipmentToolbarProps {
  title: string;
  importing: boolean;
  arshinChecking: boolean;
  search: string;
  filterStatus: string;
  showIgnored: boolean;
  filterCategory: string;
  categoryOptions: { value: string; label: string }[];
  fileInputRef: React.RefObject<HTMLInputElement>;
  onAddClick: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
  onExport: () => void;
  onOrgImportClick: () => void;
  onSearchChange: (value: string) => void;
  onFilterStatusChange: (value: string, ignored: boolean) => void;
  onFilterCategoryChange: (value: string) => void;
}

export default function EquipmentToolbar({
  title,
  importing,
  arshinChecking,
  search,
  filterStatus,
  showIgnored,
  filterCategory,
  categoryOptions,
  fileInputRef,
  onAddClick,
  onImport,
  onDownloadTemplate,
  onExport,
  onOrgImportClick,
  onSearchChange,
  onFilterStatusChange,
  onFilterCategoryChange,
}: EquipmentToolbarProps) {
  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-dark dark:text-white">
          {title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onAddClick}
            className="inline-flex items-center gap-2 gradient-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/30 transition-shadow"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Добавить
          </button>
          <label
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-dark-light text-dark dark:text-white border border-gray-200 dark:border-white/10 cursor-pointer hover:bg-gray-50 transition-colors ${importing ? "opacity-50 pointer-events-none" : ""}`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            {importing ? "Импорт..." : "Импорт "}
            (.xlsx)
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={onImport}
            />
          </label>
          <button
            onClick={onDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral dark:text-white/60 hover:text-dark dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            title="Скачать шаблон для импорта"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Шаблон
          </button>
          <button
            onClick={onExport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-dark-light text-dark dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Экспорт (.xlsx)
          </button>
          {/* ARSHIN_ENABLED: org import button hidden until integration is ready */}
          {ARSHIN_ENABLED && (
            <button
              onClick={onOrgImportClick}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/30 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Аршин: по организации
            </button>
          )}
          {ARSHIN_ENABLED && arshinChecking && (
            <span className="inline-flex items-center gap-1.5 text-xs text-neutral dark:text-white/40">
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Проверка через Аршин...
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 sm:max-w-xs">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Поиск..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-light text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={showIgnored ? "ignored" : filterStatus}
          onChange={(e) => {
            if (e.target.value === "ignored") {
              onFilterStatusChange("", true);
            } else {
              onFilterStatusChange(e.target.value, false);
            }
          }}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-light text-sm text-dark dark:text-white"
        >
          <option value="">Все статусы</option>
          <option value="active">Активно</option>
          <option value="pending">Скоро поверка</option>
          <option value="expired">Просрочено</option>
          <option value="ignored">Архив</option>
        </select>
        {categoryOptions.length > 1 && (
          <select
            value={filterCategory}
            onChange={(e) => onFilterCategoryChange(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-light text-sm text-dark dark:text-white"
          >
            <option value="">Все категории</option>
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </>
  );
}
