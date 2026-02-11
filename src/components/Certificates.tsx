"use client";

import { motion } from "framer-motion";

const certificates = [
  {
    title: "ГОСТ Р 8.568-2017",
    issuer: "Росстандарт",
    number: "Стандарт РФ",
    description: "Аттестация испытательного оборудования по государственному стандарту",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    color: "from-blue-500 to-indigo-600",
  },
  {
    title: "ISO 17025:2017",
    issuer: "TÜV Rheinland",
    number: "Сертификат № 12345-ISO",
    description: "Международный стандарт для испытательных лабораторий",
    icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "from-emerald-500 to-teal-600",
  },
  {
    title: "ISO 9001:2015",
    issuer: "Bureau Veritas",
    number: "Сертификат № 67890-QMS",
    description: "Система менеджмента качества",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    color: "from-violet-500 to-purple-600",
  },
  {
    title: "Свидетельство о поверке",
    issuer: "Росстандарт",
    number: "Лицензия № 45678",
    description: "Право проведения поверки средств измерений",
    icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    color: "from-orange-500 to-amber-600",
  },
];

export default function Certificates() {
  return (
    <section className="py-20 sm:py-28 bg-white dark:bg-dark">
      <div className="max-w-8xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Стандарты качества
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-dark dark:text-white mt-2">
            Наши <span className="text-gradient">сертификаты</span>
          </h2>
          <p className="text-neutral dark:text-white/60 mt-4 max-w-2xl mx-auto">
            Все работы выполняются в соответствии с международными стандартами
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {certificates.map((cert, index) => (
            <motion.div
              key={cert.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div className="bg-warm-bg dark:bg-dark-light rounded-3xl p-6 h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-primary/20">
                {/* Certificate icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cert.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
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
                      d={cert.icon}
                    />
                  </svg>
                </div>

                {/* Certificate details */}
                <h3 className="text-lg font-bold text-dark dark:text-white mb-1">{cert.title}</h3>
                <p className="text-primary text-sm font-medium mb-2">{cert.issuer}</p>
                <p className="text-neutral-light dark:text-white/40 text-xs mb-3">{cert.number}</p>
                <p className="text-neutral dark:text-white/60 text-sm leading-relaxed">{cert.description}</p>

                {/* Decorative seal */}
                <div className="absolute top-4 right-4 w-10 h-10 opacity-10 group-hover:opacity-20 transition-opacity">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="text-primary">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-8 text-neutral-light dark:text-white/50"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">Соответствие ГОСТ</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">Международные стандарты</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">Юридическая сила документов</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
