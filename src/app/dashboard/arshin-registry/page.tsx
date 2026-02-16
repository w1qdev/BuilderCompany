"use client";

import { useEffect, useState } from "react";

interface VriItem {
  equipmentId: number;
  equipmentName: string;
  serialNumber: string | null;
  registryNumber: string | null;
  miName: string;
  miType: string;
  miSerialNumber: string;
  miRegistryNumber: string;
  orgTitle: string;
  vriDate: string;
  validDate: string;
  arshinUrl: string;
  isExpired: boolean;
}

export default function ArshinRegistryPage() {
  const [items, setItems] = useState<VriItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterExpired, setFilterExpired] = useState<"" | "valid" | "expired">("");

  useEffect(() => {
    fetch("/api/arshin/registry")
      .then((r) => r.json())
      .then((d) => {
        if (d.items) setItems(d.items);
        else setError(d.error || "Ошибка загрузки");
      })
      .catch(() => setError("Ошибка сети"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((item) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !item.equipmentName.toLowerCase().includes(q) &&
        !item.miType.toLowerCase().includes(q) &&
        !(item.miSerialNumber || "").toLowerCase().includes(q) &&
        !(item.miRegistryNumber || "").toLowerCase().includes(q) &&
        !(item.orgTitle || "").toLowerCase().includes(q)
      ) return false;
    }
    if (filterExpired === "valid" && item.isExpired) return false;
    if (filterExpired === "expired" && !item.isExpired) return false;
    return true;
  });

  const validCount = items.filter((i) => !i.isExpired && i.validDate).length;
  const expiredCount = items.filter((i) => i.isExpired).length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-dark dark:text-white">
            Реестр поверок ФГИС Аршин
          </h1>
          <p className="text-sm text-neutral dark:text-white/50 mt-1">
            История поверок вашего оборудования из базы данных ФГИС «Аршин»
          </p>
        </div>
        {!loading && !error && (
          <div className="flex gap-3 shrink-0">
            <div className="text-center px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-400/20 rounded-xl">
              <div className="text-lg font-bold text-green-700 dark:text-green-400">{validCount}</div>
              <div className="text-xs text-green-600 dark:text-green-500">Действующих</div>
            </div>
            <div className="text-center px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-400/20 rounded-xl">
              <div className="text-lg font-bold text-red-700 dark:text-red-400">{expiredCount}</div>
              <div className="text-xs text-red-600 dark:text-red-500">Просроченных</div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      {!loading && !error && items.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1 sm:max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Поиск по названию, серийному №..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-light text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select
            value={filterExpired}
            onChange={(e) => setFilterExpired(e.target.value as "" | "valid" | "expired")}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-light text-sm text-dark dark:text-white"
          >
            <option value="">Все записи</option>
            <option value="valid">Только действующие</option>
            <option value="expired">Только просроченные</option>
          </select>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-12 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <div className="text-sm text-neutral dark:text-white/50 text-center">
            Загружаем историю поверок из ФГИС Аршин...<br />
            <span className="text-xs opacity-70">Это может занять несколько секунд</span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="font-semibold text-dark dark:text-white mb-1">Нет данных из ФГИС Аршин</p>
          <p className="text-sm text-neutral dark:text-white/50">
            Добавьте оборудование СИ с серийными номерами, чтобы загружать историю поверок из реестра
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-8 text-center">
          <p className="text-sm text-neutral dark:text-white/50">Ничего не найдено по заданным фильтрам</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-neutral dark:text-white/40 mb-3">
            Показано {filtered.length} из {items.length} записей
          </p>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((item, i) => (
              <div key={i} className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="font-medium text-dark dark:text-white text-sm truncate">{item.equipmentName}</div>
                    <div className="text-xs text-neutral dark:text-white/50 mt-0.5 truncate">{item.miType || "—"}</div>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                    !item.validDate ? "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/50" :
                    item.isExpired ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  }`}>
                    {!item.validDate ? "—" : item.isExpired ? "Просрочена" : "Действует"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-neutral dark:text-white/50">
                  {item.miSerialNumber && <span>Зав. №: <span className="font-mono text-dark dark:text-white">{item.miSerialNumber}</span></span>}
                  {item.vriDate && <span>Дата: {new Date(item.vriDate).toLocaleDateString("ru-RU")}</span>}
                  {item.validDate && <span>До: <span className={item.isExpired ? "text-red-500" : "text-green-600 dark:text-green-400"}>{new Date(item.validDate).toLocaleDateString("ru-RU")}</span></span>}
                  {item.orgTitle && <span className="col-span-2 truncate">Орг.: {item.orgTitle}</span>}
                </div>
                {item.arshinUrl && (
                  <a href={item.arshinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    Открыть в Аршин
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white dark:bg-dark-light rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                    <th className="px-4 py-3 text-left font-semibold text-dark dark:text-white">Оборудование</th>
                    <th className="px-4 py-3 text-left font-semibold text-dark dark:text-white">Тип/Модель</th>
                    <th className="px-4 py-3 text-left font-semibold text-dark dark:text-white">Зав. №</th>
                    <th className="px-4 py-3 text-left font-semibold text-dark dark:text-white">Реестр №</th>
                    <th className="px-4 py-3 text-left font-semibold text-dark dark:text-white">Поверитель</th>
                    <th className="px-4 py-3 text-left font-semibold text-dark dark:text-white">Дата поверки</th>
                    <th className="px-4 py-3 text-left font-semibold text-dark dark:text-white">Действует до</th>
                    <th className="px-4 py-3 text-left font-semibold text-dark dark:text-white">Статус</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-medium text-dark dark:text-white max-w-[180px] truncate" title={item.equipmentName}>
                        {item.equipmentName}
                      </td>
                      <td className="px-4 py-3 text-neutral dark:text-white/60 max-w-[150px] truncate" title={item.miType}>
                        {item.miType || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-neutral dark:text-white/60">
                        {item.miSerialNumber || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-neutral dark:text-white/60">
                        {item.miRegistryNumber || "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral dark:text-white/60 max-w-[180px] truncate text-xs" title={item.orgTitle}>
                        {item.orgTitle || "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral dark:text-white/60 whitespace-nowrap">
                        {item.vriDate ? new Date(item.vriDate).toLocaleDateString("ru-RU") : "—"}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap font-medium ${
                        !item.validDate ? "text-neutral dark:text-white/40" :
                        item.isExpired ? "text-red-500" : "text-green-600 dark:text-green-400"
                      }`}>
                        {item.validDate ? new Date(item.validDate).toLocaleDateString("ru-RU") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {item.validDate ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.isExpired
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          }`}>
                            {item.isExpired ? "Просрочена" : "Действует"}
                          </span>
                        ) : (
                          <span className="text-neutral dark:text-white/30 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item.arshinUrl && (
                          <a
                            href={item.arshinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Открыть в ФГИС Аршин"
                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/10 text-blue-500 transition-colors inline-flex"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
