"use client";

import React from "react";
import { statusConfig } from "@/lib/equipmentStatus";
import type { Equipment } from "./types";
import { categoryLabels } from "./types";

const statusDisplay: Record<string, { label: string; color: string }> = statusConfig;

interface EquipmentCardProps {
  eq: Equipment;
  isSelected: boolean;
  isHighlighted: boolean;
  highlightRef: React.Ref<HTMLDivElement>;
  onToggleSelect: (id: number) => void;
  onPin: (id: number, pin: boolean) => void;
  onEdit: (eq: Equipment) => void;
  onHistory: (eq: Equipment) => void;
  onDuplicate: (eq: Equipment) => void;
  onIgnore: (id: number, ignore: boolean) => void;
  onDelete: (id: number, name: string) => void;
}

export default function EquipmentCard({
  eq,
  isSelected,
  isHighlighted,
  highlightRef,
  onToggleSelect,
  onPin,
  onEdit,
  onHistory,
  onDuplicate,
  onIgnore,
  onDelete,
}: EquipmentCardProps) {
  return (
    <div
      ref={isHighlighted ? highlightRef : null}
      className={`bg-white dark:bg-dark-light rounded-2xl shadow-sm p-4 transition-all ${isHighlighted ? "ring-2 ring-primary ring-offset-2" : ""}`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(eq.id)}
          className="mt-1 rounded border-gray-300"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-medium text-dark dark:text-white truncate">
                {eq.name}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-neutral dark:text-white/50">
                <span>{eq.type || "\u2014"}{eq.serialNumber ? ` / ${eq.serialNumber}` : ""}</span>
                {/* ARSHIN_ENABLED: arshinUrl and arshinMismatch badges hidden */}
              </div>
            </div>
            <span
              className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${statusDisplay[eq.status]?.color || "bg-gray-100 text-gray-600"}`}
            >
              {statusDisplay[eq.status]?.label || eq.status}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-neutral flex-wrap">
            <span>{categoryLabels[eq.category] || eq.category}</span>
            {eq.nextVerification && (
              <span>
                До:{" "}
                {new Date(eq.nextVerification).toLocaleDateString("ru-RU")}
              </span>
            )}
            {/* ARSHIN_ENABLED: mitApproved badge hidden */}
            {eq.requestItems && eq.requestItems.length > 0 && (() => {
              const lastReq = eq.requestItems[0].request;
              const reqStatusLabels: Record<string, { label: string; color: string }> = {
                new: { label: "Заявка подана", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
                in_progress: { label: "В работе", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
                done: { label: "Выполнена", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
              };
              const cfg = reqStatusLabels[lastReq.status] || reqStatusLabels.new;
              return (
                <a href={`/dashboard/requests?expand=${lastReq.id}`} onClick={(e) => e.stopPropagation()} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium hover:opacity-80 ${cfg.color}`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  №{lastReq.id}: {cfg.label}
                </a>
              );
            })()}
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <button
              onClick={() => onPin(eq.id, !eq.pinned)}
              className={`text-xs ${eq.pinned ? "text-yellow-500" : "text-gray-400"} hover:underline`}
            >
              {eq.pinned ? "Открепить" : "Закрепить"}
            </button>
            <button
              onClick={() => onEdit(eq)}
              className="text-xs text-primary hover:underline"
            >
              Редактировать
            </button>
            <button
              onClick={() => onHistory(eq)}
              className="text-xs text-purple-500 hover:underline"
            >
              История
            </button>
            <button
              onClick={() => onDuplicate(eq)}
              className="text-xs text-blue-500 hover:underline"
            >
              Дублировать
            </button>
            <button
              onClick={() => onIgnore(eq.id, !eq.ignored)}
              className="text-xs text-amber-500 hover:underline"
            >
              {eq.ignored ? "Из архива" : "В архив"}
            </button>
            <button
              onClick={() => onDelete(eq.id, eq.name)}
              className="text-xs text-red-500 hover:underline"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
