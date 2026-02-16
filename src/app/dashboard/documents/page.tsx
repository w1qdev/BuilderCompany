"use client";

import { useEffect, useState } from "react";

interface Equipment {
  id: number;
  name: string;
  type: string | null;
  serialNumber: string | null;
  category: string;
}

const DOCS = [
  {
    type: "act",
    title: "Акт ввода в эксплуатацию",
    description: "Официальный акт приёма СИ в эксплуатацию с подписями ответственных лиц.",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    needsEquipment: true,
    category: "verification",
  },
  {
    type: "passport",
    title: "Паспорт СИ",
    description: "Паспорт средства измерений с метрологическими характеристиками и историей поверок.",
    icon: "M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2",
    needsEquipment: true,
    category: "verification",
  },
  {
    type: "journal",
    title: "Журнал учёта СИ",
    description: "Журнал учёта всех средств измерений организации с датами поверок и статусами.",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    needsEquipment: false,
    category: "verification",
  },
];

export default function DocumentsPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedId, setSelectedId] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/equipment?limit=200")
      .then((r) => r.json())
      .then((data) => {
        const items: Equipment[] = (data.equipment || []).filter(
          (e: Equipment) => e.category === "verification"
        );
        setEquipment(items);
        if (items.length > 0) {
          setSelectedId({ act: items[0].id, passport: items[0].id });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openDoc = (type: string, needsEquipment: boolean) => {
    let url = `/api/user/documents?type=${type}`;
    if (needsEquipment) {
      const id = selectedId[type];
      if (!id) return;
      url += `&equipmentId=${id}`;
    }
    window.open(url, "_blank");
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark dark:text-white">Документы</h1>
        <p className="text-neutral dark:text-white/60 text-sm mt-1">
          Формирование стандартных документов на основе данных вашего оборудования
        </p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DOCS.map((doc) => (
            <div
              key={doc.type}
              className="bg-white dark:bg-dark-light rounded-2xl p-5 border border-gray-100 dark:border-white/10 flex flex-col gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={doc.icon} />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-dark dark:text-white text-sm">{doc.title}</div>
                  <div className="text-xs text-neutral dark:text-white/50 mt-0.5 leading-relaxed">
                    {doc.description}
                  </div>
                </div>
              </div>

              {doc.needsEquipment && (
                <div>
                  <label className="text-xs font-medium text-neutral dark:text-white/50 mb-1 block">
                    Прибор
                  </label>
                  {equipment.length === 0 ? (
                    <div className="text-xs text-neutral dark:text-white/40 italic">
                      Нет оборудования СИ
                    </div>
                  ) : (
                    <select
                      value={selectedId[doc.type] || ""}
                      onChange={(e) =>
                        setSelectedId((prev) => ({ ...prev, [doc.type]: Number(e.target.value) }))
                      }
                      className="w-full text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-warm-bg dark:bg-dark px-3 py-2 text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {equipment.map((eq) => (
                        <option key={eq.id} value={eq.id}>
                          {eq.name}{eq.serialNumber ? ` (${eq.serialNumber})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <button
                onClick={() => openDoc(doc.type, doc.needsEquipment)}
                disabled={doc.needsEquipment && equipment.length === 0}
                className="mt-auto w-full py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Сформировать
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-400/20">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Как использовать:</strong> нажмите «Сформировать» — откроется документ в новой вкладке. Используйте кнопку «Печать / PDF» или сочетание клавиш <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs font-mono">Ctrl+P</kbd> для сохранения в PDF.
        </p>
      </div>
    </div>
  );
}
