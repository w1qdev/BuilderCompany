"use client";

import { Input } from "@/components/ui/input";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useSocket } from "@/lib/useSocket";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  banned: boolean;
  createdAt: string;
  _count: { requests: number; equipment: number };
}

type FilterStatus = "all" | "active" | "banned";

export default function AdminUsersPage() {
  const { password } = useAdminAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<{ id: number; name: string; email: string; phone: string; company: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [resetPasswordResult, setResetPasswordResult] = useState<{ id: number; password: string } | null>(null);
  const [stats, setStats] = useState<{ totalUsers: number; activeUsers: number; bannedUsers: number } | null>(null);

  const headers = { "x-admin-password": password };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      if (filterStatus !== "all") params.set("status", filterStatus);

      const res = await fetch(`/api/admin/users?${params}`, { headers: { "x-admin-password": password } });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotal(data.total);
        setPages(data.pages);
      }
    } catch {
      toast.error("Ошибка загрузки пользователей");
    } finally {
      setLoading(false);
    }
  }, [password, page, search, filterStatus]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users/stats", { headers: { "x-admin-password": password } });
      if (res.ok) {
        const data = await res.json();
        setStats({ totalUsers: data.totalUsers, activeUsers: data.activeUsers, bannedUsers: data.bannedUsers });
      }
    } catch {
      // non-critical
    }
  }, [password]);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  // Realtime: refetch when new user registers
  const socket = useSocket({ isAdmin: true });
  useEffect(() => {
    if (!socket) return;
    const handler = () => { fetchUsers(); fetchStats(); };
    socket.on("new-user-registered", handler);
    return () => { socket.off("new-user-registered", handler); };
  }, [socket]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const handleBan = async (userId: number) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, banned: data.banned } : u)));
        toast.success(data.banned ? "Пользователь заблокирован" : "Пользователь разблокирован");
        fetchStats();
      }
    } catch {
      toast.error("Ошибка");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: number) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setTotal((t) => t - 1);
        setDeleteConfirmId(null);
        setExpandedId(null);
        toast.success("Пользователь удален");
        fetchStats();
      }
    } catch {
      toast.error("Ошибка удаления");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (userId: number) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setResetPasswordResult({ id: userId, password: data.newPassword });
        toast.success("Пароль сброшен");
      }
    } catch {
      toast.error("Ошибка сброса пароля");
    } finally {
      setActionLoading(null);
    }
  };

  const handleImpersonate = async (userId: number) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/impersonate`, {
        method: "POST",
        headers,
      });
      if (res.ok) {
        window.open("/dashboard", "_blank");
        toast.success("Сессия создана — откройте вкладку");
      }
    } catch {
      toast.error("Ошибка");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = async () => {
    if (!editingUser) return;
    setActionLoading(editingUser.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(editingUser),
      });
      if (res.ok) {
        const data = await res.json();
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingUser.id
              ? { ...u, name: data.user.name, email: data.user.email, phone: data.user.phone, company: data.user.company }
              : u,
          ),
        );
        setEditingUser(null);
        toast.success("Данные обновлены");
      }
    } catch {
      toast.error("Ошибка обновления");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });

  const statCards = [
    { label: "Всего", value: stats?.totalUsers ?? "—", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
    { label: "Активные", value: stats?.activeUsers ?? "—", color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10" },
    { label: "Заблокированные", value: stats?.bannedUsers ?? "—", color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
  ];

  const filterOptions: { label: string; value: FilterStatus }[] = [
    { label: "Все", value: "all" },
    { label: "Активные", value: "active" },
    { label: "Заблокированные", value: "banned" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-dark dark:text-white">Пользователи</h1>
            <p className="text-xs text-neutral dark:text-white/50">{total} пользователей</p>
          </div>
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            placeholder="Поиск по имени, email, телефону, компании..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 dark:bg-dark dark:border-white/10 dark:text-white"
          />
        </div>
        <div className="flex bg-white dark:bg-dark-light rounded-xl p-1 shadow-sm">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setFilterStatus(opt.value); setPage(1); }}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                filterStatus === opt.value
                  ? "bg-primary text-white shadow-sm"
                  : "text-neutral dark:text-white/60 hover:text-dark dark:hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-neutral dark:text-white/50">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Пользователи не найдены
          </div>
        ) : (
          <>
            {/* Desktop table header */}
            <div className="hidden lg:grid grid-cols-[1fr_1.2fr_0.8fr_0.8fr_0.5fr_0.5fr_0.7fr_0.5fr] gap-2 px-4 py-3 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10 text-xs font-semibold text-neutral dark:text-white/50 uppercase tracking-wider">
              <div>Имя</div>
              <div>Email</div>
              <div>Телефон</div>
              <div>Компания</div>
              <div className="text-center">Заявки</div>
              <div className="text-center">СИ</div>
              <div>Дата</div>
              <div className="text-center">Статус</div>
            </div>

            {/* Rows */}
            <div>
              {users.map((user, idx) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                >
                  {/* Row */}
                  <div
                    onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
                    className={`grid lg:grid-cols-[1fr_1.2fr_0.8fr_0.8fr_0.5fr_0.5fr_0.7fr_0.5fr] gap-2 px-4 py-3 cursor-pointer border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors items-center ${
                      user.banned ? "opacity-60" : ""
                    }`}
                  >
                    <div className="font-medium text-dark dark:text-white text-sm truncate">{user.name}</div>
                    <div className="text-sm text-neutral dark:text-white/60 truncate">{user.email}</div>
                    <div className="text-sm text-neutral dark:text-white/60 hidden lg:block truncate">{user.phone || "—"}</div>
                    <div className="text-sm text-neutral dark:text-white/60 hidden lg:block truncate">{user.company || "—"}</div>
                    <div className="text-sm text-neutral dark:text-white/60 text-center hidden lg:block">{user._count.requests}</div>
                    <div className="text-sm text-neutral dark:text-white/60 text-center hidden lg:block">{user._count.equipment}</div>
                    <div className="text-xs text-neutral dark:text-white/40 hidden lg:block">{formatDate(user.createdAt)}</div>
                    <div className="text-center hidden lg:block">
                      {user.banned ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
                          Заблокирован
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400">
                          Активен
                        </span>
                      )}
                    </div>
                    {/* Mobile status */}
                    <div className="lg:hidden flex items-center gap-2 text-xs text-neutral dark:text-white/40">
                      {user.banned ? (
                        <span className="text-red-500">Заблокирован</span>
                      ) : (
                        <span className="text-green-500">Активен</span>
                      )}
                      <span>{formatDate(user.createdAt)}</span>
                    </div>
                  </div>

                  {/* Expanded row */}
                  <AnimatePresence>
                    {expandedId === user.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-b border-gray-100 dark:border-white/10"
                      >
                        <div className="px-4 py-4 bg-gray-50/50 dark:bg-white/[0.02] space-y-4">
                          {/* User info */}
                          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-neutral dark:text-white/40 text-xs">Телефон</span>
                              <div className="text-dark dark:text-white">{user.phone || "Не указан"}</div>
                            </div>
                            <div>
                              <span className="text-neutral dark:text-white/40 text-xs">Компания</span>
                              <div className="text-dark dark:text-white">{user.company || "Не указана"}</div>
                            </div>
                            <div>
                              <span className="text-neutral dark:text-white/40 text-xs">Заявок</span>
                              <div className="text-dark dark:text-white">{user._count.requests}</div>
                            </div>
                            <div>
                              <span className="text-neutral dark:text-white/40 text-xs">Оборудование</span>
                              <div className="text-dark dark:text-white">{user._count.equipment}</div>
                            </div>
                          </div>

                          {/* Edit form */}
                          {editingUser?.id === user.id ? (
                            <div className="bg-white dark:bg-dark rounded-xl p-4 space-y-3">
                              <h4 className="text-sm font-semibold text-dark dark:text-white">Редактирование</h4>
                              <div className="grid sm:grid-cols-2 gap-3">
                                <Input
                                  value={editingUser.name}
                                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                  placeholder="Имя"
                                  className="dark:bg-dark-light dark:border-white/10 dark:text-white"
                                />
                                <Input
                                  value={editingUser.email}
                                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                  placeholder="Email"
                                  className="dark:bg-dark-light dark:border-white/10 dark:text-white"
                                />
                                <Input
                                  value={editingUser.phone}
                                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                                  placeholder="Телефон"
                                  className="dark:bg-dark-light dark:border-white/10 dark:text-white"
                                />
                                <Input
                                  value={editingUser.company}
                                  onChange={(e) => setEditingUser({ ...editingUser, company: e.target.value })}
                                  placeholder="Компания"
                                  className="dark:bg-dark-light dark:border-white/10 dark:text-white"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={handleEdit}
                                  disabled={actionLoading === user.id}
                                  className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                  Сохранить
                                </button>
                                <button
                                  onClick={() => setEditingUser(null)}
                                  className="px-4 py-2 bg-gray-100 dark:bg-white/10 text-dark dark:text-white rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                                >
                                  Отмена
                                </button>
                              </div>
                            </div>
                          ) : null}

                          {/* Reset password result */}
                          {resetPasswordResult?.id === user.id && (
                            <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl p-3 flex items-center gap-3">
                              <svg className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div>
                                <div className="text-sm font-medium text-green-800 dark:text-green-300">Новый пароль:</div>
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
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() =>
                                setEditingUser({
                                  id: user.id,
                                  name: user.name,
                                  email: user.email,
                                  phone: user.phone || "",
                                  company: user.company || "",
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-neutral dark:text-white/70 bg-gray-100 dark:bg-white/10 rounded-xl hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Редактировать
                            </button>

                            <button
                              onClick={() => handleResetPassword(user.id)}
                              disabled={actionLoading === user.id}
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                              Сбросить пароль
                            </button>

                            <button
                              onClick={() => handleBan(user.id)}
                              disabled={actionLoading === user.id}
                              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 ${
                                user.banned
                                  ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 hover:bg-green-100 dark:hover:bg-green-500/20"
                                  : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20"
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                              {user.banned ? "Разблокировать" : "Заблокировать"}
                            </button>

                            <button
                              onClick={() => handleImpersonate(user.id)}
                              disabled={actionLoading === user.id}
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                              </svg>
                              Войти как
                            </button>

                            {deleteConfirmId === user.id ? (
                              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2">
                                <span className="text-sm text-red-600 dark:text-red-400">Удалить?</span>
                                <button
                                  onClick={() => handleDelete(user.id)}
                                  disabled={actionLoading === user.id}
                                  className="px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                                >
                                  Да
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-2 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                                >
                                  Нет
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(user.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Удалить
                              </button>
                            )}
                          </div>
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

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-neutral dark:text-white/50">
            Показано {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} из {total}
          </div>
          <div className="flex gap-1">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  p === page
                    ? "bg-primary text-white"
                    : "text-neutral dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
