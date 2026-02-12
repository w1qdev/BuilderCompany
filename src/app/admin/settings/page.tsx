"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
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
}

type TabId = "email" | "confirmation" | "telegram" | "max" | "contacts" | "security";

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
  const router = useRouter();
  const [password, setPassword] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>({
    emailNotifyAdmin: true,
    emailNotifyCustomer: true,
    telegramNotify: true,
    maxNotify: false,
    notifyEmail: "",
    companyPhone: "",
    companyEmail: "",
    companyAddress: "",
  });
  const [activeTab, setActiveTab] = useState<TabId>("email");
  const [loading, setLoading] = useState(true);
  const [contactsSaved, setContactsSaved] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordConfirming, setPasswordConfirming] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("admin-password");
    if (!stored) {
      router.push("/admin");
      return;
    }
    setPassword(stored);
    fetch("/api/admin/settings", { headers: { "x-admin-password": stored } })
      .then((res) => {
        if (res.status === 401) {
          sessionStorage.removeItem("admin-password");
          router.push("/admin");
          throw new Error("unauthorized");
        }
        return res.json();
      })
      .then((data) => setSettings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const saveSettings = useCallback(
    async (updated: Settings) => {
      if (!password) return;
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
    if (newPassword.length < 4) {
      setPasswordError("Пароль должен быть не менее 4 символов");
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
          "x-admin-password": password!,
        },
        body: JSON.stringify({ newPassword }),
      });
      if (res.ok) {
        sessionStorage.setItem("admin-password", newPassword);
        setPassword(newPassword);
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
      <div className="min-h-screen bg-warm-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "email":
        return (
          <div className="max-w-lg">
            <h2 className="text-xl font-bold text-dark mb-1">Email уведомления</h2>
            <p className="text-sm text-neutral mb-8">
              Настройте получение уведомлений по электронной почте о новых заявках от клиентов.
            </p>
            <div className="bg-warm-bg rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-dark">Уведомления по email</div>
                  <div className="text-xs text-neutral mt-0.5">Получать письма о новых заявках</div>
                </div>
                <button
                  onClick={() => toggleSetting("emailNotifyAdmin")}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${settings.emailNotifyAdmin ? "bg-primary" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.emailNotifyAdmin ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
              {settings.emailNotifyAdmin && (
                <div className="mt-5 pt-4 border-t border-gray-200">
                  <label className="text-xs text-neutral mb-1.5 block font-medium">Адрес для уведомлений</label>
                  <Input
                    type="email"
                    placeholder="admin@company.com"
                    value={settings.notifyEmail}
                    onChange={(e) => setSettings((prev) => ({ ...prev, notifyEmail: e.target.value }))}
                    onBlur={(e) => saveSettings({ ...settings, notifyEmail: e.target.value })}
                  />
                  <p className="text-xs text-neutral/60 mt-1.5">Если пусто — используется NOTIFY_EMAIL из окружения</p>
                </div>
              )}
            </div>
          </div>
        );

      case "confirmation":
        return (
          <div className="max-w-lg">
            <h2 className="text-xl font-bold text-dark mb-1">Подтверждение заявки</h2>
            <p className="text-sm text-neutral mb-8">
              Автоматическое уведомление клиентов о принятии их заявки.
            </p>
            <div className="bg-warm-bg rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-dark">Подтверждение заявки</div>
                  <div className="text-xs text-neutral mt-0.5">Отправлять клиенту письмо о принятии заявки</div>
                </div>
                <button
                  onClick={() => toggleSetting("emailNotifyCustomer")}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${settings.emailNotifyCustomer ? "bg-primary" : "bg-gray-300"}`}
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
            <h2 className="text-xl font-bold text-dark mb-1">Telegram уведомления</h2>
            <p className="text-sm text-neutral mb-8">
              Отправка уведомлений о новых заявках в Telegram-чат бота.
            </p>
            <div className="bg-warm-bg rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-dark">Уведомления в Telegram</div>
                  <div className="text-xs text-neutral mt-0.5">Отправлять сообщение в чат бота</div>
                </div>
                <button
                  onClick={() => toggleSetting("telegramNotify")}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${settings.telegramNotify ? "bg-primary" : "bg-gray-300"}`}
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
            <h2 className="text-xl font-bold text-dark mb-1">MAX уведомления</h2>
            <p className="text-sm text-neutral mb-8">
              Отправка уведомлений о новых заявках в мессенджер MAX.
            </p>
            <div className="bg-warm-bg rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-dark">Уведомления в MAX</div>
                  <div className="text-xs text-neutral mt-0.5">Отправлять сообщение в чат бота MAX</div>
                </div>
                <button
                  onClick={() => toggleSetting("maxNotify")}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${settings.maxNotify ? "bg-primary" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.maxNotify ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
            <div className="mt-6 p-4 bg-amber-50 rounded-xl">
              <p className="text-xs text-amber-700">
                Для работы уведомлений задайте переменные окружения <code className="bg-amber-100 px-1 rounded">MAX_BOT_TOKEN</code> и <code className="bg-amber-100 px-1 rounded">MAX_CHAT_ID</code> на сервере.
              </p>
            </div>
          </div>
        );

      case "contacts":
        return (
          <div className="max-w-lg">
            <h2 className="text-xl font-bold text-dark mb-1">Контакты компании</h2>
            <p className="text-sm text-neutral mb-8">
              Информация о компании, отображаемая на сайте.
            </p>
            <div className="bg-warm-bg rounded-2xl p-5 space-y-4">
              <div>
                <label className="text-xs text-neutral mb-1.5 block font-medium">Телефон</label>
                <Input
                  type="text"
                  placeholder="+7 (966) 730-30-03"
                  value={settings.companyPhone}
                  onChange={(e) => setSettings((prev) => ({ ...prev, companyPhone: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-neutral mb-1.5 block font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="zakaz@csm-center.ru"
                  value={settings.companyEmail}
                  onChange={(e) => setSettings((prev) => ({ ...prev, companyEmail: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-neutral mb-1.5 block font-medium">Адрес</label>
                <Input
                  type="text"
                  placeholder="г. Екатеринбург, ул. Маневровая, 9"
                  value={settings.companyAddress}
                  onChange={(e) => setSettings((prev) => ({ ...prev, companyAddress: e.target.value }))}
                />
              </div>
              <button
                onClick={saveContacts}
                className={`w-full mt-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  contactsSaved
                    ? "bg-green-100 text-green-600"
                    : "gradient-primary text-white hover:shadow-lg hover:shadow-primary/30"
                }`}
              >
                {contactsSaved ? "Сохранено" : "Сохранить"}
              </button>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="max-w-lg">
            <h2 className="text-xl font-bold text-dark mb-1">Безопасность</h2>
            <p className="text-sm text-neutral mb-8">
              Управление паролем доступа к администрационной панели.
            </p>
            <div className="bg-warm-bg rounded-2xl p-5 space-y-4">
              <div>
                <label className="text-xs text-neutral mb-1.5 block font-medium">Новый пароль</label>
                <Input
                  type="password"
                  placeholder="Минимум 4 символа"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); setPasswordSuccess(false); }}
                />
              </div>
              <div>
                <label className="text-xs text-neutral mb-1.5 block font-medium">Повторите пароль</label>
                <Input
                  type="password"
                  placeholder="Повторите новый пароль"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); setPasswordSuccess(false); }}
                />
              </div>
              {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
              {passwordSuccess && <p className="text-xs text-green-600">Пароль успешно изменён</p>}
              {!passwordConfirming ? (
                <button
                  onClick={() => {
                    setPasswordError("");
                    if (newPassword.length < 4) {
                      setPasswordError("Пароль должен быть не менее 4 символов");
                      return;
                    }
                    if (newPassword !== confirmPassword) {
                      setPasswordError("Пароли не совпадают");
                      return;
                    }
                    setPasswordConfirming(true);
                  }}
                  className="w-full gradient-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all"
                >
                  Сменить пароль
                </button>
              ) : (
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-red-600 flex-shrink-0">Вы уверены?</span>
                  <button
                    onClick={changePassword}
                    className="flex-1 bg-red-500 text-white py-2 rounded-xl text-xs font-semibold hover:bg-red-600 transition-colors"
                  >
                    Да, сменить
                  </button>
                  <button
                    onClick={() => setPasswordConfirming(false)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
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
    <div className="min-h-screen bg-warm-bg">
      {/* Header */}
      <div className="gradient-dark text-white">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/admin" className="flex items-center gap-2">
              <Logo size="sm" />
            </a>
            <span className="text-white/40 text-sm">/ Настройки</span>
          </div>
          <a href="/admin" className="text-sm text-white/60 hover:text-white transition-colors">
            ← Вернуться
          </a>
        </div>
      </div>

      {/* Settings Layout */}
      <div className="py-8 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="flex bg-white rounded-3xl shadow-xl overflow-hidden">
            {/* Sidebar */}
            <aside className="w-56 bg-warm-bg flex-shrink-0">
              <div className="p-6">
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-dark">Настройки</span>
                </div>
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                        activeTab === tab.id
                          ? "gradient-primary text-white shadow-md"
                          : "text-dark hover:bg-white/60"
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
              {renderContent()}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
