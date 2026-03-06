"use client";

import { useTheme } from "@/components/ThemeProvider";
import { lightThemes, darkThemes } from "@/lib/themes";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface UserInfo {
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  inn: string | null;
  kpp: string | null;
  legalName: string | null;
  legalAddress: string | null;
  avatar: string | null;
  coverImage: string | null;
  position: string | null;
  timezone: string | null;
  createdAt: string;
}

type Tab = "profile" | "appearance" | "notifications" | "security";

const tabs: { id: Tab; label: string; icon: string }[] = [
  {
    id: "profile",
    label: "Личные данные",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  },
  {
    id: "appearance",
    label: "Оформление",
    icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
  },
  {
    id: "notifications",
    label: "Уведомления",
    icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  },
  {
    id: "security",
    label: "Безопасность",
    icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  },
];

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow";

export default function ProfilePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const [companyForm, setCompanyForm] = useState({
    name: "", phone: "", company: "", inn: "", kpp: "", legalName: "", legalAddress: "", position: "", timezone: "Europe/Moscow",
  });
  const [savingCompany, setSavingCompany] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "", newPassword: "", confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const { theme: currentTheme, setTheme } = useTheme();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setCompanyForm({
            name: data.user.name || "",
            phone: data.user.phone || "",
            company: data.user.company || "",
            inn: data.user.inn || "",
            kpp: data.user.kpp || "",
            legalName: data.user.legalName || "",
            legalAddress: data.user.legalAddress || "",
            position: data.user.position || "",
            timezone: data.user.timezone || "Europe/Moscow",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCompany(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyForm),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Ошибка сохранения"); return; }
      setUser((u) => u ? { ...u, ...data.user } : u);
      toast.success("Данные сохранены");
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setSavingCompany(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 8) { toast.error("Пароль должен быть не менее 8 символов"); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error("Пароли не совпадают"); return; }
    setShowPasswordConfirm(true);
  };

  const executePasswordChange = async () => {
    setShowPasswordConfirm(false);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Ошибка при смене пароля"); return; }
      toast.success("Пароль успешно изменён");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      toast.error("Ошибка соединения с сервером");
    } finally {
      setSubmitting(false);
    }
  };

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [coverLoaded, setCoverLoaded] = useState(false);

  // Reset loaded state when URL changes (new upload)
  useEffect(() => { setAvatarLoaded(false); }, [user?.avatar]);
  useEffect(() => { setCoverLoaded(false); }, [user?.coverImage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" role="status" aria-label="Загрузка">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-xs text-gray-500 dark:text-white/50">Загрузка...</span>
        </div>
      </div>
    );
  }

  const uploadImage = async (file: File, type: "avatar" | "cover") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    try {
      const res = await fetch("/api/auth/avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Ошибка загрузки"); return; }
      setUser((u) => u ? { ...u, [type === "cover" ? "coverImage" : "avatar"]: data.url } : u);
      toast.success(type === "cover" ? "Обложка обновлена" : "Аватар обновлён");
    } catch {
      toast.error("Ошибка сети");
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "cover") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Максимум 5 МБ"); return; }
    uploadImage(file, type);
    e.target.value = "";
  };

  if (!user) return null;

  const joinDate = (() => {
    const d = new Date(user.createdAt);
    const months = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  })();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Hidden file inputs */}
      <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleImageSelect(e, "avatar")} />
      <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleImageSelect(e, "cover")} />

      {/* Hero Card */}
      <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm overflow-hidden">
        {/* Banner */}
        <div
          className="h-32 sm:h-40 relative group cursor-pointer"
          onClick={() => coverInputRef.current?.click()}
        >
          <div className="w-full h-full gradient-primary" />
          {user.coverImage && (
            <img
              src={user.coverImage}
              alt=""
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${coverLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setCoverLoaded(true)}
            />
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white flex items-center gap-2 text-sm font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Изменить обложку
            </div>
          </div>
        </div>

        {/* Avatar + Info */}
        <div className="relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-14">
            {/* Avatar */}
            <div
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white dark:bg-dark-light border-4 border-white dark:border-dark-light shadow-lg flex items-center justify-center shrink-0 relative group cursor-pointer overflow-hidden"
              onClick={() => avatarInputRef.current?.click()}
            >
              <span className="text-3xl sm:text-4xl font-bold text-primary">
                {user.name.charAt(0).toUpperCase()}
              </span>
              {user.avatar && (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${avatarLoaded ? "opacity-100" : "opacity-0"}`}
                  onLoad={() => setAvatarLoaded(true)}
                />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>

            {/* User Info — name pushed below avatar row */}
            <div className="flex-1 min-w-0 pb-1" />
          </div>
          <div className="mt-3 px-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
              {user.name}
            </h1>
            {user.position && (
              <p className="text-sm text-gray-500 dark:text-white/50 mt-0.5">{user.position}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
              {user.company && (
                <span className="text-sm text-gray-500 dark:text-white/50 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {user.company}
                </span>
              )}
              <span className="text-sm text-gray-500 dark:text-white/50 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {user.email}
              </span>
              <span className="text-sm text-gray-500 dark:text-white/50 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Участник с {joinDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm">
        <div className="flex border-b border-gray-200 dark:border-white/10 px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-primary"
                  : "text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white/70"
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tab.icon} />
              </svg>
              <span className="hidden sm:inline">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="profile-tab-indicator"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <ProfileTab
                  user={user}
                  companyForm={companyForm}
                  setCompanyForm={setCompanyForm}
                  savingCompany={savingCompany}
                  onSave={handleSaveCompany}
                />
              </motion.div>
            )}
            {activeTab === "appearance" && (
              <motion.div
                key="appearance"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <AppearanceTab currentTheme={currentTheme} setTheme={setTheme} />
              </motion.div>
            )}
            {activeTab === "notifications" && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <NotificationsTab />
              </motion.div>
            )}
            {activeTab === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <SecurityTab
                  passwordForm={passwordForm}
                  setPasswordForm={setPasswordForm}
                  submitting={submitting}
                  showPasswordConfirm={showPasswordConfirm}
                  setShowPasswordConfirm={setShowPasswordConfirm}
                  showCurrentPassword={showCurrentPassword}
                  setShowCurrentPassword={setShowCurrentPassword}
                  showNewPassword={showNewPassword}
                  setShowNewPassword={setShowNewPassword}
                  showConfirmPassword={showConfirmPassword}
                  setShowConfirmPassword={setShowConfirmPassword}
                  onSubmit={handleChangePassword}
                  onConfirm={executePasswordChange}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ============ Profile Tab ============ */

function ProfileTab({
  user,
  companyForm,
  setCompanyForm,
  savingCompany,
  onSave,
}: {
  user: UserInfo;
  companyForm: { name: string; phone: string; company: string; inn: string; kpp: string; legalName: string; legalAddress: string; position: string; timezone: string };
  setCompanyForm: React.Dispatch<React.SetStateAction<typeof companyForm>>;
  savingCompany: boolean;
  onSave: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSave} className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Основная информация</h3>
        <p className="text-sm text-gray-500 dark:text-white/40 mb-4">Email нельзя изменить</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">ФИО</label>
          <input type="text" value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} className={inputClass} placeholder="Иванов Иван Иванович" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Телефон</label>
          <input type="tel" value={companyForm.phone} onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })} className={inputClass} placeholder="+7 (999) 000-00-00" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Должность</label>
          <input type="text" value={companyForm.position} onChange={(e) => setCompanyForm({ ...companyForm, position: e.target.value })} className={inputClass} placeholder="Главный метролог" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Часовой пояс</label>
          <select value={companyForm.timezone} onChange={(e) => setCompanyForm({ ...companyForm, timezone: e.target.value })} className={inputClass}>
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Email</label>
        <input type="email" value={user.email} readOnly className={`${inputClass} opacity-60 cursor-not-allowed`} />
      </div>

      <div className="border-t border-gray-100 dark:border-white/10 pt-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Данные организации</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Краткое наименование</label>
            <input type="text" value={companyForm.company} onChange={(e) => setCompanyForm({ ...companyForm, company: e.target.value })} className={inputClass} placeholder="ООО Компания" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Полное наименование</label>
            <input type="text" value={companyForm.legalName} onChange={(e) => setCompanyForm({ ...companyForm, legalName: e.target.value })} className={inputClass} placeholder="Общество с ограниченной ответственностью «Компания»" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">ИНН</label>
              <input type="text" value={companyForm.inn} onChange={(e) => setCompanyForm({ ...companyForm, inn: e.target.value })} className={inputClass} placeholder="1234567890" maxLength={12} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">КПП</label>
              <input type="text" value={companyForm.kpp} onChange={(e) => setCompanyForm({ ...companyForm, kpp: e.target.value })} className={inputClass} placeholder="123456789" maxLength={9} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Юридический адрес</label>
            <input type="text" value={companyForm.legalAddress} onChange={(e) => setCompanyForm({ ...companyForm, legalAddress: e.target.value })} className={inputClass} placeholder="123456, г. Москва, ул. Примерная, д. 1" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap pt-2">
        <button type="submit" disabled={savingCompany} className="bg-primary text-primary-foreground py-2 px-4 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50">
          {savingCompany ? "Сохранение..." : "Сохранить данные"}
        </button>
        <button
          type="button"
          onClick={() => {
            const data = JSON.stringify(companyForm, null, 2);
            const blob = new Blob([data], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "profile-settings.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="py-2 px-3.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          Экспорт
        </button>
        <label className="py-2 px-3.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
          Импорт
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                try {
                  const imported = JSON.parse(ev.target?.result as string);
                  setCompanyForm((prev) => ({ ...prev, ...imported }));
                  toast.success("Настройки загружены — нажмите «Сохранить» для применения");
                } catch {
                  toast.error("Ошибка чтения файла");
                }
              };
              reader.readAsText(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    </form>
  );
}

/* ============ Appearance Tab ============ */

function AppearanceTab({
  currentTheme,
  setTheme,
}: {
  currentTheme: string;
  setTheme: (id: string) => void;
}) {
  const renderThemeGrid = (themeList: typeof lightThemes) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {themeList.map((t) => {
        const active = currentTheme === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`group relative rounded-xl overflow-hidden border-2 transition-shadow ${
              active
                ? "border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/30"
                : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
            }`}
          >
            <div className="aspect-[4/3] relative" style={{ backgroundColor: t.preview.bg }}>
              <div className="h-5 w-full" style={{ backgroundColor: t.preview.primary }} />
              <div className="px-2 pt-2 space-y-1.5">
                <div className="flex gap-1.5">
                  <div className="h-2 rounded-full flex-1" style={{ backgroundColor: t.preview.primary, opacity: 0.8 }} />
                  <div className="h-2 rounded-full w-4" style={{ backgroundColor: t.preview.text, opacity: 0.15 }} />
                </div>
                <div className="flex gap-1.5">
                  <div className="h-6 rounded" style={{ backgroundColor: t.preview.card, flex: 1, border: `1px solid ${t._needsDarkClass ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }} />
                  <div className="h-6 rounded" style={{ backgroundColor: t.preview.card, flex: 1, border: `1px solid ${t._needsDarkClass ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }} />
                </div>
                <div className="h-2 w-3/4 rounded-full" style={{ backgroundColor: t.preview.text, opacity: 0.12 }} />
              </div>
              {active && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            <div className="px-2 py-2 bg-white dark:bg-dark-light">
              <span className={`text-xs font-medium block truncate ${active ? "text-primary" : "text-gray-900 dark:text-white/70"}`}>
                {t.name}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Тема оформления</h3>
      <p className="text-sm text-gray-500 dark:text-white/40 mb-6">
        Выберите тему — она применится мгновенно
      </p>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Светлые темы</h4>
          <span className="text-xs text-gray-500 dark:text-white/40">({lightThemes.length})</span>
        </div>
        {renderThemeGrid(lightThemes)}
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Тёмные темы</h4>
          <span className="text-xs text-gray-500 dark:text-white/40">({darkThemes.length})</span>
        </div>
        {renderThemeGrid(darkThemes)}
      </div>

      <div className="border-t border-gray-100 dark:border-white/10 pt-6 space-y-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Размер шрифта</h3>
          <p className="text-sm text-gray-500 dark:text-white/40 mb-3">Изменяет базовый размер текста в дашборде</p>
          <FontSizePicker />
        </div>

        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Компактный режим</h3>
          <p className="text-sm text-gray-500 dark:text-white/40 mb-3">Меньше отступов — больше данных на экране</p>
          <CompactToggle />
        </div>
      </div>
    </div>
  );
}

const FONT_SIZES = [
  { id: "small", label: "Мелкий", value: "14px" },
  { id: "medium", label: "Средний", value: "16px" },
  { id: "large", label: "Крупный", value: "18px" },
];

function FontSizePicker() {
  const [size, setSize] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("fontSize") || "medium";
    return "medium";
  });

  const apply = (id: string) => {
    setSize(id);
    const fs = FONT_SIZES.find((f) => f.id === id);
    if (fs) {
      document.documentElement.style.setProperty("--font-size-base", fs.value);
      localStorage.setItem("fontSize", id);
    }
  };

  return (
    <div className="flex gap-2">
      {FONT_SIZES.map((fs) => (
        <button
          key={fs.id}
          onClick={() => apply(fs.id)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            size === fs.id
              ? "bg-primary text-primary-foreground"
              : "bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/10"
          }`}
        >
          {fs.label}
        </button>
      ))}
    </div>
  );
}

function CompactToggle() {
  const [compact, setCompact] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("compactMode") === "true";
    return false;
  });

  const toggle = () => {
    const next = !compact;
    setCompact(next);
    document.documentElement.classList.toggle("compact", next);
    localStorage.setItem("compactMode", String(next));
  };

  return (
    <button
      onClick={toggle}
      className={`relative w-11 h-6 rounded-full transition-colors ${compact ? "bg-primary" : "bg-gray-300 dark:bg-white/20"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${compact ? "translate-x-5" : ""}`} />
    </button>
  );
}

/* ============ Security Tab ============ */

function SecurityTab({
  passwordForm,
  setPasswordForm,
  submitting,
  showPasswordConfirm,
  setShowPasswordConfirm,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  onSubmit,
  onConfirm,
}: {
  passwordForm: { currentPassword: string; newPassword: string; confirmPassword: string };
  setPasswordForm: React.Dispatch<React.SetStateAction<typeof passwordForm>>;
  submitting: boolean;
  showPasswordConfirm: boolean;
  setShowPasswordConfirm: (v: boolean) => void;
  showCurrentPassword: boolean;
  setShowCurrentPassword: (v: boolean) => void;
  showNewPassword: boolean;
  setShowNewPassword: (v: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (v: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onConfirm: () => void;
}) {
  const EyeIcon = ({ show }: { show: boolean }) =>
    show ? (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
    ) : (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
    );

  return (
    <div className="space-y-8">
      {/* Change password */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Смена пароля</h3>
        {showPasswordConfirm ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-5 space-y-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Вы уверены, что хотите сменить пароль?</p>
            <div className="flex gap-3">
              <button onClick={onConfirm} disabled={submitting} className="bg-primary text-primary-foreground py-2 px-4 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50">
                {submitting ? "Сохранение..." : "Подтвердить"}
              </button>
              <button onClick={() => setShowPasswordConfirm(false)} className="py-2 px-4 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Текущий пароль</label>
              <div className="relative">
                <input type={showCurrentPassword ? "text" : "password"} value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} className={inputClass} placeholder="Введите текущий пароль" required />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white/70 transition-colors" tabIndex={-1}>
                  <EyeIcon show={showCurrentPassword} />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Новый пароль</label>
              <div className="relative">
                <input type={showNewPassword ? "text" : "password"} value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className={inputClass} placeholder="Минимум 8 символов" required minLength={8} />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white/70 transition-colors" tabIndex={-1}>
                  <EyeIcon show={showNewPassword} />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Подтверждение пароля</label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} className={inputClass} placeholder="Повторите новый пароль" required minLength={8} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white/70 transition-colors" tabIndex={-1}>
                  <EyeIcon show={showConfirmPassword} />
                </button>
              </div>
            </div>
            <button type="submit" disabled={submitting} className="bg-primary text-primary-foreground py-2 px-4 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50">
              {submitting ? "Сохранение..." : "Сменить пароль"}
            </button>
          </form>
        )}
      </div>

      <div className="border-t border-gray-100 dark:border-white/10" />

      {/* Active sessions */}
      <SessionsSection />

      <div className="border-t border-gray-100 dark:border-white/10" />

      {/* Login history */}
      <LoginHistorySection />

      <div className="border-t border-gray-100 dark:border-white/10" />

      {/* Delete account */}
      <DeleteAccountSection />
    </div>
  );
}

const TIMEZONES = [
  { value: "Europe/Kaliningrad", label: "Калининград (UTC+2)" },
  { value: "Europe/Moscow", label: "Москва (UTC+3)" },
  { value: "Europe/Samara", label: "Самара (UTC+4)" },
  { value: "Asia/Yekaterinburg", label: "Екатеринбург (UTC+5)" },
  { value: "Asia/Omsk", label: "Омск (UTC+6)" },
  { value: "Asia/Krasnoyarsk", label: "Красноярск (UTC+7)" },
  { value: "Asia/Irkutsk", label: "Иркутск (UTC+8)" },
  { value: "Asia/Yakutsk", label: "Якутск (UTC+9)" },
  { value: "Asia/Vladivostok", label: "Владивосток (UTC+10)" },
  { value: "Asia/Magadan", label: "Магадан (UTC+11)" },
  { value: "Asia/Kamchatka", label: "Камчатка (UTC+12)" },
];

/* ============ Notifications Tab ============ */

const NOTIFY_OPTIONS = [
  { value: "30", label: "За 30 дней" },
  { value: "14", label: "За 14 дней" },
  { value: "7", label: "За 7 дней" },
  { value: "3", label: "За 3 дня" },
  { value: "1", label: "За 1 день" },
];

function NotificationsTab() {
  const [notifyDays, setNotifyDays] = useState<string[]>(["30", "14", "7"]);
  const [telegramChatId, setTelegramChatId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maxLinked, setMaxLinked] = useState(false);
  const [maxCode, setMaxCode] = useState<string | null>(null);
  const [maxCodeExpiry, setMaxCodeExpiry] = useState<Date | null>(null);
  const [maxLoading, setMaxLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.notifyDays) setNotifyDays(data.user.notifyDays.split(",").filter(Boolean));
        if (data.user?.telegramChatId) setTelegramChatId(data.user.telegramChatId);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/user/max-link").then(r => r.json()).then(data => {
      if (data.linked) setMaxLinked(true);
    });
  }, []);

  const toggle = (value: string) => {
    setNotifyDays((prev) => prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifyDays: notifyDays.join(","), telegramChatId: telegramChatId || null }),
      });
      if (!res.ok) { toast.error("Ошибка сохранения"); return; }
      toast.success("Настройки сохранены");
    } catch { toast.error("Ошибка сети"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="text-sm text-gray-500 dark:text-white/50">Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Напоминания о поверке</h3>
        <p className="text-sm text-gray-500 dark:text-white/40 mb-4">За сколько дней до поверки напоминать</p>
        <div className="flex flex-wrap gap-2">
          {NOTIFY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                notifyDays.includes(opt.value)
                  ? "bg-primary text-primary-foreground"
                  : "bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/10"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-white/10" />

      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Telegram</h3>
        <p className="text-sm text-gray-500 dark:text-white/40 mb-3">
          Привяжите Telegram для получения уведомлений. Напишите нашему боту, чтобы получить Chat ID.
        </p>
        <input
          type="text"
          value={telegramChatId}
          onChange={(e) => setTelegramChatId(e.target.value)}
          className={inputClass}
          placeholder="Telegram Chat ID"
        />
      </div>

      <div className="border-t border-gray-100 dark:border-white/10" />

      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Max Messenger</h3>
        <p className="text-sm text-gray-500 dark:text-white/40 mb-3">
          Привяжите аккаунт Max для получения уведомлений о статусе заявок.
        </p>
        {maxLinked ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">Аккаунт привязан</span>
            <button
              onClick={async () => {
                await fetch("/api/user/max-link", { method: "DELETE" });
                setMaxLinked(false);
                toast.success("Аккаунт Max отвязан");
              }}
              className="text-sm text-red-500 hover:text-red-600 transition-colors"
            >
              Отвязать
            </button>
          </div>
        ) : maxCode ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <code className="bg-gray-100 dark:bg-white/10 px-4 py-2 rounded-lg text-lg font-mono font-bold tracking-widest text-gray-900 dark:text-white">
                {maxCode}
              </code>
            </div>
            <p className="text-xs text-gray-500 dark:text-white/40">
              Отправьте этот код боту в Max Messenger. Код действителен 5 минут.
            </p>
          </div>
        ) : (
          <button
            onClick={async () => {
              setMaxLoading(true);
              try {
                const res = await fetch("/api/user/max-link", { method: "POST" });
                const data = await res.json();
                if (data.code) {
                  setMaxCode(data.code);
                  setMaxCodeExpiry(new Date(data.expiresAt));
                  // Auto-clear code after 5 minutes
                  setTimeout(() => setMaxCode(null), 5 * 60 * 1000);
                }
              } catch { toast.error("Ошибка получения кода"); }
              finally { setMaxLoading(false); }
            }}
            disabled={maxLoading}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {maxLoading ? "Загрузка..." : "Получить код привязки"}
          </button>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-primary text-primary-foreground py-2 px-4 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
      >
        {saving ? "Сохранение..." : "Сохранить настройки"}
      </button>
    </div>
  );
}

/* ============ Sessions Section ============ */

interface SessionInfo {
  id: number;
  ip: string | null;
  userAgent: string | null;
  lastUsedAt: string;
  createdAt: string;
  isCurrent: boolean;
}

function parseUA(ua: string | null): string {
  if (!ua) return "Неизвестное устройство";
  if (ua.includes("Mobile")) return "Мобильный браузер";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  return "Браузер";
}

function SessionsSection() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/sessions")
      .then((r) => r.json())
      .then((data) => { if (data.sessions) setSessions(data.sessions); })
      .finally(() => setLoading(false));
  }, []);

  const revoke = async (id: number) => {
    try {
      const res = await fetch("/api/auth/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id }),
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        toast.success("Сессия завершена");
      }
    } catch { toast.error("Ошибка"); }
  };

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Активные сессии</h3>
      <p className="text-sm text-gray-500 dark:text-white/40 mb-4">Устройства, на которых вы вошли в аккаунт</p>

      {loading ? (
        <div className="text-sm text-gray-500 dark:text-white/50">Загрузка...</div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-white/40">Нет активных сессий</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{parseUA(s.userAgent)}</span>
                  {s.isCurrent && <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">Текущая</span>}
                </div>
                <div className="text-xs text-gray-500 dark:text-white/40 mt-0.5">
                  IP: {s.ip || "—"} · {new Date(s.createdAt).toLocaleDateString("ru-RU")}
                </div>
              </div>
              {!s.isCurrent && (
                <button onClick={() => revoke(s.id)} className="text-xs text-red-500 hover:text-red-600 font-medium shrink-0">
                  Завершить
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============ Login History Section ============ */

interface LoginLogEntry {
  id: number;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

function LoginHistorySection() {
  const [logs, setLogs] = useState<LoginLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/login-history")
      .then((r) => r.json())
      .then((data) => { if (data.logs) setLogs(data.logs); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Журнал входов</h3>
      <p className="text-sm text-gray-500 dark:text-white/40 mb-4">Последние 20 входов в аккаунт</p>

      {loading ? (
        <div className="text-sm text-gray-500 dark:text-white/50">Загрузка...</div>
      ) : logs.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-white/40">Пока нет записей</p>
      ) : (
        <div className="space-y-1.5">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-sm">
              <div className="flex items-center gap-3 min-w-0">
                <svg className="w-4 h-4 shrink-0 text-gray-500 dark:text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span className="text-gray-900 dark:text-white/70 truncate">{parseUA(log.userAgent)}</span>
              </div>
              <div className="flex items-center gap-4 shrink-0 text-xs text-gray-500 dark:text-white/40">
                <span>{log.ip || "—"}</span>
                <span>{new Date(log.createdAt).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============ Delete Account Section ============ */

function DeleteAccountSection() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!password) { toast.error("Введите пароль"); return; }
    setDeleting(true);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Ошибка"); return; }
      toast.success("Аккаунт удалён");
      window.location.href = "/";
    } catch { toast.error("Ошибка сети"); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      <h3 className="text-base font-semibold text-red-600 dark:text-red-400 mb-1">Удаление аккаунта</h3>
      <p className="text-sm text-gray-500 dark:text-white/40 mb-4">
        Все ваши данные, оборудование и заявки будут удалены безвозвратно.
      </p>

      {showConfirm ? (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl p-5 space-y-4">
          <p className="text-sm font-medium text-gray-900 dark:text-white">Введите пароль для подтверждения удаления</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="Ваш текущий пароль"
          />
          <div className="flex gap-3">
            <button onClick={handleDelete} disabled={deleting} className="bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50">
              {deleting ? "Удаление..." : "Удалить аккаунт"}
            </button>
            <button onClick={() => { setShowConfirm(false); setPassword(""); }} className="py-2 px-4 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          className="py-2 px-4 rounded-lg text-sm font-medium border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          Удалить аккаунт
        </button>
      )}
    </div>
  );
}
