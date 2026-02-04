"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const serviceTypes = [
  { id: "calibration", label: "Калибровка СИ", pricePerUnit: 2000 },
  { id: "verification", label: "Поверка приборов", pricePerUnit: 1200 },
  { id: "certification", label: "Сертификация продукции", pricePerUnit: 15000 },
  { id: "declaration", label: "Декларирование", pricePerUnit: 12000 },
  { id: "iso", label: "Сертификация ISO", pricePerUnit: 35000 },
];

const urgencyOptions = [
  { id: "standard", label: "Стандартные сроки", multiplier: 1 },
  { id: "fast", label: "Ускоренные (3-5 дней)", multiplier: 1.5 },
  { id: "urgent", label: "Срочно (1-2 дня)", multiplier: 2 },
];

export default function Calculator({ onOpenModal }: { onOpenModal: () => void }) {
  const [service, setService] = useState(serviceTypes[0].id);
  const [quantity, setQuantity] = useState(5);
  const [urgency, setUrgency] = useState(urgencyOptions[0].id);

  const selectedService = serviceTypes.find((s) => s.id === service)!;
  const selectedUrgency = urgencyOptions.find((u) => u.id === urgency)!;
  const totalPrice = selectedService.pricePerUnit * quantity * selectedUrgency.multiplier;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("ru-RU").format(Math.round(price));

  return (
    <section id="calculator" className="py-20 sm:py-28 bg-warm-light dark:bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Калькулятор</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-dark dark:text-white mt-2">
            Рассчитайте стоимость
          </h2>
          <p className="text-neutral dark:text-white/60 mt-3 max-w-xl mx-auto">
            Получите предварительную оценку стоимости услуг
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ delay: 0.1 }}
          className="max-w-4xl mx-auto bg-white dark:bg-dark-light rounded-3xl shadow-xl p-6 sm:p-10"
        >
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: inputs */}
            <div className="space-y-6">
              {/* Service type */}
              <div>
                <label className="block text-sm font-semibold text-dark dark:text-white mb-2">
                  Тип услуги
                </label>
                <Select value={service} onValueChange={setService}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label} — от {formatPrice(s.pricePerUnit)} руб
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-semibold text-dark dark:text-white mb-2">
                  Количество: <span className="text-primary">{quantity} шт.</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={50}
                  step={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-neutral-light mt-1">
                  <span>1 шт.</span>
                  <span>50 шт.</span>
                </div>
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-sm font-semibold text-dark dark:text-white mb-2">
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
                          : "bg-warm-bg dark:bg-white/10 text-neutral dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/20"
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
                от {formatPrice(selectedService.pricePerUnit)} руб/шт.
              </div>
              <button
                onClick={onOpenModal}
                className="gradient-primary text-white px-6 py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all hover:scale-105 w-full"
              >
                Получить точный расчёт
              </button>
              <p className="text-white/40 text-xs mt-3">
                Точная стоимость зависит от типа оборудования
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
