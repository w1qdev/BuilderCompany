"use client";

import { Portal } from "@/components/ui/Portal";
import React from "react";
import type { VerificationRecord } from "./types";

interface HistoryModalProps {
  show: boolean;
  equipmentName: string;
  records: VerificationRecord[];
  loading: boolean;
  onClose: () => void;
}

export default function HistoryModal({
  show,
  equipmentName,
  records,
  loading,
  onClose,
}: HistoryModalProps) {
  if (!show) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" role="button" tabIndex={-1} onClick={onClose} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClose(); } }}>
        <div role="dialog" className="bg-white dark:bg-dark-light rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { e.stopPropagation(); }}>
          <div className="px-6 pt-6 pb-4 shrink-0 border-b border-gray-100 dark:border-white/5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-dark dark:text-white">История поверок</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-neutral">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-neutral dark:text-white/50 mt-1">{equipmentName}</p>
          </div>
          <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : records.length === 0 ? (
              <p className="text-sm text-neutral dark:text-white/50 py-8 text-center">
                Записей пока нет
              </p>
            ) : (
              <div className="space-y-4">
                {records.map((rec) => (
                  <div key={rec.id} className="relative pl-6 border-l-2 border-primary/20 pb-2">
                    <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-primary" />
                    <div className="text-sm font-medium text-dark dark:text-white">
                      {new Date(rec.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                    {rec.nextDate && (
                      <div className="text-xs text-neutral dark:text-white/50 mt-0.5">
                        Следующая: {new Date(rec.nextDate).toLocaleDateString("ru-RU")}
                      </div>
                    )}
                    {rec.result && (
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${rec.result === "годен" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {rec.result}
                      </span>
                    )}
                    {rec.performer && <div className="text-xs text-neutral dark:text-white/40 mt-1">Поверитель: {rec.performer}</div>}
                    {rec.certificate && <div className="text-xs text-neutral dark:text-white/40">Свидетельство: {rec.certificate}</div>}
                    {rec.notes && <div className="text-xs text-neutral dark:text-white/40 mt-1 italic">{rec.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="px-6 py-3 shrink-0 border-t border-gray-100 dark:border-white/5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm text-neutral hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
