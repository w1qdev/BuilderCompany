"use client";

import { Portal } from "@/components/ui/Portal";
import React from "react";
import type { Equipment } from "./types";

interface RequestArshinInfo {
  id: number;
  name: string;
  validDate: string | null;
  expired: boolean;
}

interface RequestConfirmModalProps {
  show: boolean;
  selectedCount: number;
  equipment: Equipment[];
  requestArshinInfo: RequestArshinInfo[];
  requestArshinLoading: boolean;
  submittingRequest: boolean;
  onSubmit: () => void;
  onClose: () => void;
}

export default function RequestConfirmModal({
  show,
  selectedCount,
  equipment,
  requestArshinInfo,
  requestArshinLoading,
  submittingRequest,
  onSubmit,
  onClose,
}: RequestConfirmModalProps) {
  if (!show) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-dark-light rounded-2xl shadow-xl max-w-lg w-full flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 shrink-0 border-b border-gray-100 dark:border-white/5">
            <h2 className="text-lg font-bold text-dark dark:text-white">Создание заявки</h2>
            <p className="text-sm text-neutral dark:text-white/50 mt-0.5">
              Выбрано {selectedCount} ед. оборудования
            </p>
          </div>

          {/* Scrollable content */}
          <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0">
            {requestArshinLoading ? (
              <div className="flex items-center gap-2 py-6 text-sm text-neutral">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Проверяем статус поверок в Аршин...
              </div>
            ) : (
              <>
                {/* Equipment table */}
                <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral dark:text-white/50 uppercase tracking-wide">Оборудование</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral dark:text-white/50 uppercase tracking-wide">Зав. №</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral dark:text-white/50 uppercase tracking-wide">Статус Аршин</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requestArshinInfo.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 dark:border-white/5 last:border-0">
                          <td className="px-4 py-3 font-medium text-dark dark:text-white">
                            {item.name}
                          </td>
                          <td className="px-4 py-3 text-neutral dark:text-white/50 font-mono text-xs">
                            {equipment.find((e) => e.id === item.id)?.serialNumber || "\u2014"}
                          </td>
                          <td className="px-4 py-3">
                            {item.validDate ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${item.expired ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${item.expired ? "bg-red-500" : "bg-green-500"}`} />
                                {item.expired ? "Просрочена" : `до ${new Date(item.validDate).toLocaleDateString("ru-RU")}`}
                              </span>
                            ) : (
                              <span className="text-xs text-neutral dark:text-white/30">Нет данных</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {requestArshinInfo.some((i) => !i.expired && i.validDate) && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-400/30 rounded-xl text-xs text-yellow-800 dark:text-yellow-300">
                    Часть оборудования имеет действующую поверку. Убедитесь, что заявка необходима.
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 shrink-0 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={submittingRequest}
              className="px-4 py-2 rounded-xl text-sm text-neutral hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              onClick={onSubmit}
              disabled={submittingRequest || requestArshinLoading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold gradient-primary text-white hover:shadow-lg hover:shadow-primary/30 transition-shadow disabled:opacity-70"
            >
              {submittingRequest ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Создаём заявку...
                </>
              ) : (
                "Создать заявку"
              )}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
