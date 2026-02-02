"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import AnimatedCounter from "./AnimatedCounter";

const advantages = [
  {
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    title: "Гарантия качества",
    description:
      "Предоставляем гарантию на все виды работ от 3 до 10 лет. Используем только сертифицированные материалы.",
  },
  {
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    title: "Соблюдение сроков",
    description:
      "Фиксируем сроки в договоре. За 15 лет ни один проект не был сдан позже обещанного срока.",
  },
  {
    icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
    title: "Прозрачные цены",
    description:
      "Подробная смета до начала работ. Никаких скрытых платежей и навязанных услуг.",
  },
  {
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    title: "Опытная команда",
    description:
      "120+ квалифицированных специалистов с опытом работы от 5 лет в строительной отрасли.",
  },
  {
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    title: "Полная документация",
    description:
      "Оформляем всю необходимую документацию, разрешения и акты в соответствии с законодательством.",
  },
  {
    icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
    title: "Поддержка 24/7",
    description:
      "Персональный менеджер на связи 24/7. Оперативно решаем любые вопросы по проекту.",
  },
];

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const decorY = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <section id="about" className="py-20 sm:py-28 bg-warm-light" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* About text block */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">
              О нас
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-dark mt-2 mb-6">
              Строим будущее <span className="text-gradient">с 2009 года</span>
            </h2>
            <p className="text-neutral leading-relaxed mb-4">
              СтройКомпани — одна из ведущих строительных компаний региона. За
              более чем 15 лет работы мы реализовали свыше 500 проектов
              различной сложности: от частных домов до крупных коммерческих
              объектов.
            </p>
            <p className="text-neutral leading-relaxed mb-6">
              Наша команда из 120+ профессионалов использует современные
              технологии строительства и только проверенные материалы от
              надёжных поставщиков. Мы гарантируем высокое качество работ и
              строгое соблюдение сроков.
            </p>
            <div className="flex flex-wrap gap-4 p-3">
              <div className="bg-white rounded-2xl p-4 shadow-md flex items-center gap-3">
                <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-dark text-sm">СРО</div>
                  <div className="text-xs text-neutral">Допуск к работам</div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-md flex items-center gap-3">
                <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-dark text-sm">ISO 9001</div>
                  <div className="text-xs text-neutral">Сертификат</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-dark to-dark-light rounded-3xl p-8 sm:p-10">
              <div className="grid grid-cols-2 gap-6">
                {[
                  { target: 15, suffix: "+", label: "Лет на рынке" },
                  { target: 500, suffix: "+", label: "Проектов сдано" },
                  { target: 120, suffix: "+", label: "Специалистов" },
                  { target: 50, suffix: "K+", label: "м² построено" },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-3xl sm:text-4xl font-extrabold text-primary mb-1">
                      <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                    </div>
                    <div className="text-white/60 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <motion.div
              className="absolute -bottom-4 -right-4 w-24 h-24 gradient-primary rounded-2xl opacity-20 blur-xl"
              style={isMobile ? undefined : { y: decorY }}
            />
          </motion.div>
        </div>

        {/* Advantages grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-12"
        >
          <h3 className="text-2xl sm:text-3xl font-extrabold text-dark">
            Почему выбирают нас
          </h3>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {advantages.map((adv) => (
            <motion.div
              key={adv.title}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
              }}
              className="group bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300"
            >
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
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
                    d={adv.icon}
                  />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-dark mb-2">{adv.title}</h4>
              <p className="text-sm text-neutral leading-relaxed">
                {adv.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
