"use client";

import { motion } from "framer-motion";

interface Features {
  icon: string;
  title: string;
  description?: string;
}

const features: Features[] = [
  {
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    title: "Высокая точность",
    description: "Погрешность измерений не превышает 0,01%. Используем сертифицированное эталонное оборудование ведущих мировых производителей.",
  },
  {
    icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    title: "Эталонное оборудование",
    description: "Наша метрологическая лаборатория оснащена современными средствами измерений, аттестованными в соответствии с ГОСТ.",
  },
  {
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    title: "Научный подход",
    description: "Применяем научно обоснованные методики поверки и калибровки. Все процедуры выполняются строго по утвержденным методикам.",
  },
];

interface ScienceProps {
  onOpenModal: () => void;
}

export default function Science({ onOpenModal }: ScienceProps) {
  return (
    <section className="py-20 sm:py-28 bg-gradient-to-b from-dark via-dark-light to-dark overflow-hidden">
      <div className="max-w-8xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">
              Научная точность
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-6">
              Метрология — это <span className="text-gradient">наука</span>
            </h2>
            <p className="text-white/70 leading-relaxed mb-8">
              Метрология — наука об измерениях, методах и средствах обеспечения
              их единства и способах достижения требуемой точности. Мы применяем
              новейшие научные методы для обеспечения максимальной точности
              ваших измерительных приборов.
            </p>

            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4 bg-white/5 rounded-2xl p-4 backdrop-blur-sm border border-white/10"
                >
                  <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shrink-0">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d={feature.icon}
                      />
                    </svg>
                  </div>
                  <div className="flex flex-col justify-center">
                    <h3 className="text-white font-semibold mb-1">
                      {feature.title}
                    </h3>
                    {feature.description && (
                      <p className="text-white/60 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right content - More text and CTA */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            className="relative"
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 space-y-6">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white">
                  Профессиональная метрологическая лаборатория
                </h3>
                <p className="text-white/70 leading-relaxed">
                  Наша метрологическая лаборатория оснащена современным
                  оборудованием для проведения всех видов метрологических работ.
                  Мы выполняем поверку и калибровку средств измерений
                  в соответствии с требованиями ГОСТ.
                </p>
                <p className="text-white/70 leading-relaxed">
                  Работаем с предприятиями всех форм собственности. Оформляем
                  полный пакет документов по результатам проведенных работ
                  с подробными протоколами измерений.
                </p>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 space-y-3">
                <h4 className="text-white font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Что входит в услугу:
                </h4>
                <ul className="space-y-2 text-white/70 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Проведение измерений по аттестованным методикам</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Оформление свидетельств и протоколов</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Внесение результатов в федеральный реестр</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Консультации по метрологическому обеспечению</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onOpenModal}
                className="w-full gradient-primary text-white px-6 py-4 rounded-2xl font-semibold hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105"
              >
                Получить консультацию
              </button>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 gradient-primary rounded-2xl opacity-20 blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary-light/20 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
