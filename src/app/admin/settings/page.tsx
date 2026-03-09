"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { Input } from "@/components/ui/input";

interface Settings {
  emailNotifyAdmin: boolean;
  emailNotifyCustomer: boolean;
  telegramNotify: boolean;
  maxNotify: boolean;
  notifyEmail: string;
  companyPhone: string;
  companyEmail: string;
  companyAddress: string;
  template_new: string;
  template_in_progress: string;
  template_pending_payment: string;
  template_review: string;
  template_done: string;
  template_cancelled: string;
  response_templates: string;
  imapEnabled: boolean;
  imapCheckInterval: string;
  defaultMarkup: string;
}

interface ResponseTemplate {
  label: string;
  text: string;
}

type TabId = "email" | "confirmation" | "telegram" | "max" | "contacts" | "templates" | "automation" | "security";

const tabs = [
  {
    id: "email" as const,
    label: "Email",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "confirmation" as const,
    label: "Подтверждение",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "telegram" as const,
    label: "Telegram",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    id: "max" as const,
    label: "MAX",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
    ),
  },
  {
    id: "contacts" as const,
    label: "Контакты",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: "automation" as const,
    label: "Автоматизация",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    id: "templates" as const,
    label: "Шаблоны",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: "security" as const,
    label: "Безопасность",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
];

export default function AdminSettingsPage() {
  const { password, login } = useAdminAuth();
  const [settings, setSettings] = useState<Settings>({
    emailNotifyAdmin: true,
    emailNotifyCustomer: true,
    telegramNotify: true,
    maxNotify: false,
    notifyEmail: "",
    companyPhone: "",
    companyEmail: "",
    companyAddress: "",
    template_new: "",
    template_in_progress: "",
    template_pending_payment: "",
    template_review: "",
    template_done: "",
    template_cancelled: "",
    response_templates: "",
    imapEnabled: false,
    imapCheckInterval: "2",
    defaultMarkup: "20",
  });
  const [activeTab, setActiveTab] = useState<TabId>("email");
  const [loading, setLoading] = useState(true);
  const [contactsSaved, setContactsSaved] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordConfirming, setPasswordConfirming] = useState(false);

  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState("");

  const [templatesSaved, setTemplatesSaved] = useState(false);
  const [responseTemplates, setResponseTemplates] = useState<ResponseTemplate[]>([
    { label: "Принято в работу", text: "Ваша заявка принята в работу. Мы свяжемся с вами в ближайшее время для уточнения деталей." },
    { label: "Запрос документов", text: "Для обработки заявки нам необходимы дополнительные документы. Пожалуйста, предоставьте копии свидетельств о поверке." },
    { label: "Готово к выдаче", text: "Работы по вашей заявке завершены. Документы готовы к выдаче. Свяжитесь с нами для получения." },
    { label: "Ожидание оплаты", text: "Счёт на оплату направлен на вашу электронную почту. После оплаты мы приступим к выполнению работ." },
    { label: "Уточнение данных", text: "Просим уточнить данные по заявке: наименование СИ, заводской номер и номер в реестре ФИФ." },
  ]);

  useEffect(() => {
    fetch("/api/admin/settings", { headers: { "x-admin-password": password } })
      .then((res) => {
        if (res.status === 401) {
          sessionStorage.removeItem("admin-password");
          throw new Error("unauthorized");
        }
        return res.json();
      })
      .then((data) => {
        setSettings(data);
        // Load custom response templates if saved
        if (data.response_templates) {
          try {
            const parsed = JSON.parse(data.response_templates);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setResponseTemplates(parsed);
            }
          } catch { /* use defaults */ }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [password]);

  const saveSettings = useCallback(
    async (updated: Settings) => {
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify(updated),
      }).catch(() => {});
    },
    [password]
  );

  const toggleSetting = (key: "emailNotifyAdmin" | "emailNotifyCustomer" | "telegramNotify" | "maxNotify") => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    saveSettings(updated);
  };

  const saveContacts = async () => {
    await saveSettings(settings);
    setContactsSaved(true);
    setTimeout(() => setContactsSaved(false), 2000);
  };

  const changePassword = async () => {
    setPasswordError("");
    setPasswordSuccess(false);
    if (newPassword.length < 8) {
      setPasswordError("Пароль должен быть не менее 8 символов");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Пароли не совпадают");
      return;
    }
    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ newPassword }),
      });
      if (res.ok) {
        sessionStorage.setItem("admin-password", newPassword);
        login(newPassword);
        setNewPassword("");
        setConfirmPassword("");
        setPasswordSuccess(true);
        setPasswordConfirming(false);
      } else {
        const data = await res.json();
        setPasswordError(data.error || "Ошибка смены пароля");
        setPasswordConfirming(false);
      }
    } catch {
      setPasswordError("Ошибка соединения");
      setPasswordConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "email":
        return (
          <div className="max-w-lg">
            <h2 className="text-xl font-bold text-dark dark:text-white mb-1">Email уведомления</h2>
            <p className="text-sm text-neutral dark:text-white/50 mb-8">
              Настройте получение уведомлений по электронной почте о новых заявках от клиентов.
            </p>
            <div className="bg-warm-bg dark:bg-dark rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-dark dark:text-white">Уведомления по email</div>
                  <div className="text-xs text-neutral dark:text-white/50 mt-0.5">Получать письма о новых заявках</div>
                </div>
                <button
                  onClick={() => toggleSetting("emailNotifyAdmin")}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${settings.emailNotifyAdmin ? "bg-primary" : "bg-gray-300 dark:bg-white/20"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.emailNotifyAdmin ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
              {settings.emailNotifyAdmin && (
                <div className="mt-5 pt-4 border-t border-gray-200 dark:border-white/10">
                  <label className="text-xs text-neutral dark:text-white/50 mb-1.5 block font-medium">Адрес для уведомлений</label>
                  <Input
                    type="email"
                    placeholder="admin@company.com"
                    value={settings.notifyEmail}
                    onChange={(e) => setSettings((prev) => ({ ...prev, notifyEmail: e.target.value }))}
                    onBlur={(e) => saveSettings({ ...settings, notifyEmail: e.target.value })}
                    className="dark:bg-dark dark:border-white/10 dark:text-white"
                  />
                  <p className="text-xs text-neutral/60 dark:text-white/30 mt-1.5">Если пусто — используется NOTIFY_EMAIL из окружения</p>
                </div>
              )}
            </div>
          </div>
        );

      case "confirmation":
        return (
          <div className="max-w-lg">
            <h2 className="text-xl font-bold text-dark dark:text-white mb-1">Подтверждение заявки</h2>
            <p className="text-sm text-neutral dark:text-white/50 mb-8">
              Автоматическое уведомление клиентов о принятии их заявки.
            </p>
            <div className="bg-warm-bg dark:bg-dark rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-dark dark:text-white">Подтверждение заявки</div>
                  <div className="text-xs text-neutral dark:text-white/50 mt-0.5">Отправлять клиенту письмо о принятии заявки</div>
                </div>
                <button
                  onClick={() => toggleSetting("emailNotifyCustomer")}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${settings.emailNotifyCustomer ? "bg-primary" : "bg-gray-300 dark:bg-white/20"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.emailNotifyCustomer ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
          </div>
        );

      case "telegram":
        return (
          <div className="max-w-lg">
            <h2 className="text-xl font-bold text-dark dark:text-white mb-1">Telegram уведомления</h2>
            <p className="text-sm text-neutral dark:text-white/50 mb-8">
              Отправка уведомлений о новых заявках в Telegram-чат бота.
            </p>
            <div className="bg-warm-bg dark:bg-dark rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-dark dark:text-white">Уведомления в Telegram</div>
                  <div className="text-xs text-neutral dark:text-white/50 mt-0.5">Отправлять сообщение в чат бота</div>
                </div>
                <button
                  onClick={() => toggleSetting("telegramNotify")}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${settings.telegramNotify ? "bg-primary" : "bg-gray-300 dark:bg-white/20"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.telegramNotify ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
          </div>
        );

      case "max":
        return (
          <div className="max-w-lg">
            <h2 className="text-xl font-bold text-dark dark:text-white mb-1">MAX уведомления</h2>
            <p className="text-sm text-neutral dark:text-white/50 mb-8">
              Отправка уведомлений о новых заявках в мессенджер MAX.
            </p>
            <div className="bg-warm-bg dark:bg-dark rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-dark dark:text-white">Уведомления в MAX</div>
                  <div className="text-xs text-neutral dark:text-white/50 mt-0.5">Отправлять сообщение в чат бота MAX</div>
                </div>
                <button
                  onClick={() => toggleSetting("maxNotify")}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${settings.maxNotify ? "bg-primary" : "bg-gray-300 dark:bg-white/20"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.maxNotify ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Для работы уведомлений задайте переменные окружения <code className="bg-amber-100 dark:bg-amber-500/20 px-1 rounded">MAX_BOT_TOKEN</code> и <code className="bg-amber-100 dark:bg-amber-500/20 px-1 rounded">MAX_CHAT_ID</code> на сервере.
              </p>
            </div>

            {/* Max Broadcast */}
            <div className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Рассылка в Max</h3>
              <p className="text-sm text-gray-500 dark:text-white/40 mb-4">
                Отправить сообщение всем пользователям, привязавшим аккаунт Max.
              </p>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-shadow"
                rows={4}
                maxLength={2000}
                placeholder="Текст сообщения (поддерживается Markdown)"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-400 dark:text-white/30">{broadcastMessage.length}/2000</span>
                <button
                  onClick={async () => {
                    if (!broadcastMessage.trim()) return;
                    setBroadcastSending(true);
                    try {
                      const res = await fetch("/api/admin/broadcast", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "x-admin-password": password,
                        },
                        body: JSON.stringify({ message: broadcastMessage }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        setBroadcastResult(`Отправлено: ${data.sent} из ${data.total}`);
                        setBroadcastMessage("");
                      } else {
                        setBroadcastResult(data.error || "Ошибка отправки");
                      }
                    } catch {
                      setBroadcastResult("Ошибка сети");
                    } finally {
                      setBroadcastSending(false);
                      setTimeout(() => setBroadcastResult(""), 5000);
                    }
                  }}
                  disabled={broadcastSending || !broadcastMessage.trim()}
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {broadcastSending ? "Отправка..." : "Отправить всем"}
                </button>
              </div>
              {broadcastResult && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">{broadcastResult}</p>
              )}
            </div>
          </div>
        );

      case "contacts":
        return (
          <div className="max-w-lg">
            <h2 className="text-xl font-bold text-dark dark:text-white mb-1">Контакты компании</h2>
            <p className="text-sm text-neutral dark:text-white/50 mb-8">
              Информация о компании, отображаемая на сайте.
            </p>
            <div className="bg-warm-bg dark:bg-dark rounded-2xl p-5 space-y-4">
              <div>
                <label className="text-xs text-neutral dark:text-white/50 mb-1.5 block font-medium">Телефон</label>
                <Input
                  type="text"
                  placeholder="+7 (966) 730-30-03"
                  value={settings.companyPhone}
                  onChange={(e) => setSettings((prev) => ({ ...prev, companyPhone: e.target.value }))}
                  className="dark:bg-dark dark:border-white/10 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs text-neutral dark:text-white/50 mb-1.5 block font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="zakaz@csm-center.ru"
                  value={settings.companyEmail}
                  onChange={(e) => setSettings((prev) => ({ ...prev, companyEmail: e.target.value }))}
                  className="dark:bg-dark dark:border-white/10 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs text-neutral dark:text-white/50 mb-1.5 block font-medium">Адрес</label>
                <Input
                  type="text"
                  placeholder="г. Екатеринбург, ул. Маневровая, 9"
                  value={settings.companyAddress}
                  onChange={(e) => setSettings((prev) => ({ ...prev, companyAddress: e.target.value }))}
                  className="dark:bg-dark dark:border-white/10 dark:text-white"
                />
              </div>
              <button
                onClick={saveContacts}
                className={`w-full mt-2 py-2.5 rounded-xl text-sm font-semibold transition-shadow ${
                  contactsSaved
                    ? "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400"
                    : "bg-primary text-white hover:bg-primary-dark"
                }`}
              >
                {contactsSaved ? "Сохранено" : "Сохранить"}
              </button>
            </div>
          </div>
        );

      case "automation":
        return (
          <div className="max-w-lg">
            <h2 className="text-xl font-bold text-dark dark:text-white mb-1">Автоматизация</h2>
            <p className="text-sm text-neutral dark:text-white/50 mb-8">
              Автоматический поиск исполнителей и обработка входящей почты.
            </p>

            {/* IMAP Toggle */}
            <div className="bg-warm-bg dark:bg-dark rounded-2xl p-5 mb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-dark dark:text-white">IMAP-поллинг входящей почты</div>
                  <div className="text-xs text-neutral dark:text-white/50 mt-0.5">Автоматическая проверка ответов от исполнителей</div>
                </div>
                <button
                  onClick={() => {
                    const updated = { ...settings, imapEnabled: !settings.imapEnabled };
                    setSettings(updated);
                    saveSettings(updated);
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${settings.imapEnabled ? "bg-primary" : "bg-gray-300 dark:bg-white/20"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.imapEnabled ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
              {settings.imapEnabled && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                  <p className="text-xs text-neutral/60 dark:text-white/30">
                    Используется ящик из SMTP-настроек ({`SMTP_USER`})
                  </p>
                </div>
              )}
            </div>

            {/* Check interval */}
            <div className="bg-warm-bg dark:bg-dark rounded-2xl p-5 mb-4">
              <label className="text-sm font-semibold text-dark dark:text-white mb-2 block">Интервал проверки почты</label>
              <div className="flex gap-2">
                {["2", "5", "10"].map((val) => (
                  <button
                    key={val}
                    onClick={() => {
                      const updated = { ...settings, imapCheckInterval: val };
                      setSettings(updated);
                      saveSettings(updated);
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      settings.imapCheckInterval === val
                        ? "bg-primary text-white"
                        : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/20"
                    }`}
                  >
                    {val} мин
                  </button>
                ))}
              </div>
            </div>

            {/* Default markup */}
            <div className="bg-warm-bg dark:bg-dark rounded-2xl p-5">
              <label className="text-sm font-semibold text-dark dark:text-white mb-2 block">Наценка по умолчанию (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={settings.defaultMarkup}
                onChange={(e) => setSettings((prev) => ({ ...prev, defaultMarkup: e.target.value }))}
                onBlur={(e) => saveSettings({ ...settings, defaultMarkup: e.target.value })}
                className="w-32 dark:bg-dark dark:border-white/10 dark:text-white"
              />
              <p className="text-xs text-neutral/60 dark:text-white/30 mt-1.5">Применяется при автоматическом создании счёта клиенту</p>
            </div>
          </div>
        );

      case "templates":
        return (
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold text-dark dark:text-white mb-1">Шаблоны email-уведомлений</h2>
            <p className="text-sm text-neutral dark:text-white/50 mb-6">
              Текст email-сообщений, отправляемых клиентам при смене статуса заявки. Переменные: <code className="bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-xs">{"{name}"}</code> <code className="bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-xs">{"{id}"}</code> <code className="bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-xs">{"{status}"}</code>
            </p>

            <div className="space-y-4">
              {([
                { key: "template_new" as const, label: "Новая", color: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" },
                { key: "template_in_progress" as const, label: "В работе", color: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300" },
                { key: "template_pending_payment" as const, label: "Ожидает оплаты", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300" },
                { key: "template_review" as const, label: "На проверке", color: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300" },
                { key: "template_done" as const, label: "Завершена", color: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300" },
                { key: "template_cancelled" as const, label: "Отменена", color: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300" },
              ]).map(({ key, label, color }) => (
                <div key={key} className="bg-warm-bg dark:bg-dark rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{label}</span>
                  </div>
                  <textarea
                    value={settings[key]}
                    onChange={(e) => setSettings((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder={`Текст уведомления для статуса «${label}»... Пусто = шаблон по умолчанию`}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-shadow"
                    rows={2}
                  />
                </div>
              ))}
            </div>

            {/* Response templates (quick-insert in admin notes) */}
            <h3 className="text-lg font-bold text-dark dark:text-white mt-8 mb-1">Шаблоны быстрых ответов</h3>
            <p className="text-sm text-neutral dark:text-white/50 mb-4">
              Быстрые шаблоны для заметок в заявках (кнопки в карточке заявки).
            </p>
            <div className="space-y-3">
              {responseTemplates.map((tmpl, idx) => (
                <div key={idx} className="bg-warm-bg dark:bg-dark rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Input
                      value={tmpl.label}
                      onChange={(e) => {
                        const updated = [...responseTemplates];
                        updated[idx] = { ...updated[idx], label: e.target.value };
                        setResponseTemplates(updated);
                      }}
                      placeholder="Название шаблона"
                      className="flex-1 text-sm dark:bg-white/5 dark:border-white/10 dark:text-white"
                    />
                    <button
                      onClick={() => setResponseTemplates((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <textarea
                    value={tmpl.text}
                    onChange={(e) => {
                      const updated = [...responseTemplates];
                      updated[idx] = { ...updated[idx], text: e.target.value };
                      setResponseTemplates(updated);
                    }}
                    placeholder="Текст шаблона..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-shadow"
                    rows={2}
                  />
                </div>
              ))}
              <button
                onClick={() => setResponseTemplates((prev) => [...prev, { label: "", text: "" }])}
                className="w-full py-2 rounded-xl border-2 border-dashed border-gray-300 dark:border-white/20 text-sm text-neutral dark:text-white/50 hover:border-primary hover:text-primary transition-colors"
              >
                + Добавить шаблон
              </button>
            </div>

            <button
              onClick={async () => {
                const updated = { ...settings, response_templates: JSON.stringify(responseTemplates) };
                await saveSettings(updated);
                setSettings(updated);
                setTemplatesSaved(true);
                setTimeout(() => setTemplatesSaved(false), 2000);
              }}
              className={`w-full mt-6 py-2.5 rounded-xl text-sm font-semibold transition-shadow ${
                templatesSaved
                  ? "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400"
                  : "bg-primary text-white hover:bg-primary-dark"
              }`}
            >
              {templatesSaved ? "Сохранено" : "Сохранить все шаблоны"}
            </button>
          </div>
        );

      case "security":
        return (
          <div className="max-w-lg">
            <h2 className="text-xl font-bold text-dark dark:text-white mb-1">Безопасность</h2>
            <p className="text-sm text-neutral dark:text-white/50 mb-8">
              Управление паролем доступа к администрационной панели.
            </p>
            <div className="bg-warm-bg dark:bg-dark rounded-2xl p-5 space-y-4">
              <div>
                <label className="text-xs text-neutral dark:text-white/50 mb-1.5 block font-medium">Новый пароль</label>
                <Input
                  type="password"
                  placeholder="Минимум 4 символа"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); setPasswordSuccess(false); }}
                  className="dark:bg-dark dark:border-white/10 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs text-neutral dark:text-white/50 mb-1.5 block font-medium">Повторите пароль</label>
                <Input
                  type="password"
                  placeholder="Повторите новый пароль"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); setPasswordSuccess(false); }}
                  className="dark:bg-dark dark:border-white/10 dark:text-white"
                />
              </div>
              {passwordError && <p className="text-xs text-red-500 dark:text-red-400">{passwordError}</p>}
              {passwordSuccess && <p className="text-xs text-green-600 dark:text-green-400">Пароль успешно изменён</p>}
              {!passwordConfirming ? (
                <button
                  onClick={() => {
                    setPasswordError("");
                    if (newPassword.length < 8) {
                      setPasswordError("Пароль должен быть не менее 8 символов");
                      return;
                    }
                    if (newPassword !== confirmPassword) {
                      setPasswordError("Пароли не совпадают");
                      return;
                    }
                    setPasswordConfirming(true);
                  }}
                  className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
                >
                  Сменить пароль
                </button>
              ) : (
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-red-600 dark:text-red-400 flex-shrink-0">Вы уверены?</span>
                  <button
                    onClick={changePassword}
                    className="flex-1 bg-red-500 text-white py-2 rounded-xl text-xs font-semibold hover:bg-red-600 transition-colors"
                  >
                    Да, сменить
                  </button>
                  <button
                    onClick={() => setPasswordConfirming(false)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-white/70 hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex bg-white dark:bg-dark-light rounded-3xl shadow-xl overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 bg-warm-bg dark:bg-dark flex-shrink-0">
          <div className="p-6">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <span className="text-sm font-bold text-dark dark:text-white">Настройки</span>
            </div>
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                    activeTab === tab.id
                      ? "bg-primary text-white shadow-md"
                      : "text-dark dark:text-white/70 hover:bg-white/60 dark:hover:bg-white/5"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 p-8 min-h-[440px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
