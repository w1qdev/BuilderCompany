"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Portal } from "@/components/ui/Portal";

export default function BugReportButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim() || message.trim().length < 5) {
      toast.error("Опишите проблему подробнее");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/bug-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          page: window.location.pathname,
          userAgent: navigator.userAgent,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Спасибо! Сообщение отправлено разработчикам");
        setMessage("");
        setOpen(false);
      } else {
        toast.error(data.error || "Ошибка отправки");
      }
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-gray-800 dark:bg-white/10 text-white shadow-lg hover:bg-gray-700 dark:hover:bg-white/20 transition-colors flex items-center justify-center group"
        title="Сообщить об ошибке"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </button>

      {open && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
            <div className="relative bg-white dark:bg-dark-light rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-dark dark:text-white">Сообщить об ошибке</h2>
                <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-neutral dark:text-white/50">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-neutral dark:text-white/50 mb-4">
                Опишите проблему, с которой вы столкнулись. Сообщение будет отправлено нашей команде разработки.
              </p>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Что произошло? На какой странице? Что ожидали увидеть?"
                rows={5}
                maxLength={2000}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm text-dark dark:text-white placeholder:text-neutral dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                autoFocus
              />

              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-neutral dark:text-white/40">
                  {message.length}/2000
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-white/10 text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={sending || message.trim().length < 5}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    {sending ? "Отправка..." : "Отправить"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
