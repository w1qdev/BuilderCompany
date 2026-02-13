"use client";

import { useEffect, useRef, useState } from "react";
import { toast, Toaster } from "sonner";

interface Equipment {
  id: number;
  name: string;
  type: string | null;
  serialNumber: string | null;
  registryNumber: string | null;
  verificationDate: string | null;
  nextVerification: string | null;
  interval: number;
  category: string;
  status: string;
  company: string | null;
  contactEmail: string | null;
  notes: string | null;
}

const categoryLabels: Record<string, string> = {
  verification: "Поверка",
  calibration: "Калибровка",
  attestation: "Аттестация",
};

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Активно", color: "bg-green-100 text-green-800" },
  pending: { label: "Скоро поверка", color: "bg-yellow-100 text-yellow-800" },
  expired: { label: "Просрочено", color: "bg-red-100 text-red-800" },
};

interface EquipmentListProps {
  title: string;
  categories: string[];
  categoryOptions: { value: string; label: string }[];
  defaultCategory: string;
  dateLabel?: string;
  nextDateLabel?: string;
}

export default function EquipmentList({
  title,
  categories,
  categoryOptions,
  defaultCategory,
  dateLabel = "Дата последней поверки",
  nextDateLabel = "Дата следующей поверки",
}: EquipmentListProps) {
  const emptyForm = {
    name: "",
    type: "",
    serialNumber: "",
    registryNumber: "",
    verificationDate: "",
    nextVerification: "",
    interval: 12,
    category: defaultCategory,
    company: "",
    contactEmail: "",
    notes: "",
  };

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchEquipment = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterStatus) params.set("status", filterStatus);
      // Apply category filter: use user-selected or restrict to allowed categories
      if (filterCategory) {
        params.set("category", filterCategory);
      } else {
        // Fetch all allowed categories
        categories.forEach((c) => params.append("category", c));
      }

      const res = await fetch(`/api/equipment?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEquipment(data.equipment || []);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterStatus, filterCategory]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Введите наименование оборудования");
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/equipment/${editingId}` : "/api/equipment";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success(
          editingId ? "Оборудование обновлено" : "Оборудование добавлено",
        );
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        fetchEquipment();
      } else {
        const data = await res.json();
        toast.error(data.error || "Ошибка");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (eq: Equipment) => {
    setEditingId(eq.id);
    setForm({
      name: eq.name,
      type: eq.type || "",
      serialNumber: eq.serialNumber || "",
      registryNumber: eq.registryNumber || "",
      verificationDate: eq.verificationDate
        ? eq.verificationDate.split("T")[0]
        : "",
      nextVerification: eq.nextVerification
        ? eq.nextVerification.split("T")[0]
        : "",
      interval: eq.interval,
      category: eq.category,
      company: eq.company || "",
      contactEmail: eq.contactEmail || "",
      notes: eq.notes || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить оборудование?")) return;
    try {
      const res = await fetch(`/api/equipment/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Удалено");
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        fetchEquipment();
      }
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/equipment/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Импортировано ${data.imported} записей`);
        fetchEquipment();
      } else {
        toast.error(data.error || "Ошибка импорта");
      }
    } catch {
      toast.error("Ошибка импорта");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      categories.forEach((c) => params.append("category", c));
      const res = await fetch(`/api/equipment/export?${params}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}_${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Файл скачан");
    } catch {
      toast.error("Ошибка экспорта");
    }
  };

  const handleCreateRequest = async () => {
    if (selected.size === 0) {
      toast.error("Выберите оборудование");
      return;
    }
    try {
      const res = await fetch("/api/equipment/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ equipmentIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Заявка №${data.requestId} создана`);
        setSelected(new Set());
      } else {
        toast.error(data.error || "Ошибка");
      }
    } catch {
      toast.error("Ошибка создания заявки");
    }
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === equipment.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(equipment.map((e) => e.id)));
    }
  };

  return (
    <div>
      <Toaster position="top-center" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-dark dark:text-white">
          {title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setForm(emptyForm);
            }}
            className="inline-flex items-center gap-2 gradient-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/30 transition-shadow"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Добавить
          </button>
          <label
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-dark-light text-dark dark:text-white border border-gray-200 dark:border-white/10 cursor-pointer hover:bg-gray-50 transition-colors ${importing ? "opacity-50 pointer-events-none" : ""}`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            {importing ? "Импорт..." : "Импорт "}
            (.xlsx)
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImport}
            />
          </label>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-dark-light text-dark dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Экспорт (.xlsx)
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 sm:max-w-xs">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-light text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-light text-sm text-dark dark:text-white"
        >
          <option value="">Все статусы</option>
          <option value="active">Активно</option>
          <option value="pending">Скоро поверка</option>
          <option value="expired">Просрочено</option>
        </select>
        {categoryOptions.length > 1 && (
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-light text-sm text-dark dark:text-white"
          >
            <option value="">Все категории</option>
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20">
          <span className="text-sm font-medium text-dark dark:text-white">
            Выбрано: {selected.size}
          </span>
          <button
            onClick={handleCreateRequest}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold gradient-primary text-white hover:shadow-md transition-shadow"
          >
            Создать заявку
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="px-3 py-1.5 rounded-lg text-sm text-neutral hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            Сбросить
          </button>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white dark:bg-dark-light rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-dark dark:text-white mb-4">
              {editingId
                ? "Редактировать оборудование"
                : "Добавить оборудование"}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral mb-1">
                  Наименование *
                </label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Манометр МП-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral mb-1">
                    Тип/Модель
                  </label>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral mb-1">
                    Категория
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral mb-1">
                    Заводской номер
                  </label>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                    value={form.serialNumber}
                    onChange={(e) =>
                      setForm({ ...form, serialNumber: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral mb-1">
                    Номер реестра
                  </label>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                    value={form.registryNumber}
                    onChange={(e) =>
                      setForm({ ...form, registryNumber: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral mb-1">
                    {dateLabel}
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                    value={form.verificationDate}
                    onChange={(e) =>
                      setForm({ ...form, verificationDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral mb-1">
                    {nextDateLabel}
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                    value={form.nextVerification}
                    onChange={(e) =>
                      setForm({ ...form, nextVerification: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral mb-1">
                    Интервал (мес.)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                    value={form.interval}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        interval: Number(e.target.value) || 12,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral mb-1">
                    Организация
                  </label>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                    value={form.company}
                    onChange={(e) =>
                      setForm({ ...form, company: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral mb-1">
                  Email для уведомлений
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                  value={form.contactEmail}
                  onChange={(e) =>
                    setForm({ ...form, contactEmail: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral mb-1">
                  Примечания
                </label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm resize-none"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-neutral hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 rounded-xl text-sm font-semibold gradient-primary text-white hover:shadow-lg hover:shadow-primary/30 transition-shadow disabled:opacity-50"
              >
                {saving
                  ? "Сохранение..."
                  : editingId
                    ? "Сохранить"
                    : "Добавить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : equipment.length === 0 ? (
        <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-8 text-center">
          <svg
            className="w-16 h-16 mx-auto text-gray-300 dark:text-white/20 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-dark dark:text-white mb-2">
            Нет оборудования
          </h3>
          <p className="text-neutral dark:text-white/70 mb-4">
            Добавьте оборудование вручную или импортируйте из Excel
          </p>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setForm(emptyForm);
            }}
            className="inline-flex items-center gap-2 gradient-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
          >
            Добавить оборудование
          </button>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {equipment.map((eq) => (
              <div
                key={eq.id}
                className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-4"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(eq.id)}
                    onChange={() => toggleSelect(eq.id)}
                    className="mt-1 rounded border-gray-300"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-dark dark:text-white truncate">
                          {eq.name}
                        </div>
                        <div className="text-xs text-neutral dark:text-white/50">
                          {eq.type || "\u2014"}{" "}
                          {eq.serialNumber ? `/ ${eq.serialNumber}` : ""}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[eq.status]?.color || "bg-gray-100 text-gray-600"}`}
                      >
                        {statusConfig[eq.status]?.label || eq.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-neutral">
                      <span>{categoryLabels[eq.category] || eq.category}</span>
                      {eq.nextVerification && (
                        <span>
                          До:{" "}
                          {new Date(eq.nextVerification).toLocaleDateString(
                            "ru-RU",
                          )}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleEdit(eq)}
                        className="text-xs text-primary hover:underline"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(eq.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white dark:bg-dark-light rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          equipment.length > 0 &&
                          selected.size === equipment.length
                        }
                        onChange={toggleAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-dark dark:text-white">
                      Наименование
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-dark dark:text-white">
                      Тип
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-dark dark:text-white">
                      Зав. №
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-dark dark:text-white">
                      Реестр
                    </th>
                    {categoryOptions.length > 1 && (
                      <th className="px-4 py-3 text-left font-semibold text-dark dark:text-white">
                        Категория
                      </th>
                    )}
                    <th className="px-4 py-3 text-left font-semibold text-dark dark:text-white">
                      След. дата
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-dark dark:text-white">
                      Статус
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {equipment.map((eq) => (
                    <tr
                      key={eq.id}
                      className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(eq.id)}
                          onChange={() => toggleSelect(eq.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-dark dark:text-white">
                        {eq.name}
                      </td>
                      <td className="px-4 py-3 text-neutral dark:text-white/60">
                        {eq.type || "\u2014"}
                      </td>
                      <td className="px-4 py-3 text-neutral dark:text-white/60 font-mono text-xs">
                        {eq.serialNumber || "\u2014"}
                      </td>
                      <td className="px-4 py-3 text-neutral dark:text-white/60 font-mono text-xs">
                        {eq.registryNumber || "\u2014"}
                      </td>
                      {categoryOptions.length > 1 && (
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/10 text-dark dark:text-white">
                            {categoryLabels[eq.category] || eq.category}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3 text-neutral dark:text-white/60 whitespace-nowrap">
                        {eq.nextVerification
                          ? new Date(eq.nextVerification).toLocaleDateString(
                              "ru-RU",
                            )
                          : "\u2014"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[eq.status]?.color || "bg-gray-100 text-gray-600"}`}
                        >
                          {statusConfig[eq.status]?.label || eq.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(eq)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-neutral transition-colors"
                            title="Редактировать"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(eq.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 text-red-400 transition-colors"
                            title="Удалить"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
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
