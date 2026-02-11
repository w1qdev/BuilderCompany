"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const serviceTypes = [
  {
    id: "verification",
    label: "Поверка СИ",
    description: "Метрологическая поверка средств измерений",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    gradient: "from-blue-500 to-indigo-600"
  },
  {
    id: "calibration",
    label: "Калибровка СИ",
    description: "Калибровка средств измерений",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    gradient: "from-emerald-500 to-teal-600"
  },
  {
    id: "certification",
    label: "Аттестация",
    description: "Аттестация испытательного оборудования",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    gradient: "from-orange-500 to-amber-600"
  },
];

const urgencyOptions = [
  {
    id: "standard",
    label: "Стандартные сроки",
    duration: "5-10 рабочих дней",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    badge: "Оптимально"
  },
  {
    id: "fast",
    label: "Ускоренные сроки",
    duration: "3-5 рабочих дней",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    badge: "Срочно"
  },
];

interface CalculatorProps {
  onOpenModal: () => void;
}

export default function Calculator({ onOpenModal }: CalculatorProps) {
  const [service, setService] = useState(serviceTypes[0].id);
  const [urgency, setUrgency] = useState(urgencyOptions[0].id);

  const selectedService = serviceTypes.find((s) => s.id === service)!;
  const selectedUrgency = urgencyOptions.find((u) => u.id === urgency)!;

  return (
    <section
      id="calculator"
      className="py-20 sm:py-28 bg-gradient-to-b from-warm-light via-white to-warm-light dark:from-dark dark:via-dark-light dark:to-dark overflow-hidden relative"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-light rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Подберите услугу
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-dark dark:text-white mt-2 mb-4">
            Что вам <span className="text-gradient">необходимо?</span>
          </h2>
          <p className="text-neutral dark:text-white/60 mt-3 max-w-2xl mx-auto text-lg">
            Выберите тип услуги и сроки выполнения работ. Мы свяжемся с вами для уточнения деталей
          </p>
        </motion.div>

        {/* Step 1: Service Selection */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
              1
            </div>
            <h3 className="text-2xl font-bold text-dark dark:text-white">
              Выберите услугу
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {serviceTypes.map((s, index) => (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + index * 0.1 }}
                onClick={() => setService(s.id)}
                className={`group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 ${
                  service === s.id
                    ? "bg-white dark:bg-dark-light shadow-2xl ring-2 ring-primary scale-105"
                    : "bg-white dark:bg-dark-light shadow-md hover:shadow-xl hover:scale-102"
                }`}
              >
                {/* Gradient background on hover/select */}
                <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-0 ${service === s.id ? "opacity-10" : "group-hover:opacity-5"} transition-opacity`} />

                {/* Icon */}
                <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-4 shadow-lg ${service === s.id ? "scale-110" : "group-hover:scale-110"} transition-transform`}>
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                  </svg>
                </div>

                {/* Content */}
                <div className="relative">
                  <h4 className="text-lg font-bold text-dark dark:text-white mb-2">
                    {s.label}
                  </h4>
                  <p className="text-sm text-neutral dark:text-white/60 leading-relaxed">
                    {s.description}
                  </p>
                </div>

                {/* Check mark */}
                {service === s.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Step 2: Urgency Selection */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
              2
            </div>
            <h3 className="text-2xl font-bold text-dark dark:text-white">
              Выберите сроки выполнения
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {urgencyOptions.map((u, index) => (
              <motion.button
                key={u.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + index * 0.1 }}
                onClick={() => setUrgency(u.id)}
                className={`group relative overflow-hidden rounded-2xl p-8 text-left transition-all duration-300 ${
                  urgency === u.id
                    ? "bg-gradient-to-br from-dark to-dark-light text-white shadow-2xl scale-105 ring-2 ring-primary"
                    : "bg-white dark:bg-dark-light shadow-md hover:shadow-xl hover:scale-102"
                }`}
              >
                {/* Badge */}
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${
                  urgency === u.id
                    ? "bg-primary text-white"
                    : u.id === "fast"
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                      : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                }`}>
                  {u.badge}
                </div>

                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  urgency === u.id
                    ? "bg-primary/20"
                    : "bg-warm-bg dark:bg-white/5"
                } ${urgency === u.id ? "" : "group-hover:bg-primary/10"} transition-colors`}>
                  <svg
                    className={`w-6 h-6 ${urgency === u.id ? "text-primary" : "text-neutral dark:text-white/60"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={u.icon} />
                  </svg>
                </div>

                {/* Content */}
                <div>
                  <h4 className={`text-xl font-bold mb-2 ${urgency === u.id ? "text-white" : "text-dark dark:text-white"}`}>
                    {u.label}
                  </h4>
                  <p className={`text-lg font-semibold ${urgency === u.id ? "text-primary" : "text-neutral dark:text-white/60"}`}>
                    {u.duration}
                  </p>
                </div>

                {/* Check mark */}
                {urgency === u.id && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="absolute bottom-6 right-6 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Step 3: Summary & CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ delay: 0.3 }}
        >
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-dark-light shadow-lg border border-gray-200 dark:border-white/10">
            {/* Header */}
            <div className="bg-gradient-to-r from-warm-bg to-white dark:from-dark dark:to-dark-light px-8 py-6 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold text-dark dark:text-white">
                    Ваш выбор
                  </h3>
                  <p className="text-sm text-neutral dark:text-white/60">
                    Проверьте детали перед отправкой заявки
                  </p>
                </div>
              </div>
            </div>

            {/* Summary Grid */}
            <div className="p-8 grid md:grid-cols-2 gap-6">
              {/* Service Info */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-neutral dark:text-white/60 uppercase tracking-wide mb-1">
                      Услуга
                    </p>
                    <p className="text-base font-bold text-dark dark:text-white">
                      {selectedService.label}
                    </p>
                    <p className="text-sm text-neutral dark:text-white/70 mt-1">
                      {selectedService.description}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-gray-200 dark:bg-white/10" />

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-neutral dark:text-white/60 uppercase tracking-wide mb-1">
                      Срок выполнения
                    </p>
                    <p className="text-base font-bold text-dark dark:text-white">
                      {selectedUrgency.duration}
                    </p>
                    <p className="text-sm text-neutral dark:text-white/70 mt-1">
                      {selectedUrgency.label}
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA Section */}
              <div className="flex flex-col justify-center">
                <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-6 mb-4">
                  <div className="flex items-start gap-3 mb-4">
                    <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-dark dark:text-white">
                      <p className="font-semibold mb-1">Что дальше?</p>
                      <ul className="space-y-1 text-neutral dark:text-white/70">
                        <li>• Оставьте заявку за 30 секунд</li>
                        <li>• Мы позвоним в течение 15 минут</li>
                        <li>• Рассчитаем точную стоимость</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onOpenModal}
                  className="group relative overflow-hidden gradient-primary text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <span className="relative z-10">Оставить заявку</span>
                  <svg className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-dark to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <p className="text-xs text-center text-neutral dark:text-white/50 mt-3">
                  Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
