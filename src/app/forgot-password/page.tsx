"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ошибка при отправке");
        return;
      }

      setSent(true);
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

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
            Восстановление пароля
          </h1>
          <p className="text-neutral dark:text-white/70 text-center text-sm mb-6">
            Введите email, указанный при регистрации
          </p>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-neutral dark:text-white/70">
                Если аккаунт с таким email существует, мы отправили ссылку для сброса пароля. Проверьте почту.
              </p>
              <Link
                href="/login"
                className="inline-block text-sm text-primary hover:underline font-medium"
              >
                Вернуться ко входу
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-xl mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark dark:text-white mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                    placeholder="example@mail.ru"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {loading ? "Отправка..." : "Отправить ссылку"}
                </button>
              </form>

              <p className="text-center text-sm text-neutral dark:text-white/70 mt-6">
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Вернуться ко входу
                </Link>
              </p>
            </>
          )}
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
