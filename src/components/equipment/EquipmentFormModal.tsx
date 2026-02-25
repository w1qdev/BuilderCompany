"use client";

import { Portal } from "@/components/ui/Portal";
import React from "react";
import type { ArshinItem, EquipmentFormData } from "./types";

// ARSHIN_ENABLED: set to true when Arshin integration is ready
const ARSHIN_ENABLED = false;

interface MitStatus {
  status: "loading" | "approved" | "not_found";
  mitUrl?: string;
}

interface EquipmentFormModalProps {
  show: boolean;
  editingId: number | null;
  form: EquipmentFormData;
  saving: boolean;
  categoryOptions: { value: string; label: string }[];
  dateLabel: string;
  nextDateLabel: string;
  arshinLoading: boolean;
  arshinResults: ArshinItem[] | null;
  mitStatusMap: Record<string, MitStatus>;
  onClose: () => void;
  onFormChange: (form: EquipmentFormData) => void;
  onSave: () => void;
  onSearchArshin: () => void;
  onApplyArshinResult: (item: ArshinItem) => void;
  onClearArshinResults: () => void;
}

export default function EquipmentFormModal({
  show,
  editingId,
  form,
  saving,
  categoryOptions,
  dateLabel,
  nextDateLabel,
  arshinLoading,
  arshinResults,
  mitStatusMap,
  onClose,
  onFormChange,
  onSave,
  onSearchArshin,
  onApplyArshinResult,
  onClearArshinResults,
}: EquipmentFormModalProps) {
  if (!show) return null;

  const setField = <K extends keyof EquipmentFormData>(key: K, value: EquipmentFormData[K]) => {
    onFormChange({ ...form, [key]: value });
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-dark-light rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-bold text-dark dark:text-white mb-4">
            {editingId
              ? "Редактировать оборудование"
              : "Добавить оборудование"}
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral mb-1">
                Наименование *
              </label>
              <input
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Манометр МП-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral mb-1">
                  Тип/Модель
                </label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                  value={form.type}
                  onChange={(e) => setField("type", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral mb-1">
                  Категория
                </label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                  value={form.category}
                  onChange={(e) => setField("category", e.target.value)}
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral mb-1">
                  Заводской номер
                </label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                  value={form.serialNumber}
                  onChange={(e) => setField("serialNumber", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral mb-1">
                  Номер реестра ФГИС
                </label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                  value={form.registryNumber}
                  placeholder="Номер из реестра СИ"
                  onChange={(e) => setField("registryNumber", e.target.value)}
                />
              </div>
            </div>
            {/* ARSHIN_ENABLED: Arshin search hidden until integration is ready */}
            {ARSHIN_ENABLED && <div>
              <button
                type="button"
                onClick={onSearchArshin}
                disabled={arshinLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-400/30 text-blue-700 dark:text-blue-300 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
              >
                {arshinLoading ? (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                )}
                {arshinLoading ? "Поиск в Аршин..." : "Найти в ФГИС Аршин по номеру реестра или заводскому номеру"}
              </button>
              {arshinResults && arshinResults.length > 0 && (
                <div className="mt-2 border border-blue-200 dark:border-blue-400/30 rounded-lg overflow-hidden">
                  <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 flex justify-between items-center">
                    <span>Результаты из ФГИС Аршин — нажмите для применения</span>
                    <button type="button" onClick={onClearArshinResults} className="text-blue-400 hover:text-blue-600">&#10005;</button>
                  </div>
                  {arshinResults.map((item, i) => {
                    const mitStatus = item.miRegestryNumber ? mitStatusMap[item.miRegestryNumber] : undefined;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => onApplyArshinResult(item)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/10 border-t border-blue-100 dark:border-blue-400/20 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-dark dark:text-white truncate">{item.miName || "\u2014"}</div>
                            <div className="text-neutral dark:text-white/50 mt-0.5">
                              {[item.miType, item.miSerialNumber && `\u2116 ${item.miSerialNumber}`, item.validDate && `до ${item.validDate.split("T")[0]}`].filter(Boolean).join(" \u00b7 ")}
                            </div>
                            {item.orgTitle && (
                              <div className="text-neutral dark:text-white/40 mt-0.5 truncate">
                                Поверитель: {item.orgTitle}
                              </div>
                            )}
                          </div>
                          {/* MIT badge */}
                          {mitStatus && (
                            <span className="shrink-0 mt-0.5">
                              {mitStatus.status === "loading" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/40">
                                  <svg className="w-2.5 h-2.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                  </svg>
                                  MIT...
                                </span>
                              ) : mitStatus.status === "approved" ? (
                                <a
                                  href={mitStatus.mitUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 transition-colors"
                                >
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Допущен
                                </a>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/40">
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Не найден
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral mb-1">
                  {dateLabel}
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                  value={form.verificationDate}
                  onChange={(e) => setField("verificationDate", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral mb-1">
                  {nextDateLabel}
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                  value={form.nextVerification}
                  onChange={(e) => setField("nextVerification", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral mb-1">
                  Интервал (мес.)
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                  value={form.interval}
                  onChange={(e) => setField("interval", Number(e.target.value) || 12)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral mb-1">
                  Организация
                </label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                  value={form.company}
                  onChange={(e) => setField("company", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral mb-1">
                Email для уведомлений
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                value={form.contactEmail}
                onChange={(e) => setField("contactEmail", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral mb-1">
                Примечания
              </label>
              <textarea
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm resize-none"
                rows={2}
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-neutral hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="px-6 py-2 rounded-xl text-sm font-semibold gradient-primary text-white hover:shadow-lg hover:shadow-primary/30 transition-shadow disabled:opacity-50"
            >
              {saving
                ? "Сохранение..."
                : editingId
                  ? "Сохранить"
                  : "Добавить"}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
