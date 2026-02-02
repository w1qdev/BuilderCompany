"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const serviceTypes = [
  { id: "building", label: "Строительство дома", pricePerSqm: 45000 },
  { id: "renovation", label: "Капитальный ремонт", pricePerSqm: 15000 },
  { id: "design", label: "Проектирование", pricePerSqm: 2500 },
  { id: "facade", label: "Отделка фасада", pricePerSqm: 8000 },
  { id: "roof", label: "Кровельные работы", pricePerSqm: 12000 },
];

const urgencyOptions = [
  { id: "standard", label: "Стандартные сроки", multiplier: 1 },
  { id: "fast", label: "Ускоренные сроки", multiplier: 1.3 },
  { id: "urgent", label: "Срочно", multiplier: 1.6 },
];

export default function Calculator({ onOpenModal }: { onOpenModal: () => void }) {
  const [service, setService] = useState(serviceTypes[0].id);
  const [area, setArea] = useState(100);
  const [urgency, setUrgency] = useState(urgencyOptions[0].id);

  const selectedService = serviceTypes.find((s) => s.id === service)!;
  const selectedUrgency = urgencyOptions.find((u) => u.id === urgency)!;
  const totalPrice = selectedService.pricePerSqm * area * selectedUrgency.multiplier;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("ru-RU").format(Math.round(price));

  return (
    <section id="calculator" className="py-20 sm:py-28 bg-warm-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Калькулятор</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-dark mt-2">
            Рассчитайте стоимость
          </h2>
          <p className="text-neutral mt-3 max-w-xl mx-auto">
            Получите предварительную оценку стоимости вашего проекта
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ delay: 0.1 }}
          className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-6 sm:p-10"
        >
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: inputs */}
            <div className="space-y-6">
              {/* Service type */}
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Тип услуги
                </label>
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all bg-warm-bg"
                >
                  {serviceTypes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} — от {formatPrice(s.pricePerSqm)} руб/м²
                    </option>
                  ))}
                </select>
              </div>

              {/* Area */}
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Площадь: <span className="text-primary">{area} м²</span>
                </label>
                <input
                  type="range"
                  min={20}
                  max={1000}
                  step={10}
                  value={area}
                  onChange={(e) => setArea(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-neutral-light mt-1">
                  <span>20 м²</span>
                  <span>1000 м²</span>
                </div>
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Сроки выполнения
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {urgencyOptions.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setUrgency(u.id)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        urgency === u.id
                          ? "gradient-primary text-white shadow-lg shadow-primary/20"
                          : "bg-warm-bg text-neutral hover:bg-gray-100"
                      }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: result */}
            <div className="flex flex-col items-center justify-center bg-gradient-to-br from-dark to-dark-light rounded-2xl p-8 text-center">
              <div className="text-white/60 text-sm mb-2">Предварительная стоимость</div>
              <div className="text-4xl sm:text-5xl font-extrabold text-white mb-1">
                {formatPrice(totalPrice)}
              </div>
              <div className="text-primary-light text-lg mb-1">руб.</div>
              <div className="text-white/50 text-xs mb-6">
                от {formatPrice(selectedService.pricePerSqm)} руб/м²
              </div>
              <button
                onClick={onOpenModal}
                className="gradient-primary text-white px-6 py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all hover:scale-105 w-full"
              >
                Получить точный расчёт
              </button>
              <p className="text-white/40 text-xs mt-3">
                Точная стоимость определяется после осмотра объекта
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
