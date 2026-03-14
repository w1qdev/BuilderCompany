"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  const d = digits.startsWith("7") || digits.startsWith("8") ? digits.slice(1) : digits;
  let result = "+7";
  if (d.length > 0) result += " (" + d.slice(0, 3);
  if (d.length >= 3) result += ") " + d.slice(3, 6);
  if (d.length >= 6) result += "-" + d.slice(6, 8);
  if (d.length >= 8) result += "-" + d.slice(8, 10);
  return result;
}

function unformatPhone(value: string): string {
  return value.replace(/\D/g, "");
}

export default function RegisterPage() {
  const router = useRouter();
  // PHONE_AUTH_ENABLED: set to true to re-enable phone registration tab
  const PHONE_AUTH_ENABLED = false;
  // OAUTH_ENABLED: set to true to re-enable Yandex/VK registration
  const OAUTH_ENABLED = false;
  const [tab, setTab] = useState<"phone" | "email">("email");

  // Phone registration state
  const [phoneData, setPhoneData] = useState({ name: "", phone: "", company: "" });
  const [phoneStep, setPhoneStep] = useState<1 | 2>(1);
  const [smsCode, setSmsCode] = useState("");
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneVerifying, setPhoneVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Email registration state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateField = (field: string, value: string) => {
    let error = "";
    if (field === "name" && !value.trim()) error = "Введите ваше имя";
    if (field === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Введите корректный email";
    if (field === "password" && value && value.length < 8) error = "Пароль должен быть не менее 8 символов";
    if (field === "confirmPassword" && value && value !== formData.password) error = "Пароли не совпадают";
    setFieldErrors((prev) => {
      if (error) return { ...prev, [field]: error };
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handlePhoneChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.length <= 11) {
      setPhoneData((d) => ({ ...d, phone: formatPhone(raw) }));
    }
  };

  const getPasswordStrength = (pwd: string): { level: number; label: string; color: string } => {
    if (!pwd) return { level: 0, label: "", color: "" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 10) score++;
    if (/[A-ZА-Я]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-zА-Яа-я0-9]/.test(pwd)) score++;
    if (score <= 1) return { level: 1, label: "Слабый", color: "bg-red-500" };
    if (score <= 3) return { level: 2, label: "Средний", color: "bg-yellow-500" };
    return { level: 3, label: "Надёжный", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSendCode = useCallback(async () => {
    if (!phoneData.name.trim()) {
      toast.error("Введите ваше имя");
      return;
    }
    const digits = unformatPhone(phoneData.phone);
    if (digits.length !== 11) {
      toast.error("Введите корректный номер телефона");
      return;
    }
    setPhoneSending(true);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneData.phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Ошибка отправки кода");
        return;
      }
      toast.success("Код отправлен");
      setPhoneStep(2);
      setResendTimer(60);
    } catch {
      toast.error("Ошибка соединения с сервером");
    } finally {
      setPhoneSending(false);
    }
  }, [phoneData]);

  const handleVerifyCode = async () => {
    if (smsCode.length !== 4) {
      toast.error("Введите 4-значный код");
      return;
    }
    setPhoneVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneData.phone,
          code: smsCode,
          name: phoneData.name,
          ...(phoneData.company ? { company: phoneData.company } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Ошибка проверки кода");
        return;
      }
      toast.success("Аккаунт создан! Добро пожаловать.");
      router.push("/dashboard");
    } catch {
      toast.error("Ошибка соединения с сервером");
    } finally {
      setPhoneVerifying(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Пароли не совпадают");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Пароль должен быть не менее 8 символов");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          company: formData.company || undefined,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Ошибка при регистрации");
        return;
      }

      // Auto login after registration
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (loginRes.ok) {
        toast.success("Аккаунт создан! Добро пожаловать.");
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    } catch {
      toast.error("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all";

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
            Регистрация
          </h1>
          <p className="text-neutral dark:text-white/70 text-center text-sm mb-6">
            Создайте аккаунт для доступа к личному кабинету
          </p>

          {/* Tabs — PHONE_AUTH_ENABLED: unhide when phone auth is ready */}
          {PHONE_AUTH_ENABLED && (
            <div className="flex bg-gray-100 dark:bg-dark rounded-xl p-1 mb-6">
              <button
                onClick={() => setTab("phone")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  tab === "phone"
                    ? "bg-white dark:bg-dark-light text-dark dark:text-white shadow-sm"
                    : "text-neutral dark:text-white/50 hover:text-dark dark:hover:text-white/70"
                }`}
              >
                По телефону
              </button>
              <button
                onClick={() => setTab("email")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  tab === "email"
                    ? "bg-white dark:bg-dark-light text-dark dark:text-white shadow-sm"
                    : "text-neutral dark:text-white/50 hover:text-dark dark:hover:text-white/70"
                }`}
              >
                Email и пароль
              </button>
            </div>
          )}

          {/* Phone Tab — PHONE_AUTH_ENABLED */}
          {PHONE_AUTH_ENABLED && tab === "phone" && (
            <div className="space-y-4">
              {phoneStep === 1 ? (
                <>
                  <div>
                    <label htmlFor="reg-phone-name" className="block text-sm font-medium text-dark dark:text-white mb-1">
                      ФИО <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="reg-phone-name"
                      type="text"
                      value={phoneData.name}
                      onChange={(e) => setPhoneData((d) => ({ ...d, name: e.target.value }))}
                      className={inputClass}
                      placeholder="Иванов Иван Иванович"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark dark:text-white mb-1">
                      Телефон <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phoneData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className={inputClass}
                      placeholder="+7 (___) ___-__-__"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark dark:text-white mb-1">
                      Компания
                    </label>
                    <input
                      type="text"
                      value={phoneData.company}
                      onChange={(e) => setPhoneData((d) => ({ ...d, company: e.target.value }))}
                      className={inputClass}
                      placeholder="ООО Компания"
                    />
                  </div>
                  <button
                    onClick={handleSendCode}
                    disabled={phoneSending}
                    className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  >
                    {phoneSending ? "Отправка..." : "Получить код"}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-neutral dark:text-white/70 text-center">
                    Код отправлен на{" "}
                    <span className="font-medium text-dark dark:text-white">{phoneData.phone}</span>
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-dark dark:text-white mb-1">
                      Код из SMS
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className={`${inputClass} text-center text-2xl tracking-[0.5em] font-mono`}
                      placeholder="····"
                    />
                  </div>
                  <button
                    onClick={handleVerifyCode}
                    disabled={phoneVerifying || smsCode.length !== 4}
                    className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  >
                    {phoneVerifying ? "Проверка..." : "Создать аккаунт"}
                  </button>
                  <div className="text-center">
                    {resendTimer > 0 ? (
                      <p className="text-sm text-neutral dark:text-white/50">
                        Отправить повторно через {resendTimer} сек
                      </p>
                    ) : (
                      <button
                        onClick={handleSendCode}
                        className="text-sm text-primary hover:underline font-medium"
                      >
                        Отправить код повторно
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => { setPhoneStep(1); setSmsCode(""); }}
                    className="w-full text-sm text-neutral dark:text-white/50 hover:text-dark dark:hover:text-white/70 transition-colors"
                  >
                    ← Изменить данные
                  </button>
                </>
              )}
            </div>
          )}

          {/* Email Tab */}
          {tab === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark dark:text-white mb-1">
                  ФИО <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => { setFormData({ ...formData, name: e.target.value }); if (fieldErrors.name) validateField("name", e.target.value); }}
                  onBlur={(e) => validateField("name", e.target.value)}
                  className={`${inputClass} ${fieldErrors.name ? "border-red-400 dark:border-red-500" : ""}`}
                  placeholder="Иванов Иван Иванович"
                  required
                />
                {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-dark dark:text-white mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => { setFormData({ ...formData, email: e.target.value }); if (fieldErrors.email) validateField("email", e.target.value); }}
                  onBlur={(e) => validateField("email", e.target.value)}
                  className={`${inputClass} ${fieldErrors.email ? "border-red-400 dark:border-red-500" : ""}`}
                  placeholder="example@mail.ru"
                  required
                />
                {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark dark:text-white mb-1">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className={inputClass}
                    placeholder="+7 (999) ..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark dark:text-white mb-1">
                    Компания
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    className={inputClass}
                    placeholder="ООО Компания"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark dark:text-white mb-1">
                  Пароль <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => { setFormData({ ...formData, password: e.target.value }); if (fieldErrors.password) validateField("password", e.target.value); }}
                    onBlur={(e) => validateField("password", e.target.value)}
                    className={`${inputClass} ${fieldErrors.password ? "border-red-400 dark:border-red-500" : ""}`}
                    placeholder="Минимум 8 символов"
                    required
                  />
                  {fieldErrors.password && <p className="text-xs text-red-500 mt-1 pr-8">{fieldErrors.password}</p>}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white/70 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            passwordStrength.level >= i
                              ? passwordStrength.color
                              : "bg-gray-200 dark:bg-white/10"
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${
                      passwordStrength.level === 1 ? "text-red-500" :
                      passwordStrength.level === 2 ? "text-yellow-500" :
                      "text-green-500"
                    }`}>
                      {passwordStrength.label}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-dark dark:text-white mb-1">
                  Подтвердите пароль <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => { setFormData({ ...formData, confirmPassword: e.target.value }); if (fieldErrors.confirmPassword) validateField("confirmPassword", e.target.value); }}
                    onBlur={(e) => validateField("confirmPassword", e.target.value)}
                    className={`${inputClass} ${fieldErrors.confirmPassword ? "border-red-400 dark:border-red-500" : ""}`}
                    placeholder="Повторите пароль"
                    required
                  />
                  {fieldErrors.confirmPassword && <p className="text-xs text-red-500 mt-1 pr-8">{fieldErrors.confirmPassword}</p>}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white/70 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="privacyConsent"
                  checked={privacyConsent}
                  onChange={(e) => setPrivacyConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                <label
                  htmlFor="privacyConsent"
                  className="text-xs text-neutral dark:text-white/60 cursor-pointer select-none leading-relaxed"
                >
                  Я соглашаюсь с{" "}
                  <Link href="/privacy" className="text-primary hover:underline" target="_blank">
                    политикой конфиденциальности
                  </Link>{" "}
                  и{" "}
                  <Link href="/terms" className="text-primary hover:underline" target="_blank">
                    пользовательским соглашением
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !privacyConsent}
                className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                {loading ? "Регистрация..." : "Зарегистрироваться"}
              </button>
            </form>
          )}

          {/* OAuth — OAUTH_ENABLED: unhide when Yandex/VK apps are configured */}
          {OAUTH_ENABLED && <div className="mt-6">
            <div className="relative flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
              <span className="text-xs text-neutral dark:text-white/40">или зарегистрироваться через</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/api/auth/yandex"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="12" fill="#FC3F1D"/>
                  <path d="M13.475 7.5H12.2c-1.3 0-2 .65-2 1.625 0 1.1.5 1.65 1.55 2.35l.85.575L10.3 16.5H8.5l2.55-4.15c-1.45-.925-2.275-1.85-2.275-3.35 0-1.9 1.35-3 3.5-3h2.75V16.5h-1.55V7.5z" fill="white"/>
                </svg>
                Яндекс
              </Link>
              <Link
                href="/api/auth/vk"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <rect width="24" height="24" rx="5" fill="#0077FF"/>
                  <path d="M12.9 16.4h1.1s.33-.04.5-.22c.16-.17.15-.49.15-.49s-.02-1.5.67-1.72c.68-.22 1.56 1.45 2.49 2.09.7.49 1.24.38 1.24.38l2.48-.03s1.3-.08.68-1.1c-.05-.08-.35-.74-1.83-2.1-1.54-1.42-1.34-1.19.52-3.65 1.13-1.5 1.58-2.42 1.44-2.81-.13-.37-1.01-.27-1.01-.27l-2.79.02s-.21-.03-.36.07c-.15.09-.24.32-.24.32s-.44 1.17-1.02 2.16c-1.23 2.09-1.72 2.2-1.92 2.07-.47-.3-.35-1.22-.35-1.86 0-2.03.31-2.87-.6-3.09-.3-.07-.52-.12-1.28-.13-.98-.01-1.81.01-2.28.23-.31.15-.55.48-.41.5.18.02.58.11.79.4.28.37.27 1.2.27 1.2s.16 2.39-.38 2.69c-.37.2-.88-.21-1.97-2.06-.56-.97-.98-2.04-.98-2.04s-.08-.21-.23-.33c-.18-.13-.43-.18-.43-.18l-2.65.02s-.4.01-.54.18c-.13.15-.01.47-.01.47s2.07 4.84 4.41 7.28c2.15 2.24 4.58 2.09 4.58 2.09z" fill="white"/>
                </svg>
                VK ID
              </Link>
            </div>
          </div>}

          <p className="text-center text-sm text-neutral dark:text-white/70 mt-4">
            Уже есть аккаунт?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              Войти
            </Link>
          </p>
        </div>

        <p className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-neutral dark:text-white/70 hover:text-primary transition-colors"
          >
            ← Вернуться на главную
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
