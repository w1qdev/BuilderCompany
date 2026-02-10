"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Three.js
const Atom3D = dynamic(() => import("./Atom3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] md:h-[500px] flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  ),
});

interface Features {
  icon: string;
  title: string;
  description?: string;
}

const features: Features[] = [
  {
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    title: "Высокая точность",
  },
  {
    icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    title: "Эталонное оборудование",
  },
  {
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    title: "Научный подход",
  },
];

export default function Science() {
  return (
    <section className="py-20 sm:py-28 bg-gradient-to-b from-dark via-dark-light to-dark overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
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
                  <div className="flex flex-col w-full h-12 justify-center">
                    <h3 className="text-white font-semibold mb-1">
                      {feature.title}
                    </h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 3D Atom */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            className="relative"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />

            <Atom3D />

            {/* Interactive hint */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2"
            >
              <svg
                className="w-4 h-4 text-white/60 animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                />
              </svg>
              <span className="text-white/60 text-xs">
                Перетащите для вращения
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
