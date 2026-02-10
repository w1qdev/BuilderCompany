"use client";

import { motion, useInView } from "framer-motion";
import {
  Activity,
  Droplets,
  Gauge,
  Plus,
  Target,
  Thermometer,
  Wifi,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface EquipmentItem {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  brand: string;
  spec: string;
  specLabel: string;
  category: string;
}

const items: EquipmentItem[] = [
  {
    icon: Thermometer,
    name: "Калибратор температуры",
    brand: "Fluke 6100A",
    spec: "−40 … +1100 °C",
    specLabel: "Диапазон",
    category: "Температура",
  },
  {
    icon: Wifi,
    name: "Генератор частоты",
    brand: "Keysight 33622A",
    spec: "До 80 МГц",
    specLabel: "Частота",
    category: "Электроника",
  },
  {
    icon: Gauge,
    name: "Эталонный термометр",
    brand: "Fluke 1868A",
    spec: "±0,001 °C",
    specLabel: "Точность",
    category: "Температура",
  },
  {
    icon: Activity,
    name: "Осциллограф",
    brand: "Keysight DSOX6104G",
    spec: "1 ГГц",
    specLabel: "Полоса",
    category: "Электроника",
  },
  {
    icon: Droplets,
    name: "Камера влажности",
    brand: "Binder KMH 170",
    spec: "10 … 95 %",
    specLabel: "Влажность",
    category: "Окр. среда",
  },
  {
    icon: Target,
    name: "Эталонная мера длины",
    brand: "Mitutoyo 502",
    spec: "±0,001 мм",
    specLabel: "Погрешность",
    category: "Длина",
  },
];

function TiltCard({ item, index }: { item: EquipmentItem; index: number }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, threshold: 0.15 });
  const Icon = item.icon;

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -ny * 14, y: nx * 14 });
  }, []);

  const onLeave = useCallback(() => {
    setHovering(false);
    setTilt({ x: 0, y: 0 });
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        delay: index * 0.07,
        duration: 0.55,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      onMouseMove={onMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={onLeave}
      className="cursor-pointer"
      style={{ perspective: "900px" }}
    >
      <div
        className="relative h-full rounded-2xl border border-transparent hover:border-primary/20 bg-white dark:bg-dark-light p-5 overflow-hidden"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hovering ? 1.025 : 1})`,
          transformStyle: "preserve-3d",
          transition: hovering
            ? "transform 0.1s ease-out, box-shadow 0.3s"
            : "transform 0.55s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.3s",
          boxShadow: hovering ? "0 12px 40px rgba(232,122,46,0.18)" : "none",
        }}
      >
        {/* Gloss — follows tilt */}
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{
            background: `radial-gradient(ellipse at ${50 + tilt.y * 2.5}% ${50 + tilt.x * 2.5}%, rgba(232,122,46,0.08) 0%, transparent 55%)`,
          }}
        />

        {/* Top edge highlight */}
        <div
          className="absolute top-0 left-0 right-0 h-px rounded-t-2xl transition-opacity duration-300"
          style={{
            background:
              "linear-gradient(90deg, transparent, #E87A2E, transparent)",
            opacity: hovering ? 1 : 0,
          }}
        />

        {/* Card body */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(232,122,46,0.14)" }}
            >
              <Icon className="w-5 h-5 text-[#E87A2E]" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral dark:text-white/50 bg-warm-bg dark:bg-dark px-2.5 py-1 rounded-full">
              {item.category}
            </span>
          </div>

          <h3 className="text-sm font-bold text-dark dark:text-white leading-snug mb-1">
            {item.name}
          </h3>
          <p className="text-[11px] text-neutral-light dark:text-white/40 mb-3.5">
            {item.brand}
          </p>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] text-neutral-light dark:text-white/40 uppercase tracking-wide mb-0.5">
                {item.specLabel}
              </p>
              <p className="text-sm font-bold text-primary">{item.spec}</p>
            </div>
            <Plus
              className={`w-4 h-4 transition-colors duration-300 ${hovering ? "text-primary" : "text-neutral-light dark:text-white/20"}`}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function EquipmentShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, threshold: 0.1 });

  return (
    <section ref={ref} className="relative py-20 px-4 bg-warm-bg dark:bg-dark">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block text-[11px] font-semibold uppercase tracking-widest text-primary mb-3">
            Оборудование
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-dark dark:text-white mb-3">
            Точность до{" "}
            <span className="text-gradient">последнего деления</span>
          </h2>
          <p className="text-neutral dark:text-white/60 text-sm max-w-lg mx-auto">
            Каждый прибор калиброван по государственным эталонам и проходит
            регулярную поверку
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {items.map((item, i) => (
            <TiltCard key={i} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
