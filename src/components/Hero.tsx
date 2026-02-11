"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import AnimatedCounter from "./AnimatedCounter";
import RotatingText from "./RotatingText";

interface HeroProps {
  onOpenModal: () => void;
}

export default function Hero({ onOpenModal }: HeroProps) {
  const { scrollY } = useScroll();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Parallax transforms (disabled on mobile via isMobile check below)
  const patternY = useTransform(scrollY, [0, 500], [0, 150]);
  const topCircleY = useTransform(scrollY, [0, 500], [0, -100]);
  const bottomCircleY = useTransform(scrollY, [0, 500], [0, -60]);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark-light to-dark" />
      <motion.div
        className="absolute inset-0 opacity-20"
        style={isMobile ? undefined : { y: patternY }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23E87A2E' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </motion.div>

      {/* Decorative circles with parallax */}
      <motion.div
        className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
        style={isMobile ? undefined : { y: topCircleY }}
      />
      <motion.div
        className="absolute bottom-20 left-10 w-96 h-96 bg-primary-light/10 rounded-full blur-3xl"
        style={isMobile ? undefined : { y: bottomCircleY }}
      />

      <div className="relative z-10 max-w-8xl mx-auto px-4 sm:px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block gradient-primary text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            Центр стандартизации и метрологии
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-tight mb-6"
        >
          Выполняем работу <RotatingText />
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10"
        >
          Аттестация, поверка и калибровка измерительного оборудования. Более 10
          лет опыта.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={onOpenModal}
            className="gradient-primary text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105"
          >
            Оставить заявку
          </button>
          <a
            href="#services"
            className="border-2 border-white/30 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-white/10 transition-all duration-300"
          >
            Наши услуги
          </a>
        </motion.div>

        {/* Stats with animated counters */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 flex justify-center items-center md:grid-cols-4 gap-6"
        >
          {[{ target: 10, suffix: "+", label: "Лет опыта" }].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-primary">
                <AnimatedCounter target={stat.target} suffix={stat.suffix} />
              </div>
              <div className="text-sm text-white/60 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
