"use client";

import { motion } from "framer-motion";

interface Steps {
  number: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const steps: Steps[] = [
  {
    number: "01",
    title: "Заявка",
    description:
      "Оставьте заявку на сайте или позвоните нам. Менеджер свяжется с вами в течение 15 минут.",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    color: "from-orange-500 to-amber-500",
  },
  {
    number: "02",
    title: "Анализ",
    description:
      "Изучаем ваше оборудование, определяем объём работ и согласовываем сроки выполнения.",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    color: "from-blue-500 to-indigo-500",
  },
  {
    number: "03",
    title: "Работа",
    description:
      "Проводим калибровку, поверку или  аттестацию с использованием эталонного оборудования.",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    color: "from-emerald-500 to-teal-500",
  },
  {
    number: "04",
    title: "Документы",
    description:
      "Выдаём сертификат калибровки, свидетельство о поверке или другие необходимые документы.",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    color: "from-violet-500 to-purple-500",
  },
];

export default function Process() {
  return (
    <section className="py-20 sm:py-28 bg-white dark:bg-dark overflow-hidden">
      <div className="max-w-8xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Как мы работаем
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-dark dark:text-white mt-2">
            Простой процесс —{" "}
            <span className="text-gradient">точный результат</span>
          </h2>
          <p className="text-neutral dark:text-white/60 mt-4 max-w-2xl mx-auto">
            От заявки до получения документов — всего 4 простых шага
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-200 via-blue-200 via-emerald-200 to-violet-200 -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                <div className="bg-warm-bg dark:bg-dark-light rounded-3xl p-6 h-full relative z-10 hover:shadow-xl transition-shadow duration-300">
                  {/* Number badge */}
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-5 shadow-lg`}
                  >
                    <svg
                      className="w-7 h-7 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d={step.icon}
                      />
                    </svg>
                  </div>

                  {/* Step number */}
                  <div className="absolute top-4 right-4 text-5xl font-extrabold text-gray-100 dark:text-white/10">
                    {step.number}
                  </div>

                  <h3 className="text-xl font-bold text-dark dark:text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-neutral dark:text-white/60 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 z-20 translate-y-[-50%]">
                    <div className="w-8 h-8 bg-white dark:bg-dark-light rounded-full shadow-md flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
