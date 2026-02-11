"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const projects = [
  {
    title: "Газпром нефть",
    category: "Калибровка",
    description: "Комплексная калибровка 250+ единиц измерительного оборудования на нефтеперерабатывающем заводе.",
    area: "250+ приборов",
    duration: "3 месяца",
    year: "2025",
    image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80", // Industrial facility
  },
  {
    title: "Фармстандарт",
    category: "Сертификация ISO",
    description: "Сертификация системы менеджмента качества ISO 9001:2015 для фармацевтического производства.",
    area: "ISO 9001",
    duration: "4 месяца",
    year: "2024",
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80", // Pharmaceutical laboratory
  },
  {
    title: "ТГК-1",
    category: "Поверка",
    description: "Периодическая поверка 1000+ счётчиков электроэнергии и тепла на объектах энергетической компании.",
    area: "1000+ счётчиков",
    duration: "6 месяцев",
    year: "2024",
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80", // Energy/electricity meters
  },
  {
    title: "Северсталь",
    category: "Калибровка",
    description: "Калибровка манометров, термометров и весового оборудования на металлургическом комбинате.",
    area: "500+ приборов",
    duration: "2 месяца",
    year: "2024",
    image: "https://images.unsplash.com/photo-1565071559227-20ab25b7685e?w=800&q=80", // Steel manufacturing
  },
  {
    title: "РЖД",
    category: "Сертификация",
    description: "Сертификация железнодорожного оборудования по требованиям ТР ТС 001/2011.",
    area: "ТР ТС",
    duration: "5 месяцев",
    year: "2023",
    image: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&q=80", // Railway/trains
  },
  {
    title: "Биокад",
    category: "Калибровка",
    description: "Калибровка лабораторных весов, пипеток и термостатов для биотехнологической лаборатории.",
    area: "150+ единиц",
    duration: "1 месяц",
    year: "2023",
    image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80", // Laboratory equipment
  },
];

const categoryColors: Record<string, string> = {
  "Калибровка": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Поверка": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "Сертификация": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "Сертификация ISO": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  "Испытания": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
};

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-warm-bg dark:bg-dark">
      {/* Header */}
      <div className="gradient-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="font-bold">ЦСМ</span>
          </Link>
          <span className="text-white/40 text-sm">/ Портфолио</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-dark dark:text-white mb-4">
            Наши <span className="text-gradient">клиенты</span>
          </h1>
          <p className="text-neutral dark:text-white/60 max-w-2xl mx-auto">
            Нам доверяют крупнейшие предприятия России. За 10+ лет работы мы выполнили
            более 5000 проектов по калибровке, поверке и сертификации.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white dark:bg-dark-light rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Project image */}
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={project.image}
                  alt={`${project.title} - ${project.category}`}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark/60 via-transparent to-transparent" />
              </div>

              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${categoryColors[project.category] || "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"}`}>
                    {project.category}
                  </span>
                  <span className="text-xs text-neutral-light dark:text-white/40">{project.year}</span>
                </div>

                <h3 className="text-lg font-bold text-dark dark:text-white mb-2">{project.title}</h3>
                <p className="text-neutral dark:text-white/60 text-sm leading-relaxed mb-4">{project.description}</p>

                <div className="flex items-center gap-4 text-xs text-neutral-light dark:text-white/40">
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
