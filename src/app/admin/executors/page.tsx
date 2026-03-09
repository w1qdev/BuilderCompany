"use client";

import { Input } from "@/components/ui/input";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Executor {
  id: number;
  name: string;
  email: string;
  inn: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  services: string;
  accreditationNumber: string | null;
  active: boolean;
  notes: string | null;
  createdAt: string;
  _count: { executorRequests: number };
}

interface ExecutorFormData {
  name: string;
  email: string;
  inn: string;
  phone: string;
  address: string;
  website: string;
  services: string;
  accreditationNumber: string;
  notes: string;
}

const emptyForm: ExecutorFormData = {
  name: "",
  email: "",
  inn: "",
  phone: "",
  address: "",
  website: "",
  services: "",
  accreditationNumber: "",
  notes: "",
};

const serviceColors = [
  "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400",
  "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400",
  "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400",
  "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400",
  "bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-400",
  "bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400",
  "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400",
  "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400",
];

function parseServices(servicesJson: string): string[] {
  try {
    const parsed = JSON.parse(servicesJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function AdminExecutorsPage() {
  const { role: currentRole, getAuthHeaders } = useAdminAuth();
  const [executors, setExecutors] = useState<Executor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ExecutorFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ExecutorFormData, string>>>({});
  const [formLoading, setFormLoading] = useState(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Import
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importLoading, setImportLoading] = useState(false);

  const fetchExecutors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/executors", { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setExecutors(data.executors);
      }
    } catch {
      toast.error("Ошибка загрузки исполнителей");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchExecutors();
  }, [fetchExecutors]);

  // Access control
  if (currentRole !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-dark dark:text-white mb-2">Доступ запрещён</h2>
          <p className="text-neutral dark:text-white/50 text-sm">Только администраторы могут управлять исполнителями.</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: executors.length,
    active: executors.filter((e) => e.active).length,
    inactive: executors.filter((e) => !e.active).length,
  };

  const statCards = [
    { label: "Всего исполнителей", value: stats.total, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
    { label: "Активных", value: stats.active, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10" },
    { label: "Неактивных", value: stats.inactive, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
  ];

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ExecutorFormData, string>> = {};
    if (!form.name.trim()) errors.name = "Введите название";
    if (!form.email.trim()) errors.email = "Введите email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Некорректный email";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (executor: Executor) => {
    setEditingId(executor.id);
    const services = parseServices(executor.services);
    setForm({
      name: executor.name,
      email: executor.email,
      inn: executor.inn || "",
      phone: executor.phone || "",
      address: executor.address || "",
      website: executor.website || "",
      services: services.join(", "),
      accreditationNumber: executor.accreditationNumber || "",
      notes: executor.notes || "",
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setFormLoading(true);
    try {
      const servicesArray = form.services
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const body = {
        name: form.name,
        email: form.email,
        inn: form.inn,
        phone: form.phone,
        address: form.address,
        website: form.website,
        services: servicesArray,
        accreditationNumber: form.accreditationNumber,
        notes: form.notes,
      };

      if (editingId) {
        const res = await fetch(`/api/admin/executors/${editingId}`, {
          method: "PATCH",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const data = await res.json();
          setExecutors((prev) =>
            prev.map((e) => (e.id === editingId ? data.executor : e))
          );
          setModalOpen(false);
          toast.success("Исполнитель обновлён");
        } else {
          const data = await res.json();
          toast.error(data.error || "Ошибка обновления");
        }
      } else {
        const res = await fetch("/api/admin/executors", {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          setModalOpen(false);
          toast.success("Исполнитель создан");
          fetchExecutors();
        } else {
          const data = await res.json();
          toast.error(data.error || "Ошибка создания");
        }
      }
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/executors/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setExecutors((prev) => prev.filter((e) => e.id !== id));
        setDeleteConfirmId(null);
        toast.success("Исполнитель удалён");
      } else {
        toast.error("Ошибка удаления");
      }
    } catch {
      toast.error("Ошибка удаления");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (executor: Executor) => {
    setActionLoading(executor.id);
    try {
      const res = await fetch(`/api/admin/executors/${executor.id}`, {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ active: !executor.active }),
      });
      if (res.ok) {
        setExecutors((prev) =>
          prev.map((e) => (e.id === executor.id ? { ...e, active: !executor.active } : e))
        );
        toast.success(executor.active ? "Исполнитель деактивирован" : "Исполнитель активирован");
      }
    } catch {
      toast.error("Ошибка");
    } finally {
      setActionLoading(null);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/executors/import", {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Импортировано: ${data.created}, пропущено: ${data.skipped}`);
        fetchExecutors();
      } else {
        const data = await res.json();
        toast.error(data.error || "Ошибка импорта");
      }
    } catch {
      toast.error("Ошибка импорта");
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const renderServiceTags = (servicesJson: string) => {
    const services = parseServices(servicesJson);
    if (services.length === 0) return <span className="text-xs text-neutral dark:text-white/30">--</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {services.map((service, idx) => (
          <span
            key={idx}
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${serviceColors[idx % serviceColors.length]}`}
          >
            {service}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-dark dark:text-white">Исполнители</h1>
            <p className="text-xs text-neutral dark:text-white/50">{stats.total} исполнителей</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-shadow disabled:opacity-60"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {importLoading ? "Импорт..." : "Импорт из Excel"}
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 gradient-primary text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/30 transition-shadow"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Добавить исполнителя
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-dark-light rounded-2xl p-4 shadow-sm"
          >
            <div className={`w-9 h-9 ${card.bg} rounded-lg flex items-center justify-center ${card.color} mb-2`}>
              <span className="text-lg font-bold">{card.value}</span>
            </div>
            <div className="text-xs text-neutral dark:text-white/50">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : executors.length === 0 ? (
          <div className="text-center py-16 text-neutral dark:text-white/50">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Исполнители не найдены
          </div>
        ) : (
          <>
            {/* Desktop table header */}
            <div className="hidden lg:grid grid-cols-[1fr_0.8fr_1fr_0.6fr_0.4fr_0.4fr_0.6fr] gap-2 px-4 py-3 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10 text-xs font-semibold text-neutral dark:text-white/50 uppercase tracking-wider">
              <div>Название</div>
              <div>Email</div>
              <div>Услуги</div>
              <div>Аккредитация</div>
              <div className="text-center">Статус</div>
              <div className="text-center">Заявок</div>
              <div className="text-center">Действия</div>
            </div>

            {/* Rows */}
            <div>
              {executors.map((executor, idx) => (
                <motion.div
                  key={executor.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                >
                  {/* Desktop row */}
                  <div
                    className={`hidden lg:grid grid-cols-[1fr_0.8fr_1fr_0.6fr_0.4fr_0.4fr_0.6fr] gap-2 px-4 py-3 border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors items-center ${
                      !executor.active ? "opacity-60" : ""
                    }`}
                  >
                    <div className="font-medium text-dark dark:text-white text-sm truncate" title={executor.name}>
                      {executor.name}
                    </div>
                    <div className="text-sm text-neutral dark:text-white/60 truncate" title={executor.email}>
                      {executor.email}
                    </div>
                    <div>{renderServiceTags(executor.services)}</div>
                    <div className="text-xs text-neutral dark:text-white/60 truncate" title={executor.accreditationNumber || ""}>
                      {executor.accreditationNumber || <span className="text-neutral dark:text-white/30">--</span>}
                    </div>
                    <div className="text-center">
                      <button
                        onClick={() => handleToggleActive(executor)}
                        disabled={actionLoading === executor.id}
                        className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50"
                        style={{ backgroundColor: executor.active ? "#22c55e" : "#d1d5db" }}
                        title={executor.active ? "Активен" : "Неактивен"}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                            executor.active ? "translate-x-[18px]" : "translate-x-[3px]"
                          }`}
                        />
                      </button>
                    </div>
                    <div className="text-sm text-neutral dark:text-white/60 text-center">{executor._count.executorRequests}</div>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEditModal(executor)}
                        className="p-2 text-neutral dark:text-white/60 hover:text-primary dark:hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Редактировать"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {deleteConfirmId === executor.id ? (
                        <div className="flex items-center gap-1 bg-red-50 dark:bg-red-500/10 rounded-lg px-2 py-1">
                          <span className="text-xs text-red-600 dark:text-red-400">Удалить?</span>
                          <button
                            onClick={() => handleDelete(executor.id)}
                            disabled={actionLoading === executor.id}
                            className="px-1.5 py-0.5 text-xs font-semibold text-white bg-red-500 rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                          >
                            Да
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-1.5 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded transition-colors"
                          >
                            Нет
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(executor.id)}
                          className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Удалить"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mobile card */}
                  <div
                    className={`lg:hidden px-4 py-3 border-b border-gray-50 dark:border-white/5 space-y-2 ${
                      !executor.active ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-dark dark:text-white text-sm">{executor.name}</div>
                        <div className="text-xs text-neutral dark:text-white/50">{executor.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(executor)}
                          disabled={actionLoading === executor.id}
                          className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50"
                          style={{ backgroundColor: executor.active ? "#22c55e" : "#d1d5db" }}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                              executor.active ? "translate-x-[18px]" : "translate-x-[3px]"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    <div>{renderServiceTags(executor.services)}</div>
                    <div className="flex items-center justify-between text-xs text-neutral dark:text-white/40">
                      <span>Заявок: {executor._count.executorRequests}</span>
                      {executor.accreditationNumber && <span>Аккр.: {executor.accreditationNumber}</span>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(executor)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral dark:text-white/70 bg-gray-100 dark:bg-white/10 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Изменить
                      </button>
                      {deleteConfirmId === executor.id ? (
                        <div className="flex items-center gap-1 bg-red-50 dark:bg-red-500/10 rounded-lg px-2 py-1">
                          <span className="text-xs text-red-600 dark:text-red-400">Удалить?</span>
                          <button
                            onClick={() => handleDelete(executor.id)}
                            disabled={actionLoading === executor.id}
                            className="px-1.5 py-0.5 text-xs font-semibold text-white bg-red-500 rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                          >
                            Да
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-1.5 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded transition-colors"
                          >
                            Нет
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(executor.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Удалить
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-dark-light rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-dark dark:text-white mb-4">
                {editingId ? "Редактировать исполнителя" : "Добавить исполнителя"}
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral dark:text-white/50 mb-1">Название *</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="ООО «Лаборатория»"
                    className="dark:bg-dark dark:border-white/10 dark:text-white"
                  />
                  {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral dark:text-white/50 mb-1">Email *</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="lab@example.com"
                    className="dark:bg-dark dark:border-white/10 dark:text-white"
                  />
                  {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral dark:text-white/50 mb-1">ИНН</label>
                    <Input
                      value={form.inn}
                      onChange={(e) => setForm({ ...form, inn: e.target.value })}
                      placeholder="1234567890"
                      className="dark:bg-dark dark:border-white/10 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral dark:text-white/50 mb-1">Телефон</label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+7 (999) 123-45-67"
                      className="dark:bg-dark dark:border-white/10 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral dark:text-white/50 mb-1">Адрес</label>
                  <Input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="г. Москва, ул. Примерная, д. 1"
                    className="dark:bg-dark dark:border-white/10 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral dark:text-white/50 mb-1">Сайт</label>
                  <Input
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="https://example.com"
                    className="dark:bg-dark dark:border-white/10 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral dark:text-white/50 mb-1">
                    Услуги <span className="text-neutral dark:text-white/30">(через запятую)</span>
                  </label>
                  <Input
                    value={form.services}
                    onChange={(e) => setForm({ ...form, services: e.target.value })}
                    placeholder="Поверка, Калибровка, Испытания"
                    className="dark:bg-dark dark:border-white/10 dark:text-white"
                  />
                  {form.services.trim() && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {form.services
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((service, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${serviceColors[idx % serviceColors.length]}`}
                          >
                            {service}
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral dark:text-white/50 mb-1">Номер аккредитации</label>
                  <Input
                    value={form.accreditationNumber}
                    onChange={(e) => setForm({ ...form, accreditationNumber: e.target.value })}
                    placeholder="RA.RU.311234"
                    className="dark:bg-dark dark:border-white/10 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral dark:text-white/50 mb-1">Заметки</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Дополнительная информация..."
                    rows={3}
                    className="w-full rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-dark px-3 py-2 text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleSave}
                  disabled={formLoading}
                  className="flex-1 px-4 py-2.5 gradient-primary text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/30 transition-shadow disabled:opacity-60"
                >
                  {formLoading ? "Сохранение..." : "Сохранить"}
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 dark:bg-white/10 text-dark dark:text-white rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
