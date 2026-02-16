"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { motion } from "framer-motion";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "oauth") toast.error("Ошибка входа через соцсеть. Попробуйте снова.");
    if (error === "no_email") toast.error("Не удалось получить email. Разрешите доступ к email в настройках.");
  }, [searchParams]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Ошибка при входе");
        return;
      }

      toast.success("Вход выполнен успешно");
      router.push("/dashboard");
    } catch {
      toast.error("Ошибка соединения с сервером");
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
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Logo size="sm" />
        </Link>

        {/* Form */}
        <div className="bg-white dark:bg-dark-light rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-dark dark:text-white text-center mb-2">
            Вход в личный кабинет
          </h1>
          <p className="text-neutral dark:text-white/70 text-center text-sm mb-6">
            Введите данные для входа
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark dark:text-white mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="example@mail.ru"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark dark:text-white mb-1">
                Пароль
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Введите пароль"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-neutral dark:text-white/70">Запомнить меня</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                Забыли пароль?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading ? "Вход..." : "Войти"}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
              <span className="text-xs text-neutral dark:text-white/40">или войти через</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/api/auth/yandex"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="12" fill="#FC3F1D"/>
                  <path d="M13.475 7.5H12.2c-1.3 0-2 .65-2 1.625 0 1.1.5 1.65 1.55 2.35l.85.575L10.3 16.5H8.5l2.55-4.15c-1.45-.925-2.275-1.85-2.275-3.35 0-1.9 1.35-3 3.5-3h2.75V16.5h-1.55V7.5z" fill="white"/>
                </svg>
                Яндекс
              </a>
              <a
                href="/api/auth/vk"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <rect width="24" height="24" rx="5" fill="#0077FF"/>
                  <path d="M12.9 16.4h1.1s.33-.04.5-.22c.16-.17.15-.49.15-.49s-.02-1.5.67-1.72c.68-.22 1.56 1.45 2.49 2.09.7.49 1.24.38 1.24.38l2.48-.03s1.3-.08.68-1.1c-.05-.08-.35-.74-1.83-2.1-1.54-1.42-1.34-1.19.52-3.65 1.13-1.5 1.58-2.42 1.44-2.81-.13-.37-1.01-.27-1.01-.27l-2.79.02s-.21-.03-.36.07c-.15.09-.24.32-.24.32s-.44 1.17-1.02 2.16c-1.23 2.09-1.72 2.2-1.92 2.07-.47-.3-.35-1.22-.35-1.86 0-2.03.31-2.87-.6-3.09-.3-.07-.52-.12-1.28-.13-.98-.01-1.81.01-2.28.23-.31.15-.55.48-.41.5.18.02.58.11.79.4.28.37.27 1.2.27 1.2s.16 2.39-.38 2.69c-.37.2-.88-.21-1.97-2.06-.56-.97-.98-2.04-.98-2.04s-.08-.21-.23-.33c-.18-.13-.43-.18-.43-.18l-2.65.02s-.4.01-.54.18c-.13.15-.01.47-.01.47s2.07 4.84 4.41 7.28c2.15 2.24 4.58 2.09 4.58 2.09z" fill="white"/>
                </svg>
                VK ID
              </a>
            </div>
          </div>

          <p className="text-center text-sm text-neutral dark:text-white/70 mt-4">
            Нет аккаунта?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Зарегистрироваться
            </Link>
          </p>
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
