"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Logo from "@/components/Logo";

const projects = [
  {
    title: "Газпром нефть",
    category: "Калибровка",
    description:
      "Комплексная калибровка 250+ единиц измерительного оборудования на нефтеперерабатывающем заводе.",
    area: "250+ приборов",
    duration: "3 месяца",
    year: "2025",
    image:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
  },
  {
    title: "ТГК-1",
    category: "Поверка",
    description:
      "Периодическая поверка 1000+ счётчиков электроэнергии и тепла на объектах энергетической компании.",
    area: "1000+ счётчиков",
    duration: "6 месяцев",
    year: "2024",
    image:
      "https://images.unsplash.com/photo-1413882353314-73389f63b6fd?w=800&q=80",
  },
  {
    title: "Северсталь",
    category: "Калибровка",
    description:
      "Калибровка манометров, термометров и весового оборудования на металлургическом комбинате.",
    area: "500+ приборов",
    duration: "2 месяца",
    year: "2024",
    image:
      "https://images.unsplash.com/photo-1567789884554-0b844b597180?w=800&q=80",
  },
  {
    title: "РЖД",
    category: "Поверка",
    description:
      "Поверка манометров, датчиков давления и температуры для железнодорожного транспорта.",
    area: "Железная дорога",
    duration: "5 месяцев",
    year: "2023",
    image:
      "https://images.unsplash.com/photo-1532105956626-9569c03602f6?w=800&q=80",
  },
  {
    title: "Биокад",
    category: "Калибровка",
    description:
      "Калибровка лабораторных весов, пипеток и термостатов для биотехнологической лаборатории.",
    area: "150+ единиц",
    duration: "1 месяц",
    year: "2023",
    image:
      "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&q=80",
  },
];

const categoryColors: Record<string, string> = {
  Калибровка:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Поверка:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  Аттестация:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-warm-bg dark:bg-dark">
      {/* Header */}
      <div className="gradient-dark text-white">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Logo size="sm" />
          </Link>
          <span className="text-white/40 text-sm">/ Портфолио</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-dark dark:text-white mb-4">
            Наши <span className="text-gradient">клиенты</span>
          </h1>
          <p className="text-neutral dark:text-white/60 max-w-2xl mx-auto">
            Нам доверяют крупнейшие предприятия России. За 10+ лет работы мы
            выполнили более 5000 проектов по калибровке, поверке и аттестации
            измерительного оборудования.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group bg-white dark:bg-dark-light rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Project image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={project.image}
                  alt={`${project.title} — ${project.category}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark/60 via-transparent to-transparent" />
              </div>

              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${categoryColors[project.category] || "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"}`}
                  >
                    {project.category}
                  </span>
                  <span className="text-xs text-neutral-light dark:text-white/40">
                    {project.year}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-dark dark:text-white mb-2">
                  {project.title}
                </h3>
                <p className="text-neutral dark:text-white/60 text-sm leading-relaxed mb-4">
                  {project.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-neutral-light dark:text-white/40">
                  <div className="flex items-center gap-1">
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
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                      />
                    </svg>
                    {project.area}
                  </div>
                  <div className="flex items-center gap-1">
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {project.duration}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/"
            className="text-primary hover:underline text-sm font-medium"
          >
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}
