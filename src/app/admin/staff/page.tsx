"use client";

import { Input } from "@/components/ui/input";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface StaffMember {
  id: number;
  name: string;
  login: string;
  role: string;
  active: boolean;
  createdAt: string;
  _count: { requests: number };
}

interface StaffFormData {
  name: string;
  login: string;
  password: string;
  role: string;
}

const emptyForm: StaffFormData = { name: "", login: "", password: "", role: "staff" };

export default function AdminStaffPage() {
  const { role: currentRole, getAuthHeaders } = useAdminAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<StaffFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof StaffFormData, string>>>({});
  const [formLoading, setFormLoading] = useState(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Reset password result
  const [resetPasswordResult, setResetPasswordResult] = useState<{ id: number; password: string } | null>(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/staff", { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setStaff(data.staff);
      }
    } catch {
      toast.error("Ошибка загрузки сотрудников");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

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
          <p className="text-neutral dark:text-white/50 text-sm">Только администраторы могут управлять сотрудниками.</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: staff.length,
    active: staff.filter((s) => s.active).length,
    inactive: staff.filter((s) => !s.active).length,
  };

  const statCards = [
    { label: "Всего сотрудников", value: stats.total, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
    { label: "Активных", value: stats.active, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10" },
    { label: "Неактивных", value: stats.inactive, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
  ];

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof StaffFormData, string>> = {};
    if (!form.name.trim()) errors.name = "Введите имя";
    if (!form.login.trim() || form.login.trim().length < 3) errors.login = "Минимум 3 символа";
    if (!editingId && (!form.password || form.password.length < 8)) errors.password = "Минимум 8 символов";
    if (editingId && form.password && form.password.length < 8) errors.password = "Минимум 8 символов";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (member: StaffMember) => {
    setEditingId(member.id);
    setForm({ name: member.name, login: member.login, password: "", role: member.role });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setFormLoading(true);
    try {
      if (editingId) {
        // Update
        const body: Record<string, string> = { name: form.name, login: form.login, role: form.role };
        if (form.password) body.password = form.password;
        const res = await fetch(`/api/admin/staff/${editingId}`, {
          method: "PATCH",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const data = await res.json();
          setStaff((prev) => prev.map((s) => (s.id === editingId ? { ...s, ...data.staff, _count: s._count } : s)));
          setModalOpen(false);
          toast.success("Сотрудник обновлён");
        } else {
          const data = await res.json();
          toast.error(data.error || "Ошибка обновления");
        }
      } else {
        // Create
        const res = await fetch("/api/admin/staff", {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          setModalOpen(false);
          toast.success("Сотрудник создан");
          fetchStaff();
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
      const res = await fetch(`/api/admin/staff/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setStaff((prev) => prev.filter((s) => s.id !== id));
        setDeleteConfirmId(null);
        toast.success("Сотрудник удалён");
      } else {
        toast.error("Ошибка удаления");
      }
    } catch {
      toast.error("Ошибка удаления");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (member: StaffMember) => {
    setActionLoading(member.id);
    try {
      const res = await fetch(`/api/admin/staff/${member.id}`, {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ active: !member.active }),
      });
      if (res.ok) {
        setStaff((prev) => prev.map((s) => (s.id === member.id ? { ...s, active: !member.active } : s)));
        toast.success(member.active ? "Сотрудник деактивирован" : "Сотрудник активирован");
      }
    } catch {
      toast.error("Ошибка");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (member: StaffMember) => {
    setActionLoading(member.id);
    try {
      const newPassword = Array.from(crypto.getRandomValues(new Uint8Array(12)))
        .map((b) => "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%"[b % 62])
        .join("");

      const res = await fetch(`/api/admin/staff/${member.id}`, {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (res.ok) {
        setResetPasswordResult({ id: member.id, password: newPassword });
        toast.success("Пароль сброшен");
      } else {
        toast.error("Ошибка сброса пароля");
      }
    } catch {
      toast.error("Ошибка сброса пароля");
    } finally {
      setActionLoading(null);
    }
  };

  const roleBadge = (role: string) => {
    if (role === "admin") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
          Админ
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400">
        Сотрудник
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-dark dark:text-white">Сотрудники</h1>
            <p className="text-xs text-neutral dark:text-white/50">{stats.total} сотрудников</p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 gradient-primary text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/30 transition-shadow"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Добавить сотрудника
        </button>
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
        ) : staff.length === 0 ? (
          <div className="text-center py-16 text-neutral dark:text-white/50">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Сотрудники не найдены
          </div>
        ) : (
          <>
            {/* Desktop table header */}
            <div className="hidden lg:grid grid-cols-[1fr_0.8fr_0.6fr_0.5fr_0.5fr_0.7fr_0.8fr] gap-2 px-4 py-3 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10 text-xs font-semibold text-neutral dark:text-white/50 uppercase tracking-wider">
              <div>Имя</div>
              <div>Логин</div>
              <div>Роль</div>
              <div className="text-center">Заявок</div>
              <div className="text-center">Статус</div>
              <div>Дата создания</div>
              <div className="text-center">Действия</div>
            </div>

            {/* Rows */}
            <div>
              {staff.map((member, idx) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                >
                  {/* Desktop row */}
                  <div
                    className={`hidden lg:grid grid-cols-[1fr_0.8fr_0.6fr_0.5fr_0.5fr_0.7fr_0.8fr] gap-2 px-4 py-3 border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors items-center ${
                      !member.active ? "opacity-60" : ""
                    }`}
                  >
                    <div className="font-medium text-dark dark:text-white text-sm truncate">{member.name}</div>
                    <div className="text-sm text-neutral dark:text-white/60 truncate font-mono">{member.login}</div>
                    <div>{roleBadge(member.role)}</div>
                    <div className="text-sm text-neutral dark:text-white/60 text-center">{member._count.requests}</div>
                    <div className="text-center">
                      <button
                        onClick={() => handleToggleActive(member)}
                        disabled={actionLoading === member.id}
                        className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50"
                        style={{ backgroundColor: member.active ? "#22c55e" : "#d1d5db" }}
                        title={member.active ? "Активен" : "Неактивен"}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                            member.active ? "translate-x-[18px]" : "translate-x-[3px]"
                          }`}
                        />
                      </button>
                    </div>
                    <div className="text-xs text-neutral dark:text-white/40">{formatDate(member.createdAt)}</div>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEditModal(member)}
                        className="p-2 text-neutral dark:text-white/60 hover:text-primary dark:hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Редактировать"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleResetPassword(member)}
                        disabled={actionLoading === member.id}
                        className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Сбросить пароль"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </button>
                      {deleteConfirmId === member.id ? (
                        <div className="flex items-center gap-1 bg-red-50 dark:bg-red-500/10 rounded-lg px-2 py-1">
                          <span className="text-xs text-red-600 dark:text-red-400">Удалить?</span>
                          <button
                            onClick={() => handleDelete(member.id)}
                            disabled={actionLoading === member.id}
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
                          onClick={() => setDeleteConfirmId(member.id)}
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
                      !member.active ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-dark dark:text-white text-sm">{member.name}</div>
                        <div className="text-xs text-neutral dark:text-white/50 font-mono">{member.login}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {roleBadge(member.role)}
                        <button
                          onClick={() => handleToggleActive(member)}
                          disabled={actionLoading === member.id}
                          className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50"
                          style={{ backgroundColor: member.active ? "#22c55e" : "#d1d5db" }}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                              member.active ? "translate-x-[18px]" : "translate-x-[3px]"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-neutral dark:text-white/40">
                      <span>Заявок: {member._count.requests}</span>
                      <span>{formatDate(member.createdAt)}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(member)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral dark:text-white/70 bg-gray-100 dark:bg-white/10 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Изменить
                      </button>
                      <button
                        onClick={() => handleResetPassword(member)}
                        disabled={actionLoading === member.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Пароль
                      </button>
                      {deleteConfirmId === member.id ? (
                        <div className="flex items-center gap-1 bg-red-50 dark:bg-red-500/10 rounded-lg px-2 py-1">
                          <span className="text-xs text-red-600 dark:text-red-400">Удалить?</span>
                          <button
                            onClick={() => handleDelete(member.id)}
                            disabled={actionLoading === member.id}
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
                          onClick={() => setDeleteConfirmId(member.id)}
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

                  {/* Reset password result */}
                  <AnimatePresence>
                    {resetPasswordResult?.id === member.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 py-3 bg-green-50 dark:bg-green-500/10 border-b border-green-200 dark:border-green-500/20 flex items-center gap-3">
                          <svg className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <div className="text-sm font-medium text-green-800 dark:text-green-300">Новый пароль для {member.name}:</div>
                            <code className="text-sm font-mono text-green-700 dark:text-green-400 select-all">{resetPasswordResult.password}</code>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(resetPasswordResult.password);
                              toast.success("Пароль скопирован");
                            }}
                            className="ml-auto px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20 rounded-lg transition-colors"
                          >
                            Копировать
                          </button>
                          <button
                            onClick={() => setResetPasswordResult(null)}
                            className="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
              className="bg-white dark:bg-dark-light rounded-2xl shadow-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-dark dark:text-white mb-4">
                {editingId ? "Редактировать сотрудника" : "Добавить сотрудника"}
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral dark:text-white/50 mb-1">Имя</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Иван Иванов"
                    className="dark:bg-dark dark:border-white/10 dark:text-white"
                  />
                  {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral dark:text-white/50 mb-1">Логин</label>
                  <Input
                    value={form.login}
                    onChange={(e) => setForm({ ...form, login: e.target.value })}
                    placeholder="ivan"
                    className="dark:bg-dark dark:border-white/10 dark:text-white"
                  />
                  {formErrors.login && <p className="text-xs text-red-500 mt-1">{formErrors.login}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral dark:text-white/50 mb-1">
                    Пароль {editingId && <span className="text-neutral dark:text-white/30">(оставьте пустым, чтобы не менять)</span>}
                  </label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={editingId ? "Новый пароль" : "Минимум 8 символов"}
                    className="dark:bg-dark dark:border-white/10 dark:text-white"
                  />
                  {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral dark:text-white/50 mb-1">Роль</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-dark px-3 py-2 text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="staff">Сотрудник</option>
                    <option value="admin">Администратор</option>
                  </select>
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
