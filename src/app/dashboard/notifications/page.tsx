"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

const NOTIFY_OPTIONS = [
  { value: "30", label: "За 30 дней" },
  { value: "14", label: "За 14 дней" },
  { value: "7", label: "За 7 дней" },
  { value: "3", label: "За 3 дня" },
  { value: "1", label: "За 1 день" },
];

export default function NotificationsPage() {
  const [notifyDays, setNotifyDays] = useState<string[]>(["30", "14", "7"]);
  const [telegramChatId, setTelegramChatId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.notifyDays) {
          setNotifyDays(data.user.notifyDays.split(",").filter(Boolean));
        }
        if (data.user?.telegramChatId) setTelegramChatId(data.user.telegramChatId);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggle = (value: string) => {
    setNotifyDays((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifyDays: notifyDays.join(","), telegramChatId: telegramChatId.trim() || null }),
      });
      if (!res.ok) { toast.error("Ошибка сохранения"); return; }
      toast.success("Настройки уведомлений сохранены");
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" role="status" aria-label="Загрузка">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-xs text-neutral dark:text-white/50">Загрузка...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark dark:text-white">Настройки уведомлений</h1>
        <p className="text-sm text-neutral dark:text-white/60 mt-1">
          Выберите, за сколько дней до поверки присылать email-уведомление
        </p>
      </div>

      <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-6 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-dark dark:text-white mb-4">
            Напоминания о предстоящих поверках
          </h2>
          <div className="space-y-3">
            {NOTIFY_OPTIONS.map((opt) => {
              const checked = notifyDays.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    checked
                      ? "border-primary bg-orange-50 dark:bg-orange-900/10"
                      : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                      checked ? "border-primary bg-primary" : "border-gray-300 dark:border-white/30"
                    }`}
                    role="checkbox"
                    aria-checked={checked}
                    tabIndex={0}
                    onClick={() => toggle(opt.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(opt.value); } }}
                  >
                    {checked && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div role="button" tabIndex={0} onClick={() => toggle(opt.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(opt.value); } }} className="flex-1">
                    <div className="text-sm font-medium text-dark dark:text-white">{opt.label}</div>
                    <div className="text-xs text-neutral dark:text-white/50 mt-0.5">
                      Уведомление за {opt.value} {Number(opt.value) === 1 ? "день" : Number(opt.value) < 5 ? "дня" : "дней"} до даты поверки
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {notifyDays.length === 0 && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400 text-sm">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Уведомления отключены — вы не будете получать напоминания о поверках
          </div>
        )}

        <div className="pt-5 border-t border-gray-100 dark:border-white/10">
          <h2 className="text-sm font-semibold text-dark dark:text-white mb-3">
            Уведомления в Telegram
          </h2>

          {/* Step-by-step instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3 mb-3">
              <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Как подключить Telegram-уведомления</p>
            </div>
            <ol className="space-y-2 text-sm text-blue-700 dark:text-blue-300/80 ml-8 list-decimal">
              <li>
                Откройте бота{" "}
                {/* TODO: Replace with actual bot username from env */}
                <a
                  href="https://t.me/csm_center_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  @csm_center_bot
                </a>
                {" "}в Telegram
              </li>
              <li>Отправьте команду <code className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded text-xs font-mono">/start</code></li>
              <li>Бот ответит вашим <strong>Chat ID</strong> — скопируйте его и вставьте в поле ниже</li>
            </ol>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Ваш Telegram Chat ID"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 group">
              <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-56 bg-dark text-white text-xs rounded-lg p-3 shadow-lg z-10">
                Chat ID — числовой идентификатор вашего чата в Telegram. Бот сообщит его после команды /start.
              </div>
            </div>
          </div>
          {telegramChatId && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Telegram привязан
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-gray-100 dark:border-white/10">
          <p className="text-xs text-neutral dark:text-white/50 mb-4">
            Уведомления отправляются на ваш email. Убедитесь, что email указан в профиле.
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-primary text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {saving ? "Сохранение..." : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Сохранить настройки</>}
          </button>
        </div>
      </div>
    </div>
  );
}
