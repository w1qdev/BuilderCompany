"use client";

import AnimatedCounter from "@/components/AnimatedCounter";
import { motion } from "framer-motion";

const clients = [
  { name: "Газпром нефть", initials: "ГН", color: "from-blue-500 to-blue-700" },
  { name: "Роснефть", initials: "РН", color: "from-red-500 to-red-700" },
  { name: "СИБУР", initials: "СБ", color: "from-orange-500 to-amber-600" },
  { name: "Лукойл", initials: "ЛК", color: "from-red-600 to-rose-700" },
  { name: "РусГидро", initials: "РГ", color: "from-cyan-500 to-blue-600" },
  { name: "Металлоинвест", initials: "МИ", color: "from-slate-500 to-slate-700" },
  { name: "НЛМК", initials: "НЛ", color: "from-indigo-500 to-indigo-700" },
  { name: "ФСК ЕЭС", initials: "ФЭ", color: "from-yellow-500 to-orange-500" },
  { name: "Транснефть", initials: "ТН", color: "from-green-600 to-emerald-700" },
  { name: "Росатом", initials: "РА", color: "from-violet-500 to-purple-700" },
];

const stats = [
  { target: 500, suffix: "+", label: "Постоянных клиентов" },
  { target: 15, suffix: "", label: "Лет на рынке" },
  { target: 12000, suffix: "+", label: "Поверок выполнено" },
  { target: 98, suffix: "%", label: "Довольных клиентов" },
];

export default function Clients() {
  return (
    <section id="clients" className="py-20 sm:py-28 bg-white dark:bg-dark overflow-hidden">
      <div className="max-w-8xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Нам доверяют
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-dark dark:text-white mt-2">
            Наши клиенты
          </h2>
          <p className="text-neutral dark:text-white/60 mt-3 max-w-xl mx-auto">
            Ведущие промышленные предприятия России доверяют нам точность своих
            измерений
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              className="text-center bg-warm-bg dark:bg-dark-light rounded-2xl p-6"
            >
              <div className="text-3xl sm:text-4xl font-extrabold text-gradient mb-1">
                <AnimatedCounter target={stat.target} suffix={stat.suffix} />
              </div>
              <div className="text-sm text-neutral dark:text-white/60">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Client logos */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.05 } },
          }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4"
        >
          {clients.map((client) => (
            <motion.div
              key={client.name}
              variants={{
                hidden: { opacity: 0, scale: 0.85 },
                visible: { opacity: 1, scale: 1 },
              }}
              className="group bg-warm-bg dark:bg-dark-light rounded-2xl p-5 flex flex-col items-center justify-center gap-3 hover:shadow-lg transition-shadow duration-300"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${client.color} flex items-center justify-center shadow-md`}
              >
                <span className="text-sm font-bold text-white">
                  {client.initials}
                </span>
              </div>
              <span className="text-xs text-neutral dark:text-white/60 text-center font-medium leading-tight">
                {client.name}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
