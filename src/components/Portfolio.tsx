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
    title: "ЖК «Солнечный»",
    category: "Жилой комплекс",
    area: "12 500 м²",
    year: "2023",
    gradient: "from-orange-500 to-amber-600",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1",
  },
  {
    title: "ТЦ «Меридиан»",
    category: "Коммерческая недвижимость",
    area: "8 200 м²",
    year: "2023",
    gradient: "from-blue-500 to-indigo-600",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    title: "Коттеджный посёлок «Лесной»",
    category: "Малоэтажное строительство",
    area: "24 домов",
    year: "2022",
    gradient: "from-emerald-500 to-teal-600",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1",
  },
  {
    title: "Склад «Логистик Плюс»",
    category: "Промышленное строительство",
    area: "5 600 м²",
    year: "2022",
    gradient: "from-slate-500 to-gray-700",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
  {
    title: "Офисный центр «Прогресс»",
    category: "Коммерческая недвижимость",
    area: "6 800 м²",
    year: "2021",
    gradient: "from-violet-500 to-purple-600",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    title: "Реконструкция школы №12",
    category: "Социальные объекты",
    area: "3 400 м²",
    year: "2021",
    gradient: "from-rose-500 to-pink-600",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
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
            Наши <span className="text-gradient">проекты</span>
          </h2>
          <p className="text-neutral mt-4 max-w-2xl mx-auto">
            Каждый проект — результат слаженной работы команды профессионалов.
            Посмотрите, что мы уже построили.
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
