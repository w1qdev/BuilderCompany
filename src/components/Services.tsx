"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

const tabs = [
  {
    id: "construction",
    label: "Строительство",
    services: [
      {
        title: "Строительство домов",
        description:
          "Возведение жилых домов из кирпича, газобетона, каркасных конструкций под ключ",
        icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
        price: "от 45 000 руб/м²",
      },
      {
        title: "Коммерческое строительство",
        description:
          "Строительство торговых центров, офисных зданий, складских комплексов",
        icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
        price: "от 35 000 руб/м²",
      },
      {
        title: "Фундаментные работы",
        description:
          "Ленточные, плитные, свайные фундаменты. Расчёт несущей способности",
        icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z",
        price: "от 8 000 руб/м²",
      },
      {
        title: "Кровельные работы",
        description:
          "Монтаж и ремонт кровли любой сложности. Металлочерепица, мягкая кровля",
        icon: "M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12",
        price: "от 12 000 руб/м²",
      },
    ],
  },
  {
    id: "renovation",
    label: "Ремонт",
    services: [
      {
        title: "Капитальный ремонт",
        description:
          "Полная реконструкция помещений: демонтаж, перепланировка, отделка",
        icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
        price: "от 15 000 руб/м²",
      },
      {
        title: "Косметический ремонт",
        description:
          "Обновление интерьера: покраска, обои, замена напольных покрытий",
        icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
        price: "от 5 000 руб/м²",
      },
      {
        title: "Отделка фасада",
        description:
          "Утепление и декоративная отделка фасадов. Вентилируемые фасады",
        icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z",
        price: "от 8 000 руб/м²",
      },
      {
        title: "Электромонтажные работы",
        description:
          "Проектирование и монтаж электросетей, освещения, систем безопасности",
        icon: "M13 10V3L4 14h7v7l9-11h-7z",
        price: "от 2 500 руб/м²",
      },
    ],
  },
  {
    id: "design",
    label: "Проектирование",
    services: [
      {
        title: "Архитектурное проектирование",
        description:
          "Разработка архитектурных решений, 3D-визуализация, рабочая документация",
        icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
        price: "от 2 500 руб/м²",
      },
      {
        title: "Дизайн интерьера",
        description:
          "Создание уникальных интерьеров, подбор материалов и мебели",
        icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
        price: "от 1 500 руб/м²",
      },
      {
        title: "Ландшафтный дизайн",
        description:
          "Проектирование и благоустройство территории, озеленение, малые формы",
        icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
        price: "от 800 руб/м²",
      },
      {
        title: "Инженерные коммуникации",
        description:
          "Проектирование систем отопления, водоснабжения, канализации, вентиляции",
        icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
        price: "от 1 200 руб/м²",
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
            Полный цикл строительных работ — от идеи до реализации
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
