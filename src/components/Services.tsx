"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

const tabs = [
  {
    id: "calibration",
    label: "Калибровка",
    services: [
      {
        title: "Калибровка СИ",
        description:
          "Калибровка средств измерений любой сложности с выдачей сертификата калибровки",
        icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
        price: "от 2 000 руб",
      },
      {
        title: "Калибровка манометров",
        description:
          "Калибровка манометров, вакуумметров и мановакуумметров всех классов точности",
        icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
        price: "от 1 500 руб",
      },
      {
        title: "Калибровка весов",
        description:
          "Калибровка лабораторных, технических и торговых весов с гирями",
        icon: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
        price: "от 2 500 руб",
      },
      {
        title: "Калибровка термометров",
        description:
          "Калибровка контактных и бесконтактных термометров, термопар, терморезисторов",
        icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
        price: "от 1 800 руб",
      },
    ],
  },
  {
    id: "verification",
    label: "Поверка",
    services: [
      {
        title: "Поверка счётчиков",
        description:
          "Поверка счётчиков воды, газа, электроэнергии и тепла без демонтажа",
        icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
        price: "от 800 руб",
      },
      {
        title: "Поверка манометров",
        description:
          "Государственная поверка манометров с выдачей свидетельства о поверке",
        icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
        price: "от 1 200 руб",
      },
      {
        title: "Поверка весов",
        description:
          "Периодическая и первичная поверка весоизмерительного оборудования",
        icon: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
        price: "от 2 000 руб",
      },
      {
        title: "Поверка термометров",
        description:
          "Поверка медицинских, лабораторных и промышленных термометров",
        icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
        price: "от 1 000 руб",
      },
    ],
  },
  {
    id: "certification",
    label: "Сертификация",
    services: [
      {
        title: "Сертификация продукции",
        description:
          "Оформление сертификатов соответствия ГОСТ Р, ТР ТС для продукции",
        icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
        price: "от 15 000 руб",
      },
      {
        title: "Декларирование",
        description:
          "Регистрация деклараций о соответствии в едином реестре ФСА",
        icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
        price: "от 12 000 руб",
      },
      {
        title: "Сертификация ISO",
        description:
          "Сертификация систем менеджмента качества ISO 9001, 14001, 45001",
        icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
        price: "от 35 000 руб",
      },
      {
        title: "Отказные письма",
        description:
          "Оформление отказных писем о том, что продукция не подлежит сертификации",
        icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
        price: "от 5 000 руб",
      },
    ],
  },
];

export default function Services() {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const activeTabData = tabs.find((t) => t.id === activeTab)!;

  return (
    <section id="services" className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Что мы делаем
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-dark mt-2">
            Наши услуги
          </h2>
          <p className="text-neutral mt-3 max-w-xl mx-auto">
            Полный спектр метрологических услуг — от поверки до сертификации
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-white rounded-2xl p-1.5 shadow-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? "gradient-primary text-white shadow-md"
                    : "text-neutral hover:text-dark"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={{
              visible: { transition: { staggerChildren: 0.08 } },
              // exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
            }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {activeTabData.services.map((service) => (
              <motion.div
                key={service.title}
                className="group bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
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
                      d={service.icon}
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-dark mb-2">
                  {service.title}
                </h3>
                <p className="text-sm text-neutral leading-relaxed mb-4">
                  {service.description}
                </p>
                <div className="text-primary font-bold text-sm">
                  {service.price}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
