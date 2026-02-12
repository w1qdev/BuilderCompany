"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import AnimatedCounter from "./AnimatedCounter";

const advantages = [
  {
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    title: "Соблюдение сроков",
    description:
      "Выполняем работы в согласованные сроки. Срочная поверка и калибровка за 3-5 рабочих дней.",
  },
  {
    icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
    title: "Точность измерений",
    description:
      "Современное эталонное оборудование обеспечивает высочайшую точность измерений.",
  },
  {
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    title: "Опытные метрологи",
    description:
      "Квалифицированные специалисты-метрологи с опытом работы от 5 лет.",
  },
  {
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    title: "Полный пакет документов",
    description:
      "Оформляем свидетельства о поверке, сертификаты калибровки, протоколы аттестации.",
  },
  {
    icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
    title: "Выезд к клиенту",
    description:
      "Проводим поверку и калибровку на территории заказчика по всей России.",
  },
  {
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    title: "Прозрачное ценообразование",
    description:
      "Фиксированные цены без скрытых доплат. Предварительный расчет стоимости до начала работ.",
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
    <section
      id="about"
      className="py-20 sm:py-28 bg-warm-light dark:bg-dark"
      ref={sectionRef}
    >
      <div className="max-w-8xl mx-auto px-4 sm:px-6">
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
            <h2 className="text-3xl sm:text-4xl font-extrabold text-dark dark:text-white mt-2 mb-6">
              Работаем <span className="text-gradient">с 2014 года</span>
            </h2>
            <p className="text-neutral dark:text-white/60 leading-relaxed mb-4">
              Центр Стандартизации и Метрологии осуществляет организацию поверки
              метрологических услуг. За более чем 10 лет работы мы выдали более
              5000 свидетельств о поверке.
              <br />
              Центр Стандартизации и Метрологии (ЦСМ) в соответствии с законом
              «Об обеспечении единства измерений» от 26.06.08 год №102-ФЗ
              оказывает услуги в качестве всероссийского центра метрологии.
              Центр осуществляет полномочия по всей территории России в сферах
              технического регулирования, обеспечения единства измерений,
              стандартизации, оценки соответствия. В соответствии с имеющимися
              аттестатами аккредитации, сертификатами и лицензиями ЦСМ
              выполняются следующие работы и услуги: поверка средств измерений;
              калибровка средств измерений; техническое обслуживание и ремонт
              средств измерений; испытания средств измерений с целью утверждения
              типа; разработка и аттестация методик выполнения измерений;
              аттестация испытательного оборудования; аттестация и аккредитация
              лабораторий; сертификация. Для выполнения перечисленных задач и
              работ ЦСМ привлекает аккредитованные лаборатории, имеющие в своём
              штате высококвалифицированных метрологов, необходимые эталоны и
              вспомогательное оборудование, помещения, соответствующие
              установленным требованиям и конечно необходимую область
              аккредитации. Список лабораторий и документация находятся в
              разделе «Аттестаты аккредитации»
            </p>
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
                  { target: 10, suffix: "+", label: "Лет на рынке" },
                  { target: 5000, suffix: "+", label: "Поверок выдано" },
                  { target: 500, suffix: "+", label: "Довольных клиентов" },
                  { target: 100, suffix: "%", label: "Качество работы" },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-3xl sm:text-4xl font-extrabold text-primary mb-1">
                      <AnimatedCounter
                        target={stat.target}
                        suffix={stat.suffix}
                      />
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
          <h3 className="text-2xl sm:text-3xl font-extrabold text-dark dark:text-white">
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
              className="group bg-white dark:bg-dark-light rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300"
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
              <h4 className="text-lg font-bold text-dark dark:text-white mb-2">
                {adv.title}
              </h4>
              <p className="text-sm text-neutral dark:text-white/60 leading-relaxed">
                {adv.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
