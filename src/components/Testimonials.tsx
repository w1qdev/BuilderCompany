"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const testimonials = [
  {
    name: "Алексей Петров",
    position: "Главный метролог",
    company: "Газпром нефть",
    text: "Сотрудничаем с ЦСМ уже более 5 лет. Всегда качественная работа, соблюдение сроков и профессиональный подход. Рекомендуем как надёжного партнёра.",
    rating: 5,
  },
  {
    name: "Елена Смирнова",
    position: "Директор по качеству",
    company: "Фармстандарт",
    text: "Благодарим за оперативную сертификацию ISO 9001. Команда специалистов помогла подготовить всю документацию и успешно пройти аудит.",
    rating: 5,
  },
  {
    name: "Дмитрий Козлов",
    position: "Начальник ОТК",
    company: "Северсталь",
    text: "Калибровка 500+ манометров выполнена в рекордные сроки. Отличное качество работы, все документы оформлены безупречно.",
    rating: 5,
  },
  {
    name: "Марина Волкова",
    position: "Руководитель лаборатории",
    company: "Биокад",
    text: "Очень довольны работой с центром. Калибровка лабораторного оборудования проведена на высшем уровне, с подробными протоколами.",
    rating: 5,
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goTo = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goNext = () => goTo((currentIndex + 1) % testimonials.length);
  const goPrev = () =>
    goTo((currentIndex - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="py-20 sm:py-28 gradient-dark overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Отзывы
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Что говорят наши <span className="text-gradient">клиенты</span>
          </h2>
        </motion.div>

        <div className="relative flex items-center flex-col">
          {/* Navigation arrows */}
          <button
            onClick={goPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all group"
          >
            <svg
              className="w-5 h-5 text-white group-hover:text-primary transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={goNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all group"
          >
            <svg
              className="w-5 h-5 text-white group-hover:text-primary transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Testimonial card */}
          <div className="overflow-hidden w-[80%]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.4 }}
                className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 sm:p-12 border border-white/10"
              >
                {/* Quote icon */}
                <div className="mb-6">
                  <svg
                    className="w-12 h-12 text-primary/30"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>

                {/* Text */}
                <p className="text-white/90 text-lg sm:text-xl leading-relaxed mb-8">
                  {testimonials[currentIndex].text}
                </p>

                {/* Author */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                      {testimonials[currentIndex].name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-white font-semibold">
                        {testimonials[currentIndex].name}
                      </div>
                      <div className="text-white/60 text-sm">
                        {testimonials[currentIndex].position}
                      </div>
                      <div className="text-primary text-sm font-medium">
                        {testimonials[currentIndex].company}
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex gap-1">
                    {Array.from({
                      length: testimonials[currentIndex].rating,
                    }).map((_, i) => (
                      <svg
                        key={i}
                        className="w-5 h-5 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-primary w-8"
                    : "bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
