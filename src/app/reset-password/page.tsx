"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { motion } from "framer-motion";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="text-sm text-neutral dark:text-white/70">
          Ссылка для сброса пароля недействительна.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block text-sm text-primary hover:underline font-medium"
        >
          Запросить новую ссылку
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.newPassword.length < 6) {
      setError("Пароль должен быть не менее 6 символов");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: formData.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ошибка при сбросе пароля");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-dark dark:text-white">
          Пароль изменён
        </h2>
        <p className="text-sm text-neutral dark:text-white/70">
          Теперь вы можете войти с новым паролем.
        </p>
        <Link
          href="/login"
          className="inline-block bg-primary text-white py-3 px-8 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
        >
          Войти
        </Link>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark dark:text-white mb-1">
            Новый пароль
          </label>
          <input
            type="password"
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
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
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
            placeholder="Повторите новый пароль"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {loading ? "Сохранение..." : "Сбросить пароль"}
        </button>
      </form>

      <p className="text-center text-sm text-neutral dark:text-white/70 mt-6">
        <Link href="/login" className="text-primary hover:underline font-medium">
          Вернуться ко входу
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-warm-bg dark:bg-dark flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Logo size="sm" />
        </Link>

        <div className="bg-white dark:bg-dark-light rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-dark dark:text-white text-center mb-2">
            Новый пароль
          </h1>
          <p className="text-neutral dark:text-white/70 text-center text-sm mb-6">
            Придумайте новый пароль для вашего аккаунта
          </p>

          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <p className="text-center mt-6">
          <Link href="/" className="text-sm text-neutral dark:text-white/70 hover:text-primary transition-colors">
            ← Вернуться на главную
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
