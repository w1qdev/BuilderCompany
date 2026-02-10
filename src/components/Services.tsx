"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, X, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

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

const tabs: Tab[] = [
  { id: "1", label: "Аттестация испытательного оборудования" },
  { id: "2", label: "Поверка измерителей электрических величин" },
  { id: "3", label: "Поверка систем испытательных" },
  { id: "4", label: "Поверка средств измерений" },
  { id: "5", label: "Калибровка средств измерений" },
];

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
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
            Полный спектр метрологических услуг — от поверки до сертификации
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
