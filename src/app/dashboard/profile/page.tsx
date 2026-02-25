"use client";

import { useEffect, useState } from "react";
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
  createdAt: string;
}

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow";

export default function ProfilePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Company details form
  const [companyForm, setCompanyForm] = useState({
    name: "", phone: "", company: "", inn: "", kpp: "", legalName: "", legalAddress: "",
  });
  const [savingCompany, setSavingCompany] = useState(false);

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "", newPassword: "", confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

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

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-dark dark:text-white">Профиль</h1>

      {/* Personal + company details form */}
      <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-dark dark:text-white mb-1">Личные данные</h2>
        <p className="text-sm text-neutral dark:text-white/50 mb-5">Email нельзя изменить</p>

        <form onSubmit={handleSaveCompany} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark dark:text-white mb-1">ФИО</label>
              <input
                type="text"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                className={inputClass}
                placeholder="Иванов Иван Иванович"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark dark:text-white mb-1">Телефон</label>
              <input
                type="tel"
                value={companyForm.phone}
                onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                className={inputClass}
                placeholder="+7 (999) 000-00-00"
              />
            </div>
          </div>

          {/* Email (readonly) */}
          <div>
            <label className="block text-sm font-medium text-dark dark:text-white mb-1">Email</label>
            <input type="email" value={user.email} readOnly className={`${inputClass} opacity-60 cursor-not-allowed`} />
          </div>

          <div className="border-t border-gray-100 dark:border-white/10 pt-4">
            <h3 className="text-sm font-semibold text-dark dark:text-white mb-3">Данные организации</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark dark:text-white mb-1">Краткое наименование</label>
                <input
                  type="text"
                  value={companyForm.company}
                  onChange={(e) => setCompanyForm({ ...companyForm, company: e.target.value })}
                  className={inputClass}
                  placeholder="ООО Компания"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark dark:text-white mb-1">Полное наименование</label>
                <input
                  type="text"
                  value={companyForm.legalName}
                  onChange={(e) => setCompanyForm({ ...companyForm, legalName: e.target.value })}
                  className={inputClass}
                  placeholder="Общество с ограниченной ответственностью «Компания»"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark dark:text-white mb-1">ИНН</label>
                  <input
                    type="text"
                    value={companyForm.inn}
                    onChange={(e) => setCompanyForm({ ...companyForm, inn: e.target.value })}
                    className={inputClass}
                    placeholder="1234567890"
                    maxLength={12}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark dark:text-white mb-1">КПП</label>
                  <input
                    type="text"
                    value={companyForm.kpp}
                    onChange={(e) => setCompanyForm({ ...companyForm, kpp: e.target.value })}
                    className={inputClass}
                    placeholder="123456789"
                    maxLength={9}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark dark:text-white mb-1">Юридический адрес</label>
                <input
                  type="text"
                  value={companyForm.legalAddress}
                  onChange={(e) => setCompanyForm({ ...companyForm, legalAddress: e.target.value })}
                  className={inputClass}
                  placeholder="123456, г. Москва, ул. Примерная, д. 1"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingCompany}
            className="bg-primary text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            {savingCompany ? "Сохранение..." : "Сохранить данные"}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-dark dark:text-white mb-4">Смена пароля</h2>

        {showPasswordConfirm ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-5 space-y-4">
            <p className="text-sm font-medium text-dark dark:text-white">Вы уверены, что хотите сменить пароль?</p>
            <div className="flex gap-3">
              <button
                onClick={executePasswordChange}
                disabled={submitting}
                className="bg-primary text-white py-2.5 px-5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {submitting ? "Сохранение..." : "Подтвердить"}
              </button>
              <button
                onClick={() => setShowPasswordConfirm(false)}
                className="py-2.5 px-5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-white/10 text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark dark:text-white mb-1">Текущий пароль</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className={inputClass}
                  placeholder="Введите текущий пароль"
                  required
                />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white/70 transition-colors" tabIndex={-1}>
                  {showCurrentPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark dark:text-white mb-1">Новый пароль</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className={inputClass}
                  placeholder="Минимум 8 символов"
                  required minLength={8}
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white/70 transition-colors" tabIndex={-1}>
                  {showNewPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark dark:text-white mb-1">Подтверждение пароля</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className={inputClass}
                  placeholder="Повторите новый пароль"
                  required minLength={8}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white/70 transition-colors" tabIndex={-1}>
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              {submitting ? "Сохранение..." : "Сменить пароль"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
