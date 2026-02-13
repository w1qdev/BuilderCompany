"use client";

import { motion } from "framer-motion";

const projects = [
  {
    title: "Газпром нефть",
    category: "Калибровка",
    description:
      "Комплексная калибровка 250+ единиц измерительного оборудования на нефтеперерабатывающем заводе.",
    area: "250+ приборов",
    duration: "3 месяца",
    year: "2025",
    image: "/images/portfolio/portfolio-1.webp",
  },
  {
    title: "ТГК-1",
    category: "Поверка",
    description:
      "Периодическая поверка 1000+ счётчиков электроэнергии и тепла на объектах энергетической компании.",
    area: "1000+ счётчиков",
    duration: "6 месяцев",
    year: "2024",
    image: "/images/portfolio/portfolio-2.webp",
  },
  {
    title: "Северсталь",
    category: "Калибровка",
    description:
      "Калибровка манометров, термометров и весового оборудования на металлургическом комбинате.",
    area: "500+ приборов",
    duration: "2 месяца",
    year: "2024",
    image: "/images/portfolio/portfolio-3.webp",
  },
  {
    title: "РЖД",
    category: "Поверка",
    description:
      "Поверка манометров, датчиков давления и температуры для железнодорожного транспорта.",
    area: "Железная дорога",
    duration: "5 месяцев",
    year: "2023",
    image: "/images/portfolio/portfolio-4.webp",
  },
  {
    title: "Биокад",
    category: "Калибровка",
    description:
      "Калибровка лабораторных весов, пипеток и термостатов для биотехнологической лаборатории.",
    area: "150+ единиц",
    duration: "1 месяц",
    year: "2023",
    image: "/images/portfolio/portfolio-5.webp",
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

export default function Portfolio() {
  return (
    <section id="portfolio" className="py-20 sm:py-28 bg-white dark:bg-dark">
      <div className="max-w-8xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Портфолио
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-dark dark:text-white mt-2">
            Наши <span className="text-gradient">клиенты</span>
          </h2>
          <p className="text-neutral dark:text-white/60 mt-4 max-w-2xl mx-auto">
            Нам доверяют крупнейшие предприятия России. За 10+ лет работы мы
            выполнили более 5000 проектов по калибровке, поверке и аттестации.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.15 }}
              className="group bg-warm-bg dark:bg-dark-light rounded-2xl overflow-hidden hover:shadow-xl transition-shadow"
            >
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
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${categoryColors[project.category] || "bg-gray-100 text-gray-700"}`}
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
      </div>
    </section>
  );
}
