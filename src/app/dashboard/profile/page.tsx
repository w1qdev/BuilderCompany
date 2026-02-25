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
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
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
            className="bg-primary text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {savingCompany ? "Сохранение..." : "Сохранить данные"}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-dark dark:text-white mb-4">Смена пароля</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark dark:text-white mb-1">Текущий пароль</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className={inputClass}
              placeholder="Введите текущий пароль"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark dark:text-white mb-1">Новый пароль</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className={inputClass}
              placeholder="Минимум 6 символов"
              required minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark dark:text-white mb-1">Подтверждение пароля</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className={inputClass}
              placeholder="Повторите новый пароль"
              required minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-primary text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {submitting ? "Сохранение..." : "Сменить пароль"}
          </button>
        </form>
      </div>
    </div>
  );
}
