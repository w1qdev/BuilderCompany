"use client";

import { motion } from "framer-motion";
import { Check, Truck } from "lucide-react";

interface Steps {
  number: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const steps: Steps[] = [
  {
    number: "01",
    title: "Транспортной компанией",
    description:
      "Отправьте через ТК (Деловые Линии, ПЭК, СДЭК). От 500 руб в зависимости от габаритов",
    icon: Truck,
    color: "from-emerald-500 to-teal-500",
  },
];

export default function Delivery() {
  return (
    <section className="py-20 sm:py-28 bg-white dark:bg-dark overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Как мы доставляем
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-dark dark:text-white mt-2">
            Простая доставка
          </h2>
          <p className="text-neutral dark:text-white/60 mt-4 max-w-2xl mx-auto">
            Есть несколько вариантов доставки приборов на поверку, калибровку и
            аттестацию:
          </p>
        </motion.div>

        <div className="relative">
          <div className="flex justify-center items-center lg:grid-cols-3 gap-8">
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
                    <step.icon className="w-7 h-7 text-white" />
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
                      {/* <svg
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
                      </svg> */}

                      <Check className="w-4 h-4 text-primary" />
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
