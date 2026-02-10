"use client";

import { motion } from "framer-motion";
import { CreditCard, FileText, Building2 } from "lucide-react";

const steps = [
  {
    icon: FileText,
    title: "Получение счета",
    description:
      "После оформления заказа и согласования условий (по стоимости, срокам и др.), менеджер отдела метрологии направляет на Вашу электронную почту Счёт на оплату.",
    color: "from-blue-500 to-indigo-500",
  },
  {
    icon: Building2,
    title: "Система налогообложения",
    description:
      "РЦСМ работает от двух юридических лиц. По умолчанию счёт выставляется без НДС (УСН – Упрощённая Система Налогообложения) либо с НДС + 20% (ОСНО – Общая Система Налогообложения).",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: CreditCard,
    title: "Для всех типов клиентов",
    description:
      "Счёт может быть выставлен как на юридическое лицо, так и на физическое.",
    color: "from-emerald-500 to-teal-500",
  },
];

export default function Payment() {
  return (
    <section
      id="payment"
      className="py-20 sm:py-28 bg-warm-light dark:bg-dark overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Процесс оплаты
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-dark dark:text-white mt-2">
            Как происходит оплата
          </h2>
          <p className="text-neutral dark:text-white/60 mt-4 max-w-2xl mx-auto">
            Простой и прозрачный процесс оформления и оплаты услуг
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.15 }}
              className="relative"
            >
              <div className="bg-white dark:bg-dark-light rounded-3xl p-6 h-full relative z-10 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-5 shadow-lg`}
                >
                  <step.icon className="w-7 h-7 text-white" />
                </div>

                {/* Step number */}
                <div className="absolute top-4 right-4 text-5xl font-extrabold text-gray-100 dark:text-white/10">
                  0{index + 1}
                </div>

                <h3 className="text-xl font-bold text-dark dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-neutral dark:text-white/60 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
