"use client";

import React from "react";
import { statusConfig } from "@/lib/equipmentStatus";
import type { Equipment } from "./types";
import { categoryLabels } from "./types";

const statusDisplay: Record<string, { label: string; color: string }> = statusConfig;

interface EquipmentTableRowProps {
  eq: Equipment;
  isSelected: boolean;
  isHighlighted: boolean;
  highlightRef: React.Ref<HTMLTableRowElement>;
  showCategory: boolean;
  onToggleSelect: (id: number) => void;
  onPin: (id: number, pin: boolean) => void;
  onEdit: (eq: Equipment) => void;
  onHistory: (eq: Equipment) => void;
  onDuplicate: (eq: Equipment) => void;
  onIgnore: (id: number, ignore: boolean) => void;
  onDelete: (id: number, name: string) => void;
}

export default function EquipmentTableRow({
  eq,
  isSelected,
  isHighlighted,
  highlightRef,
  showCategory,
  onToggleSelect,
  onPin,
  onEdit,
  onHistory,
  onDuplicate,
  onIgnore,
  onDelete,
}: EquipmentTableRowProps) {
  return (
    <tr
      ref={isHighlighted ? highlightRef : null}
      className={`border-b border-gray-100 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] ${isHighlighted ? "bg-primary/5 dark:bg-primary/10" : ""}`}
    >
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(eq.id)}
          className="rounded border-gray-300"
        />
      </td>
      <td className="px-4 py-3 font-medium text-dark dark:text-white">
        {eq.name}
      </td>
      <td className="px-4 py-3 text-neutral dark:text-white/60">
        {eq.type || "\u2014"}
      </td>
      <td className="px-4 py-3 text-neutral dark:text-white/60 font-mono text-xs">
        {eq.serialNumber || "\u2014"}
      </td>
      <td className="px-4 py-3 text-neutral dark:text-white/60 font-mono text-xs">
        {eq.registryNumber || "\u2014"}
        {/* ARSHIN_ENABLED: arshinUrl and arshinMismatch badges hidden */}
      </td>
      {showCategory && (
        <td className="px-4 py-3">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/10 text-dark dark:text-white">
            {categoryLabels[eq.category] || eq.category}
          </span>
        </td>
      )}
      <td className="px-4 py-3 text-neutral dark:text-white/60 whitespace-nowrap">
        {eq.nextVerification
          ? new Date(eq.nextVerification).toLocaleDateString("ru-RU")
          : "\u2014"}
      </td>
      <td className="px-4 py-3">
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusDisplay[eq.status]?.color || "bg-gray-100 text-gray-600"}`}
        >
          {statusDisplay[eq.status]?.label || eq.status}
        </span>
      </td>
      {/* ARSHIN_ENABLED: mitApproved column hidden */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPin(eq.id, !eq.pinned)}
            className={`p-1.5 rounded-lg transition-colors ${eq.pinned ? "text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/10" : "text-gray-300 dark:text-white/20 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-yellow-500"}`}
            title={eq.pinned ? "Открепить" : "Закрепить"}
          >
            <svg className="w-4 h-4" fill={eq.pinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
          <button
            onClick={() => onEdit(eq)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-neutral transition-colors"
            title="Редактировать"
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => onHistory(eq)}
            className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/10 text-purple-400 transition-colors"
            title="История поверок"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            onClick={() => onDuplicate(eq)}
            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/10 text-blue-400 transition-colors"
            title="Дублировать"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => onIgnore(eq.id, !eq.ignored)}
            className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/10 text-amber-400 transition-colors"
            title={eq.ignored ? "Из архива" : "В архив"}
          >
            {eq.ignored ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            )}
          </button>
          <button
            onClick={() => onDelete(eq.id, eq.name)}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 text-red-400 transition-colors"
            title="Удалить"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}
