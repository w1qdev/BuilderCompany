"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

interface Faqs {
  question: string;
  answer: string;
}

const faqs: Faqs[] = [
  {
    question: "Какие виды оборудования вы калибруете?",
    answer:
      "Мы калибруем широкий спектр средств измерений: манометры, термометры, весы, мультиметры, осциллографы, счётчики, расходомеры и многое другое. Полный перечень можно уточнить у наших специалистов.",
  },
  {
    question: "Сколько времени занимает калибровка?",
    answer:
      "Стандартные сроки калибровки — 5-10 рабочих дней. Для срочных заказов предусмотрена ускоренная калибровка за 3-5 рабочих дней с дополнительной оплатой. Точные сроки зависят от типа и количества оборудования.",
  },
  {
    question: "Чем отличается калибровка от поверки?",
    answer:
      "Поверка — это обязательная процедура для средств измерений, используемых в сферах государственного регулирования (торговля, медицина, экология). Калибровка — добровольная процедура для обеспечения точности измерений. Оба документа подтверждают метрологические характеристики оборудования.",
  },
  {
    question: "Вы работаете с выездом к заказчику?",
    answer:
      "Да, мы проводим калибровку и поверку на территории заказчика по всей России. Это особенно удобно для крупногабаритного оборудования или большого парка приборов. Стоимость выезда рассчитывается индивидуально.",
  },
  {
    question: "Какие документы я получу после калибровки?",
    answer:
      "После калибровки вы получите сертификат калибровки с указанием метрологических характеристик, погрешностей измерений и условий проведения работ. При поверке выдаётся свидетельство о поверке с записью в реестр ФГИС «Аршин».",
  },
  {
    question: "Какие формы оплаты вы принимаете?",
    answer:
      "Мы работаем по безналичному расчету для юридических лиц и ИП. Принимаем оплату по расчетному счету на основании выставленного счета. Для физических лиц доступна оплата наличными или картой в офисе.",
  },
];

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}

function FAQItem({ question, answer, isOpen, onClick }: FAQItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      className="border-b border-gray-100 dark:border-white/10 last:border-0"
    >
      <button
        onClick={onClick}
        className="w-full py-5 flex items-center justify-between text-left group"
      >
        <span className="text-dark dark:text-white font-semibold pr-4 group-hover:text-primary transition-colors">
          {question}
        </span>
        <div
          className={`w-8 h-8 rounded-xl bg-warm-bg dark:bg-white/10 flex items-center justify-center shrink-0 transition-all duration-300 ${isOpen ? "bg-primary" : "group-hover:bg-primary/10"}`}
        >
          <svg
            className={`w-4 h-4 transition-all duration-300 ${isOpen ? "text-white rotate-180" : "text-primary"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-neutral dark:text-white/60 text-sm leading-relaxed pr-12">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 sm:py-28 bg-warm-light dark:bg-dark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-dark dark:text-white mt-2">
            Часто задаваемые <span className="text-gradient">вопросы</span>
          </h2>
          <p className="text-neutral dark:text-white/60 mt-4">
            Ответы на популярные вопросы о наших услугах
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          className="bg-white dark:bg-dark-light rounded-3xl shadow-xl p-6 sm:p-8"
        >
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
