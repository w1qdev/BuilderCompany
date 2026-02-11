"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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
    description: "Аттестация испытательного оборудования — это комплексная процедура оценки технического состояния и подтверждения соответствия оборудования установленным требованиям. Мы проводим полный цикл аттестационных испытаний с применением современных эталонных средств измерений и в строгом соответствии с требованиями ГОСТ Р 8.568-2017.",
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
    description: "Поверка измерителей электрических величин — обязательная метрологическая процедура для средств измерений напряжения, тока, сопротивления, мощности и других электрических параметров. Наша лаборатория оснащена высокоточными калибраторами и эталонами класса точности 0,01-0,05, что позволяет проводить поверку приборов любой сложности.",
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
    description: "Поверка испытательных систем включает метрологическую оценку сложных измерительно-вычислительных комплексов, применяемых для контроля качества продукции. Мы проводим поверку систем любой конфигурации — от простых измерительных установок до автоматизированных испытательных комплексов с компьютерным управлением.",
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
    description: "Поверка средств измерений — процедура определения и подтверждения соответствия СИ установленным метрологическим требованиям. Мы проводим поверку всех типов средств измерений в соответствии с утвержденными методиками поверки. Наша лаборатория располагает современным эталонным оборудованием для поверки механических, тепловых, оптических и других видов СИ.",
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
    description: "Калибровка средств измерений — добровольная процедура, направленная на определение и документирование действительных метрологических характеристик СИ. В отличие от поверки, калибровка не требует обязательного внесения в реестр, но обеспечивает прослеживаемость измерений к национальным эталонам. Мы выполняем калибровку в соответствии с требованиями ISO/IEC 17025.",
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
  const [showFilters] = useState(false);

  const [services, setServices] = useState<Service[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handlePriceFilterChange = (filter: PriceFilter) => {
    setPriceFilter(filter);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setPriceFilter("all");
    setCurrentPage(1);
  };

  const openModal = (service: Service) => {
    setSelectedService(service);
  };

  const closeModal = () => {
    setSelectedService(null);
  };

  const hasActiveFilters = searchQuery.trim() !== "" || priceFilter !== "all";

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
        <div className="flex justify-center mb-8 overflow-x-auto">
          <div className="inline-flex bg-white dark:bg-dark-light rounded-2xl p-1.5 shadow-lg flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                disabled={loading}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "gradient-primary text-white shadow-md"
                    : "text-neutral dark:text-white/60 hover:text-dark dark:hover:text-white"
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content Description */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
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
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Что мы выполняем
                  </h4>
                  <ul className="space-y-3">
                    {tabContent[activeTab].features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="mt-1 flex-shrink-0 w-5 h-5 gradient-primary rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
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
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Преимущества для вас
                  </h4>
                  <ul className="space-y-3">
                    {tabContent[activeTab].benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="mt-1 flex-shrink-0 w-5 h-5 bg-green-500/20 dark:bg-green-500/30 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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

              {/* CTA */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
                <p className="text-center text-sm text-neutral dark:text-white/60 mb-4">
                  Нужна консультация по услугам этой категории? Свяжитесь с нашими специалистами
                </p>
                <div className="flex justify-center">
                  <a
                    href="#calculator"
                    className="inline-flex items-center gap-2 gradient-primary text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all hover:scale-105"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Получить консультацию
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral dark:text-white/60" />
              <input
                type="text"
                placeholder="Поиск по названию или описанию..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                disabled={loading}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-dark-light text-dark dark:text-white border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral hover:text-dark dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="bg-white dark:bg-dark-light rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-dark dark:text-white uppercase tracking-wider">
                      Фильтрация по цене
                    </h3>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        Сбросить всё
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "all", label: "Все цены" },
                      { value: "cheap", label: "До 5 000 ₽" },
                      { value: "medium", label: "5 000 - 20 000 ₽" },
                      { value: "expensive", label: "От 20 000 ₽" },
                    ].map((filter) => (
                      <button
                        key={filter.value}
                        onClick={() =>
                          handlePriceFilterChange(filter.value as PriceFilter)
                        }
                        disabled={loading}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          priceFilter === filter.value
                            ? "bg-amber-500 text-white shadow-md"
                            : "bg-warm-bg dark:bg-dark text-neutral dark:text-white/60 hover:text-dark dark:hover:text-white"
                        } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-neutral dark:text-white/60">
                Активные фильтры:
              </span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg text-sm font-medium">
                  Поиск: &ldquo;{searchQuery}&rdquo;
                  <button
                    onClick={() => handleSearchChange("")}
                    className="hover:scale-110 transition-transform"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              )}
              {priceFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg text-sm font-medium">
                  {priceFilter === "cheap" && "До 5 000 ₽"}
                  {priceFilter === "medium" && "5 000 - 20 000 ₽"}
                  {priceFilter === "expensive" && "От 20 000 ₽"}
                  <button
                    onClick={() => handlePriceFilterChange("all")}
                    className="hover:scale-110 transition-transform"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-dark dark:text-white mb-2">
              Ошибка загрузки
            </h3>
            <p className="text-neutral dark:text-white/60 mb-4">{error}</p>
            <button
              onClick={fetchServices}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all"
            >
              Попробовать снова
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && services.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-warm-bg dark:bg-dark-light rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-neutral dark:text-white/60" />
            </div>
            <h3 className="text-xl font-bold text-dark dark:text-white mb-2">
              Ничего не найдено
            </h3>
            <p className="text-neutral dark:text-white/60 mb-4">
              Попробуйте изменить параметры поиска или фильтры
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Сбросить фильтры
              </button>
            )}
          </div>
        )}

        {/* Service Cards */}
        {!loading && !error && services.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-${currentPage}-${searchQuery}-${priceFilter}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => openModal(service)}
                  className="group bg-white dark:bg-dark-light rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                    {service.image ? (
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral dark:text-white/60">
                        <span className="text-sm">Нет изображения</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                      {formatPrice(service.price)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-dark dark:text-white mb-2 line-clamp-2">
                      {service.title}
                    </h3>
                    <p className="text-sm text-neutral dark:text-white/60 leading-relaxed mb-4 line-clamp-3">
                      {service.description}
                    </p>
                    <button className="w-full gradient-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all">
                      Заказать
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && services.length > 0 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-dark-light text-neutral dark:text-white/60 hover:text-dark dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Назад
            </button>

            {/* Page numbers */}
            <div className="flex gap-2">
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (currentPage <= 4) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                      currentPage === pageNum
                        ? "bg-orange-500 text-white shadow-md"
                        : "bg-white dark:bg-dark-light text-neutral dark:text-white/60 hover:text-dark dark:hover:text-white"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() =>
                handlePageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-dark-light text-neutral dark:text-white/60 hover:text-dark dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Вперёд
            </button>
          </div>
        )}

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
