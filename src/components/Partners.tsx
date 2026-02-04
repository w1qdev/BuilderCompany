"use client";

import { motion } from "framer-motion";

const partners = [
  { name: "Росстандарт", initials: "РС" },
  { name: "Росаккредитация", initials: "РА" },
  { name: "ВНИИМ", initials: "ВМ" },
  { name: "ВНИИМС", initials: "ВС" },
  { name: "Fluke", initials: "FL" },
  { name: "Yokogawa", initials: "YK" },
  { name: "Mettler Toledo", initials: "MT" },
  { name: "Keysight", initials: "KS" },
];

export default function Partners() {
  return (
    <section id="partners" className="py-20 sm:py-28 dark:bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Партнёры</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-dark dark:text-white mt-2">
            Работаем с лучшими
          </h2>
          <p className="text-neutral dark:text-white/60 mt-3 max-w-xl mx-auto">
            Сотрудничаем с ведущими организациями и производителями оборудования
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.05 } },
          }}
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4"
        >
          {partners.map((partner) => (
            <motion.div
              key={partner.name}
              variants={{
                hidden: { opacity: 0, scale: 0.9 },
                visible: { opacity: 1, scale: 1 },
              }}
              className="group bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-warm-bg rounded-xl flex items-center justify-center mb-2 group-hover:bg-primary/10 transition-colors">
                <span className="text-lg font-bold text-dark group-hover:text-primary transition-colors">
                  {partner.initials}
                </span>
              </div>
              <span className="text-xs text-neutral text-center font-medium">{partner.name}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
