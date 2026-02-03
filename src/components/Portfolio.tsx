"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import PortfolioLightbox from "./PortfolioLightbox";

export interface Project {
  title: string;
  category: string;
  area: string;
  year: string;
  gradient: string;
  icon: string;
}

const projects: Project[] = [
  {
    title: "Газпром нефть",
    category: "Калибровка СИ",
    area: "250+ приборов",
    year: "2025",
    gradient: "from-orange-500 to-amber-600",
    icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
  },
  {
    title: "Фармстандарт",
    category: "Сертификация ISO 9001",
    area: "Система менеджмента",
    year: "2024",
    gradient: "from-blue-500 to-indigo-600",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  {
    title: "ТГК-1",
    category: "Поверка счётчиков",
    area: "1000+ единиц",
    year: "2024",
    gradient: "from-emerald-500 to-teal-600",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
  },
  {
    title: "Северсталь",
    category: "Калибровка манометров",
    area: "500+ приборов",
    year: "2024",
    gradient: "from-slate-500 to-gray-700",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    title: "РЖД",
    category: "Сертификация продукции",
    area: "ТР ТС",
    year: "2023",
    gradient: "from-violet-500 to-purple-600",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    title: "Биокад",
    category: "Калибровка весов",
    area: "150+ единиц",
    year: "2023",
    gradient: "from-rose-500 to-pink-600",
    icon: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
  },
];

export default function Portfolio() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const visibleProjects = projects;

  return (
    <section id="portfolio" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Портфолио
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-dark mt-2">
            Наши <span className="text-gradient">клиенты</span>
          </h2>
          <p className="text-neutral mt-4 max-w-2xl mx-auto">
            Нам доверяют крупнейшие предприятия России.
            Посмотрите наши реализованные проекты.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {visibleProjects.map((project, i) => (
            <motion.div
              key={project.title}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
              className={`group relative cursor-pointer rounded-2xl overflow-hidden ${
                i === 0 ? "md:col-span-2 md:row-span-1" : ""
              } ${i >= 4 ? "hidden sm:block" : ""}`}
              onClick={() => setLightboxIndex(i)}
            >
              {/* Gradient placeholder */}
              <div
                className={`bg-gradient-to-br ${project.gradient} w-full ${
                  i === 0 ? "h-72 md:h-80" : "h-64"
                } flex items-center justify-center`}
              >
                <svg
                  className="w-16 h-16 text-white/30"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d={project.icon}
                  />
                </svg>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-dark/0 group-hover:bg-dark/70 transition-all duration-300 flex items-end">
                <div className="p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 w-full">
                  <h3 className="text-white font-bold text-lg mb-1">
                    {project.title}
                  </h3>
                  <p className="text-white/70 text-sm mb-3">
                    {project.category}
                  </p>
                  <div className="flex gap-4 text-xs text-white/60">
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-3.5 h-3.5"
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
                    </span>
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {project.year}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <PortfolioLightbox
        projects={projects}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </section>
  );
}
