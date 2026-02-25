"use client";

import Link from "next/link";
import { useState } from "react";
import { Portal } from "./ui/Portal";

const STORAGE_KEY = "onboarding_completed";

interface OnboardingStepperProps {
  userName?: string;
}

const steps = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    title: "Добавьте оборудование",
    description: "Внесите свои приборы (средства измерений и испытательное оборудование). Система будет отслеживать сроки поверки и предупреждать вас заранее.",
    action: { label: "Добавить СИ", href: "/dashboard/equipment/si" },
    secondaryAction: { label: "Добавить ИО", href: "/dashboard/equipment/io" },
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: "Подайте заявку на поверку",
    description: "Выберите нужное оборудование и в один клик создайте заявку на поверку. Мы обработаем её в кратчайшие сроки и уведомим вас о результате.",
    action: { label: "Перейти к заявкам", href: "/dashboard/requests" },
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    title: "Настройте профиль",
    description: "Укажите название вашей компании и контактные данные. Это ускорит обработку заявок и позволит нам связаться с вами удобным способом.",
    action: { label: "Открыть профиль", href: "/dashboard/profile" },
  },
];

export default function OnboardingStepper({ userName }: OnboardingStepperProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) !== "true";
  });

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleClose();
    }
  };

  if (!visible) return null;

  const current = steps[step];

  return (
    <Portal>
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-dark-light rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors z-10 text-gray-500"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Step indicator */}
        <div className="flex gap-1.5 px-6 pt-6 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i <= step ? "bg-primary" : "bg-gray-200 dark:bg-white/10"
              }`}
            />
          ))}
        </div>

        <div className="px-6 pb-6">
          {/* Icon */}
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center text-white mb-4">
            {current.icon}
          </div>

          {/* Step number */}
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            Шаг {step + 1} из {steps.length}
          </p>

          {/* Title */}
          <h2 className="text-xl font-bold text-dark dark:text-white mb-2">
            {step === 0 && userName
              ? `${userName}, давайте начнём!`
              : current.title}
          </h2>
          {step === 0 && userName && (
            <p className="text-sm font-semibold text-dark dark:text-white/80 mb-2">{current.title}</p>
          )}

          {/* Description */}
          <p className="text-sm text-neutral dark:text-white/60 mb-6 leading-relaxed">
            {current.description}
          </p>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {current.action && (
              <Link
                href={current.action.href}
                onClick={handleClose}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                {current.action.label}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
            {current.secondaryAction && (
              <Link
                href={current.secondaryAction.href}
                onClick={handleClose}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-dark text-dark dark:text-white border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                {current.secondaryAction.label}
              </Link>
            )}
            <button
              onClick={handleNext}
              className="ml-auto text-sm text-neutral dark:text-white/50 hover:text-dark dark:hover:text-white/70 transition-colors"
            >
              {step < steps.length - 1 ? "Далее →" : "Готово"}
            </button>
          </div>
        </div>
      </div>
    </div>
    </Portal>
  );
}
