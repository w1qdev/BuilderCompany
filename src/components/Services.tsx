"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Service {
  id: number;
  title: string;
  description: string;
  price: number;
  image: string | null;
  category: string;
  isActive: boolean;
}

interface Tab {
  id: string;
  label: string;
}

interface TabContent {
  title: string;
  description: string;
  features: string[];
  benefits: string[];
}

const tabs: Tab[] = [
  { id: "1", label: "Аттестация испытательного оборудования" },
  { id: "2", label: "Поверка измерителей электрических величин" },
  { id: "3", label: "Поверка систем испытательных" },
  { id: "4", label: "Поверка средств измерений" },
  { id: "5", label: "Калибровка средств измерений" },
];

const tabContent: Record<string, TabContent> = {
  "1": {
    title: "Аттестация испытательного оборудования",
    description:
      "Аттестация испытательного оборудования — это комплексная процедура оценки технического состояния и подтверждения соответствия оборудования установленным требованиям. Мы проводим полный цикл аттестационных испытаний с применением современных эталонных средств измерений и в строгом соответствии с требованиями ГОСТ Р 8.568-2017.",
    features: [
      "Аттестация прессов, разрывных машин и стендов",
      "Оценка температурного, климатического и механического оборудования",
      "Аттестация измерительных систем и испытательных комплексов",
      "Проверка соответствия метрологических характеристик",
      "Оформление протоколов аттестации и актов проверки",
    ],
    benefits: [
      "Подтверждение пригодности оборудования для проведения испытаний",
      "Соответствие требованиям систем менеджмента качества (ISO 9001)",
      "Снижение рисков получения недостоверных результатов измерений",
      "Документальное подтверждение для органов надзора и аудитов",
    ],
  },
  "2": {
    title: "Поверка измерителей электрических величин",
    description:
      "Поверка измерителей электрических величин — обязательная метрологическая процедура для средств измерений напряжения, тока, сопротивления, мощности и других электрических параметров. Наша лаборатория оснащена высокоточными калибраторами и эталонами класса точности 0,01-0,05, что позволяет проводить поверку приборов любой сложности.",
    features: [
      "Поверка мультиметров, осциллографов и анализаторов качества электроэнергии",
      "Поверка измерителей сопротивления изоляции (мегаомметров)",
      "Поверка вольтметров, амперметров, ваттметров",
      "Поверка преобразователей и датчиков электрических величин",
      "Выдача свидетельств о поверке с внесением в реестр ФГИС «Аршин»",
    ],
    benefits: [
      "Соответствие требованиям Федерального закона № 102-ФЗ «Об обеспечении единства измерений»",
      "Допуск оборудования к эксплуатации в промышленности и энергетике",
      "Предотвращение аварийных ситуаций из-за неточных измерений",
      "Выполнение требований Ростехнадзора и других надзорных органов",
    ],
  },
  "3": {
    title: "Поверка систем испытательных",
    description:
      "Поверка испытательных систем включает метрологическую оценку сложных измерительно-вычислительных комплексов, применяемых для контроля качества продукции. Мы проводим поверку систем любой конфигурации — от простых измерительных установок до автоматизированных испытательных комплексов с компьютерным управлением.",
    features: [
      "Поверка систем для механических испытаний (прочность, деформация, усилие)",
      "Метрологическая оценка систем контроля параметров окружающей среды",
      "Поверка систем регистрации и обработки измерительной информации",
      "Аттестация программного обеспечения измерительных систем",
      "Комплексная оценка погрешностей измерительных каналов",
    ],
    benefits: [
      "Подтверждение метрологической прослеживаемости результатов испытаний",
      "Соответствие требованиям ГОСТ Р 8.568-2017 и ГОСТ Р 8.879-2014",
      "Повышение достоверности результатов контроля качества продукции",
      "Признание результатов испытаний международными стандартами",
    ],
  },
  "4": {
    title: "Поверка средств измерений",
    description:
      "Поверка средств измерений — процедура определения и подтверждения соответствия СИ установленным метрологическим требованиям. Мы проводим поверку всех типов средств измерений в соответствии с утвержденными методиками поверки. Наша лаборатория располагает современным эталонным оборудованием для поверки механических, тепловых, оптических и других видов СИ.",
    features: [
      "Поверка манометров, термометров, гигрометров",
      "Поверка весов, динамометров, силоизмерительных машин",
      "Поверка средств измерений длины, углов, шероховатости",
      "Поверка расходомеров, счетчиков жидкостей и газов",
      "Поверка средств измерений звука, вибрации, освещенности",
    ],
    benefits: [
      "Юридическая сила документов о поверке на всей территории РФ",
      "Возможность применения СИ в сферах государственного регулирования",
      "Соответствие требованиям технических регламентов",
      "Минимизация рисков штрафов от контролирующих органов",
    ],
  },
  "5": {
    title: "Калибровка средств измерений",
    description:
      "Калибровка средств измерений — добровольная процедура, направленная на определение и документирование действительных метрологических характеристик СИ. В отличие от поверки, калибровка не требует обязательного внесения в реестр, но обеспечивает прослеживаемость измерений к национальным эталонам.",
    features: [
      "Калибровка лабораторных весов и аналитических приборов",
      "Калибровка технологических датчиков и преобразователей",
      "Калибровка измерительных систем производственных процессов",
      "Выдача сертификатов калибровки с протоколами измерений",
      "Определение систематических погрешностей и построение градуировочных кривых",
    ],
    benefits: [
      "Соответствие требованиям международных стандартов (ISO 9001, ISO/IEC 17025)",
      "Повышение точности и надежности измерений",
      "Документальное подтверждение для сертификации продукции",
      "Применимость в любых отраслях промышленности без ограничений",
    ],
  },
};

const ITEMS_PER_PAGE = 12;

type PriceFilter = "all" | "cheap" | "medium" | "expensive";

export default function Services() {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [_showFilters] = useState(false);

  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = tabsRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const scrollTabs = (direction: "left" | "right") => {
    const el = tabsRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -200 : 200,
      behavior: "smooth",
    });
  };

  const [services, setServices] = useState<Service[]>([]);
  const [total, setTotal] = useState(0);
  const [_totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(ITEMS_PER_PAGE),
        category: activeTab,
      });

      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      if (priceFilter !== "all") {
        params.set("priceFilter", priceFilter);
      }

      const res = await fetch(`/api/services?${params}`);

      if (!res.ok) {
        throw new Error("Ошибка загрузки услуг");
      }

      const data = await res.json();
      setServices(data.services);
      setTotal(data.total);
      setTotalPages(data.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
      setServices([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, searchQuery, priceFilter]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setCurrentPage(1);
    setSearchQuery("");
    setPriceFilter("all");
  };

  const _handlePageChange = (page: number) => {
    setCurrentPage(page);
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
  };

  const _handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const _handlePriceFilterChange = (filter: PriceFilter) => {
    setPriceFilter(filter);
    setCurrentPage(1);
  };

  const _clearFilters = () => {
    setSearchQuery("");
    setPriceFilter("all");
    setCurrentPage(1);
  };

  const _openModal = (service: Service) => {
    setSelectedService(service);
  };

  const closeModal = () => {
    setSelectedService(null);
  };

  const _hasActiveFilters = searchQuery.trim() !== "" || priceFilter !== "all";

  const formatPrice = (price: number) => `от ${price.toLocaleString()} руб`;

  return (
    <section id="services" className="py-20 sm:py-28 dark:bg-dark">
      <div className="max-w-8xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Что мы делаем
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-dark dark:text-white mt-2">
            Наши услуги
          </h2>
          <p className="text-neutral dark:text-white/60 mt-3 max-w-xl mx-auto">
            Полный спектр метрологических услуг — от поверки до аттестации
            оборудования
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="relative mb-8 flex items-center gap-1">
          {canScrollLeft && (
            <button
              onClick={() => scrollTabs("left")}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-dark-light shadow text-neutral dark:text-white/60 hover:text-dark dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          <div ref={tabsRef} className="overflow-x-auto scrollbar-hide flex-1">
            <div className="flex gap-1 min-w-max border-b border-gray-200 dark:border-white/10">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  disabled={loading}
                  className={`relative px-5 py-3 text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "text-primary"
                      : "text-neutral dark:text-white/50 hover:text-dark dark:hover:text-white/80"
                  } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {canScrollRight && (
            <button
              onClick={() => scrollTabs("right")}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-dark-light shadow text-neutral dark:text-white/60 hover:text-dark dark:hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tab Content Description */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.1 }}
            className="mb-10"
          >
            <div className="bg-gradient-to-br from-white to-warm-bg dark:from-dark-light dark:to-dark rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-100 dark:border-white/5">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-dark dark:text-white mb-4">
                {tabContent[activeTab].title}
              </h3>
              <p className="text-base text-neutral dark:text-white/70 leading-relaxed mb-6">
                {tabContent[activeTab].description}
              </p>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Features */}
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-bold text-dark dark:text-white mb-4 uppercase tracking-wider">
                    <svg
                      className="w-5 h-5 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    Что мы выполняем
                  </h4>
                  <ul className="space-y-3">
                    {tabContent[activeTab].features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="mt-1 flex-shrink-0 w-5 h-5 gradient-primary rounded-full flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </span>
                        <span className="text-sm text-neutral dark:text-white/70 leading-relaxed">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Benefits */}
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-bold text-dark dark:text-white mb-4 uppercase tracking-wider">
                    <svg
                      className="w-5 h-5 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Преимущества для вас
                  </h4>
                  <ul className="space-y-3">
                    {tabContent[activeTab].benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="mt-1 flex-shrink-0 w-5 h-5 bg-green-500/20 dark:bg-green-500/30 rounded-full flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-green-600 dark:text-green-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                        <span className="text-sm text-neutral dark:text-white/70 leading-relaxed">
                          {benefit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <p className="text-base text-neutral dark:text-white/70 leading-relaxed mt-6">
                Проверка и калибровка средств измерений – важный этап в
                обеспечении точности и надежности результатов измерений. Это
                процесс, который позволяет проверить и настроить средства
                измерений на соответствие установленным стандартам и
                требованиям. Поверка и калибровка являются двумя разными
                процедурами, но тесно взаимосвязанными и в некоторых случаях
                могут проводиться одновременно.
                <br />
                Поверка – это процесс проверки средства измерения на
                соответствие его показаний установленным стандартам, результаты
                вносятся во всеобщую базу АРШИН. Проводится сравнение показаний
                прибора с эталонными значениями. Если результат поверки
                укладывается в заданные пределы погрешности, то средство
                измерения считается исправным и готовым к использованию. В
                случае превышения допустимых пределов погрешности, прибор
                подлежит настройке и регулировке. Поверка проводится
                периодически с установленным интервалом, чтобы гарантировать
                точность измерений в течение всего срока службы прибора.
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Stats */}
        {!loading && services.length > 0 && (
          <div className="text-center mt-6 text-sm text-neutral dark:text-white/60">
            Показано {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(currentPage * ITEMS_PER_PAGE, total)} из {total} услуг
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedService && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white dark:bg-dark-light rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="relative">
                  {selectedService.image ? (
                    <img
                      src={selectedService.image}
                      alt={selectedService.title}
                      className="w-full h-64 object-cover rounded-t-3xl"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-primary/20 to-primary/5 rounded-t-3xl flex items-center justify-center">
                      <span className="text-neutral dark:text-white/60">
                        Нет изображения
                      </span>
                    </div>
                  )}
                  <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 w-10 h-10 bg-white dark:bg-dark rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                  >
                    <X className="w-5 h-5 text-dark dark:text-white" />
                  </button>
                  <div className="absolute bottom-4 left-4 bg-amber-500 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg">
                    {formatPrice(selectedService.price)}
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-8">
                  <h3 className="text-2xl font-extrabold text-dark dark:text-white mb-4">
                    {selectedService.title}
                  </h3>
                  <p className="text-neutral dark:text-white/60 leading-relaxed mb-6">
                    {selectedService.description}
                  </p>

                  <div className="bg-warm-bg dark:bg-dark rounded-2xl p-6 mb-6">
                    <h4 className="text-sm font-semibold text-dark dark:text-white mb-3 uppercase tracking-wider">
                      Что входит в услугу:
                    </h4>
                    <ul className="space-y-2 text-sm text-neutral dark:text-white/60">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Полная проверка оборудования</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Выдача официального сертификата</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Консультация специалиста</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Гарантия на выполненные работы</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      closeModal();
                      const event = new CustomEvent("openContactModal", {
                        detail: { service: selectedService.title },
                      });
                      window.dispatchEvent(event);
                    }}
                    className="w-full gradient-primary text-white py-4 rounded-xl text-base font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all"
                  >
                    Заказать услугу
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
