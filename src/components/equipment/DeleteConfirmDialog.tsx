"use client";

import { Portal } from "@/components/ui/Portal";
import React from "react";

interface DeleteConfirmDialogProps {
  show: boolean;
  name: string;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmDialog({
  show,
  name,
  deleting,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  if (!show) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !deleting && onCancel()}>
        <div className="bg-white dark:bg-dark-light rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-dark dark:text-white">Удалить оборудование?</h3>
              <p className="text-sm text-neutral dark:text-white/50 mt-0.5">Это действие нельзя отменить</p>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-3 mb-5">
            <p className="text-sm font-medium text-dark dark:text-white truncate">{name}</p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              disabled={deleting}
              className="px-4 py-2 rounded-xl text-sm font-medium text-neutral hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-70"
            >
              {deleting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Удаление...
                </>
              ) : (
                "Удалить"
              )}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
