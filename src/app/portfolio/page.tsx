"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const projects = [
  {
    title: "Жилой комплекс «Солнечный»",
    category: "Жилое строительство",
    description: "Строительство многоквартирного жилого дома на 120 квартир с подземным паркингом и благоустройством территории.",
    area: "12 500 м²",
    duration: "18 месяцев",
    year: "2024",
  },
  {
    title: "Торговый центр «Меридиан»",
    category: "Коммерческое строительство",
    description: "Проектирование и строительство современного торгового центра с зоной фудкорта и кинотеатром.",
    area: "8 200 м²",
    duration: "14 месяцев",
    year: "2023",
  },
  {
    title: "Коттеджный посёлок «Лесная поляна»",
    category: "Загородное строительство",
    description: "Комплексная застройка посёлка: 25 коттеджей, инженерные сети, дороги и общественные зоны.",
    area: "15 000 м²",
    duration: "24 месяца",
    year: "2023",
  },
  {
    title: "Офисный центр «Бизнес Парк»",
    category: "Коммерческое строительство",
    description: "Строительство класса А офисного здания с энергоэффективными решениями и современной инфраструктурой.",
    area: "6 800 м²",
    duration: "12 месяцев",
    year: "2022",
  },
  {
    title: "Частный дом в Подмосковье",
    category: "Частное строительство",
    description: "Строительство двухэтажного кирпичного дома с гаражом, ландшафтным дизайном и системой «умный дом».",
    area: "320 м²",
    duration: "8 месяцев",
    year: "2024",
  },
  {
    title: "Реконструкция фасада БЦ «Центральный»",
    category: "Реконструкция",
    description: "Полная реконструкция фасада с утеплением, заменой остекления и обновлением входной группы.",
    area: "4 500 м²",
    duration: "6 месяцев",
    year: "2022",
  },
];

const categoryColors: Record<string, string> = {
  "Жилое строительство": "bg-blue-100 text-blue-700",
  "Коммерческое строительство": "bg-purple-100 text-purple-700",
  "Загородное строительство": "bg-green-100 text-green-700",
  "Частное строительство": "bg-orange-100 text-orange-700",
  "Реконструкция": "bg-yellow-100 text-yellow-700",
};

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-warm-bg">
      {/* Header */}
      <div className="gradient-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="font-bold">СтройКомпани</span>
          </Link>
          <span className="text-white/40 text-sm">/ Портфолио</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-dark mb-4">
            Наши <span className="text-gradient">проекты</span>
          </h1>
          <p className="text-neutral max-w-2xl mx-auto">
            За более чем 15 лет работы мы реализовали свыше 500 проектов различного масштаба
            и сложности. Вот некоторые из них.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Placeholder image area */}
              <div className="h-48 gradient-dark flex items-center justify-center">
                <svg className="w-16 h-16 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${categoryColors[project.category] || "bg-gray-100 text-gray-700"}`}>
                    {project.category}
                  </span>
                  <span className="text-xs text-neutral-light">{project.year}</span>
                </div>

                <h3 className="text-lg font-bold text-dark mb-2">{project.title}</h3>
                <p className="text-neutral text-sm leading-relaxed mb-4">{project.description}</p>

                <div className="flex items-center gap-4 text-xs text-neutral-light">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    {project.area}
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {project.duration}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/" className="text-primary hover:underline text-sm font-medium">
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}
