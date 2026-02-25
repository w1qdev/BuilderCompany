"use client";

import { Portal } from "@/components/ui/Portal";
import { statusConfig } from "@/lib/equipmentStatus";
import React from "react";
import type { Equipment } from "./types";
import { categoryLabels } from "./types";

const statusDisplay: Record<string, { label: string; color: string }> = statusConfig;

interface CompareModalProps {
  show: boolean;
  items: Equipment[];
  onClose: () => void;
}

export default function CompareModal({ show, items, onClose }: CompareModalProps) {
  if (!show || items.length < 2) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white dark:bg-dark-light rounded-2xl shadow-xl max-w-4xl w-full max-h-[85vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-dark dark:text-white">Сравнение оборудования</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-neutral">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-neutral dark:text-white/50 w-32">Характеристика</th>
                  {items.map((eq) => (
                    <th key={eq.id} className="px-3 py-2 text-left text-sm font-semibold text-dark dark:text-white min-w-[150px]">{eq.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Тип/Модель", key: "type" },
                  { label: "Зав. номер", key: "serialNumber" },
                  { label: "Реестр", key: "registryNumber" },
                  { label: "Категория", key: "category" },
                  { label: "Интервал (мес.)", key: "interval" },
                  { label: "Дата поверки", key: "verificationDate" },
                  { label: "След. дата", key: "nextVerification" },
                  { label: "Статус", key: "status" },
                  { label: "Организация", key: "company" },
                ].map((row) => (
                  <tr key={row.key} className="border-b border-gray-100 dark:border-white/5">
                    <td className="px-3 py-2 text-xs font-medium text-neutral dark:text-white/50">{row.label}</td>
                    {items.map((eq) => {
                      let val: string = String((eq as unknown as Record<string, unknown>)[row.key] ?? "\u2014");
                      if ((row.key === "verificationDate" || row.key === "nextVerification") && val && val !== "\u2014") {
                        val = new Date(val).toLocaleDateString("ru-RU");
                      }
                      if (row.key === "status") val = statusDisplay[eq.status]?.label || eq.status;
                      if (row.key === "category") val = categoryLabels[eq.category] || eq.category;
                      return <td key={eq.id} className="px-3 py-2 text-sm text-dark dark:text-white">{val || "\u2014"}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Portal>
  );
}
