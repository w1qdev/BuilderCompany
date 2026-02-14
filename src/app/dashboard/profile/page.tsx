"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface UserInfo {
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  createdAt: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword.length < 6) {
      toast.error("Новый пароль должен быть не менее 6 символов");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Пароли не совпадают");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Ошибка при смене пароля");
        return;
      }

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

      {/* User info */}
      <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-dark dark:text-white mb-4">
          Личные данные
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-white/5">
            <svg className="w-5 h-5 text-neutral dark:text-white/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div>
              <div className="text-xs text-neutral dark:text-white/40">Имя</div>
              <div className="text-sm font-medium text-dark dark:text-white">{user.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-white/5">
            <svg className="w-5 h-5 text-neutral dark:text-white/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <div>
              <div className="text-xs text-neutral dark:text-white/40">Email</div>
              <div className="text-sm font-medium text-dark dark:text-white">{user.email}</div>
            </div>
          </div>
          {user.company && (
            <div className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-white/5">
              <svg className="w-5 h-5 text-neutral dark:text-white/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <div>
                <div className="text-xs text-neutral dark:text-white/40">Организация</div>
                <div className="text-sm font-medium text-dark dark:text-white">{user.company}</div>
              </div>
            </div>
          )}
          {user.phone && (
            <div className="flex items-center gap-3 py-2">
              <svg className="w-5 h-5 text-neutral dark:text-white/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <div>
                <div className="text-xs text-neutral dark:text-white/40">Телефон</div>
                <div className="text-sm font-medium text-dark dark:text-white">{user.phone}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-dark dark:text-white mb-4">
          Смена пароля
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark dark:text-white mb-1">
              Текущий пароль
            </label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
              placeholder="Введите текущий пароль"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark dark:text-white mb-1">
              Новый пароль
            </label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, newPassword: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
              placeholder="Минимум 6 символов"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark dark:text-white mb-1">
              Подтверждение пароля
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
              placeholder="Повторите новый пароль"
              required
              minLength={6}
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
