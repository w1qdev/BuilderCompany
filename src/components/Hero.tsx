"use client";

import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useEffect, useState } from "react";
import AnimatedCounter from "./AnimatedCounter";
import RotatingText from "./RotatingText";

const heroImages = [
  "https://images.unsplash.com/photo-1581093588401-fbb62a02f120?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1920&auto=format&fit=crop",
];

interface HeroProps {
  onOpenModal: () => void;
}

export default function Hero({ onOpenModal }: HeroProps) {
  const { scrollY } = useScroll();
  const [isMobile, setIsMobile] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Parallax transform (disabled on mobile)
  const patternY = useTransform(scrollY, [0, 500], [0, 150]);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background slideshow */}
      <AnimatePresence mode="sync">
        <motion.div
          key={currentSlide}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.55 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          style={isMobile ? undefined : { y: patternY }}
        >
          <div
            className="absolute inset-0 w-full h-full bg-center bg-cover"
            style={{ backgroundImage: `url(${heroImages[currentSlide]})` }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Dark gradient overlay for text contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark/60 via-dark/50 to-dark/70" />

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

        {/* Slide indicators */}
        <div className="flex justify-center gap-2 mt-8">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                index === currentSlide
                  ? "bg-primary w-8"
                  : "bg-white/30 w-1.5 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
