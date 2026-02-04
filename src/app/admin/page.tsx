"use client";

import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import { io as ioClient, Socket } from "socket.io-client";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";

interface RequestItem {
  id: number;
  name: string;
  phone: string;
  email: string;
  service: string;
  message: string | null;
  fileName: string | null;
  filePath: string | null;
  status: string;
  createdAt: string;
}

interface Stats {
  total: number;
  new: number;
  in_progress: number;
  done: number;
}

const statusLabels: Record<string, { label: string; variant: "new" | "in_progress" | "done" }> = {
  new: { label: "Новая", variant: "new" },
  in_progress: { label: "В работе", variant: "in_progress" },
  done: { label: "Завершена", variant: "done" },
};

const statusCycle = ["new", "in_progress", "done"];

type SortField = "createdAt" | "name" | "service" | "status";

const sortableColumns: { field: SortField; label: string }[] = [
  { field: "createdAt", label: "Дата" },
  { field: "name", label: "Имя" },
  { field: "service", label: "Услуга" },
  { field: "status", label: "Статус" },
];

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // New state
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({ emailNotifyAdmin: true, emailNotifyCustomer: true, telegramNotify: true, notifyEmail: "", companyPhone: "", companyEmail: "", companyAddress: "" });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { "x-admin-password": password },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Stats are non-critical
    }
  }, [password]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings", {
        headers: { "x-admin-password": password },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch {
      // Non-critical
    }
  }, [password]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: filter,
        page: String(page),
        sortBy,
        sortOrder,
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin?${params}`, {
        headers: { "x-admin-password": password },
      });
      if (!res.ok) {
        if (res.status === 401) {
          setAuthenticated(false);
          setError("Неверный пароль");
          return;
        }
        throw new Error("Ошибка загрузки");
      }
      const data = await res.json();
      setRequests(data.requests);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      setError("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  }, [password, filter, page, search, sortBy, sortOrder]);

  const changePassword = async () => {
    setPasswordError("");
    setPasswordSuccess(false);
    if (newPassword.length < 4) {
      setPasswordError("Пароль должен быть не менее 4 символов");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Пароли не совпадают");
      return;
    }
    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ newPassword }),
      });
      if (res.ok) {
        setPassword(newPassword);
        setNewPassword("");
        setConfirmPassword("");
        setPasswordSuccess(true);
      } else {
        const data = await res.json();
        setPasswordError(data.error || "Ошибка смены пароля");
      }
    } catch {
      setPasswordError("Ошибка соединения");
    }
  };

  const toggleSetting = async (key: "emailNotifyAdmin" | "emailNotifyCustomer" | "telegramNotify") => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    try {
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify(updated),
      });
    } catch {
      setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const closeSettings = () => {
    fetch("/api/admin/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify(settings),
    }).catch(() => {});
    setShowSettings(false);
  };

  useEffect(() => {
    if (authenticated) {
      fetchRequests();
      fetchStats();
      fetchSettings();
    }
  }, [authenticated, fetchRequests, fetchStats, fetchSettings]);

  useEffect(() => {
    document.body.style.overflow = showSettings ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showSettings]);

  // Debounced search
  const handleSearchInput = (value: string) => {
    setSearchInput(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 400);
  };

  // Socket.io connection
  useEffect(() => {
    if (!authenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const socket = ioClient({
      path: "/api/socketio",
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("new-request", (request: RequestItem) => {
      setRequests((prev) => {
        if (prev.some((r) => r.id === request.id)) return prev;
        return [request, ...prev];
      });
      setTotal((prev) => prev + 1);
      fetchStats();
    });

    socket.on("status-update", (updated: RequestItem) => {
      setRequests((prev) =>
        prev.map((r) => (r.id === updated.id ? { ...r, status: updated.status } : r))
      );
      fetchStats();
    });

    socket.on("delete-request", ({ id }: { id: number }) => {
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setTotal((prev) => prev - 1);
      fetchStats();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [authenticated, fetchStats]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAuthenticated(true);
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setPassword("");
  };

  const cycleStatus = async (e: React.MouseEvent, id: number, currentStatus: string) => {
    e.stopPropagation();
    const currentIdx = statusCycle.indexOf(currentStatus);
    const nextStatus = statusCycle[(currentIdx + 1) % statusCycle.length];

    try {
      const res = await fetch(`/api/admin/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r))
        );
        fetchStats();
      }
    } catch {
      console.error("Status update failed");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": password },
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
        setTotal((prev) => prev - 1);
        setExpandedId(null);
        setDeleteConfirmId(null);
        fetchStats();
      }
    } catch {
      console.error("Delete failed");
    }
  };

  const openFile = async (filePath: string) => {
    const res = await fetch(filePath, {
      headers: { "x-admin-password": password },
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    }
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const exportCSV = () => {
    const headers = ["ID", "Дата", "Имя", "Телефон", "Email", "Услуга", "Сообщение", "Статус"];
    const rows = requests.map((r) => [
      r.id,
      formatDate(r.createdAt),
      r.name,
      r.phone,
      r.email,
      r.service,
      r.message || "",
      statusLabels[r.status]?.label || r.status,
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")
      ),
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `requests_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateFull = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("ru-RU", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const SortArrow = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <span className="text-gray-300 ml-1">&#8597;</span>;
    return (
      <span className="ml-1">
        {sortOrder === "asc" ? "\u2191" : "\u2193"}
      </span>
    );
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-warm-bg flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-dark">Админ-панель</h1>
            <p className="text-neutral text-sm mt-1">Введите пароль для входа</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <Input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4"
          />
          <button
            type="submit"
            className="w-full gradient-primary text-white py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all"
          >
            Войти
          </button>
        </form>
      </div>
    );
  }

  const statsCards = [
    { key: "all", label: "Всего", value: stats?.total ?? 0, icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", bg: "bg-gray-50", iconBg: "bg-gray-200 text-gray-600" },
    { key: "new", label: "Новые", value: stats?.new ?? 0, icon: "M12 6v6m0 0v6m0-6h6m-6 0H6", bg: "bg-blue-50", iconBg: "bg-blue-200 text-blue-600" },
    { key: "in_progress", label: "В работе", value: stats?.in_progress ?? 0, icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", bg: "bg-yellow-50", iconBg: "bg-yellow-200 text-yellow-600" },
    { key: "done", label: "Завершены", value: stats?.done ?? 0, icon: "M5 13l4 4L19 7", bg: "bg-green-50", iconBg: "bg-green-200 text-green-600" },
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-warm-bg">
        {/* Header */}
        <div className="gradient-dark text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="font-bold">ЦСМ</span>
              </a>
              <span className="text-white/40 text-sm">/ Админ-панель</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSettings(true)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </button>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`} />
                <span className="text-xs text-white/50">{connected ? "Онлайн" : "Оффлайн"}</span>
              </div>
              <span className="text-sm text-white/60">Заявок: {total}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statsCards.map((card) => (
              <button
                key={card.key}
                onClick={() => {
                  setFilter(card.key);
                  setPage(1);
                }}
                className={`${card.bg} rounded-2xl p-4 text-left transition-all hover:shadow-md ${
                  filter === card.key ? "ring-2 ring-primary shadow-md" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-dark">{card.value}</div>
                    <div className="text-xs text-neutral">{card.label}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Search + Actions */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral z-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <Input
                type="text"
                placeholder="Поиск по имени, телефону, email..."
                value={searchInput}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <button
              onClick={fetchRequests}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white text-neutral hover:bg-gray-50 transition-all border border-gray-200"
            >
              Обновить
            </button>
            <button
              onClick={exportCSV}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white text-neutral hover:bg-gray-50 transition-all border border-gray-200 flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Экспорт CSV
            </button>
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {[
              { value: "all", label: "Все" },
              { value: "new", label: "Новые" },
              { value: "in_progress", label: "В работе" },
              { value: "done", label: "Завершены" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setFilter(f.value);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === f.value
                    ? "gradient-primary text-white shadow-md"
                    : "bg-white text-neutral hover:bg-gray-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-20 text-neutral">Загрузка...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-20 text-neutral">Заявок пока нет</div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-warm-bg hover:bg-warm-bg">
                    <TableHead className="font-semibold text-dark">#</TableHead>
                    {sortableColumns.map((col) => (
                      <TableHead
                        key={col.field}
                        className="font-semibold text-dark cursor-pointer select-none hover:text-primary transition-colors"
                        onClick={() => handleSort(col.field)}
                      >
                        {col.label}
                        <SortArrow field={col.field} />
                      </TableHead>
                    ))}
                    <TableHead className="font-semibold text-dark">Телефон</TableHead>
                    <TableHead className="font-semibold text-dark">Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => (
                    <Fragment key={r.id}>
                      <TableRow
                        onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                        className="border-t border-gray-100 hover:bg-warm-bg/50 cursor-pointer"
                      >
                        <TableCell className="text-neutral">{r.id}</TableCell>
                        <TableCell className="text-neutral whitespace-nowrap">{formatDate(r.createdAt)}</TableCell>
                        <TableCell className="font-medium text-dark">{r.name}</TableCell>
                        <TableCell className="text-neutral">{r.service}</TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={(e) => cycleStatus(e, r.id, r.status)}
                                className="transition-all hover:scale-105"
                              >
                                <Badge variant={statusLabels[r.status]?.variant || "default"}>
                                  {statusLabels[r.status]?.label || r.status}
                                </Badge>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Нажмите для смены статуса</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-neutral">{r.phone}</TableCell>
                        <TableCell className="text-neutral">{r.email}</TableCell>
                      </TableRow>
                      {expandedId === r.id && (
                        <TableRow key={`${r.id}-detail`} className="border-t border-gray-100">
                          <TableCell colSpan={7} className="bg-warm-bg/30">
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div>
                                <div className="text-xs text-neutral mb-1 font-medium uppercase tracking-wide">Сообщение</div>
                                <div className="text-sm text-dark bg-white rounded-xl p-3">
                                  {r.message || <span className="text-neutral italic">Нет сообщения</span>}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <div className="text-xs text-neutral mb-1 font-medium uppercase tracking-wide">Дата создания</div>
                                  <div className="text-sm text-dark">{formatDateFull(r.createdAt)}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-neutral mb-1 font-medium uppercase tracking-wide">Контакты</div>
                                  <div className="text-sm text-dark">{r.name} &middot; {r.phone} &middot; {r.email}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-neutral mb-1 font-medium uppercase tracking-wide">Услуга</div>
                                  <div className="text-sm text-dark">{r.service}</div>
                                </div>
                                {r.fileName && r.filePath && (
                                  <div>
                                    <div className="text-xs text-neutral mb-1 font-medium uppercase tracking-wide">Прикрепленный файл</div>
                                    <button
                                      onClick={() => openFile(r.filePath!)}
                                      className="inline-flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      {r.fileName}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2">
                              {deleteConfirmId === r.id ? (
                                <>
                                  <span className="text-sm text-red-600">Удалить заявку?</span>
                                  <button
                                    onClick={() => handleDelete(r.id)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
                                  >
                                    Да, удалить
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                                  >
                                    Отмена
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirmId(r.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Удалить
                                </button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-100">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                        page === p
                          ? "gradient-primary text-white"
                          : "text-neutral hover:bg-gray-100"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSettings}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md"
            >
              <button
                onClick={closeSettings}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-extrabold text-dark">Настройки</h3>
                  <p className="text-neutral text-sm mt-1">Уведомления, сайт и безопасность</p>
                </div>

                <div className="divide-y divide-gray-100">
                  {/* Email admin */}
                  <div className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-dark">Уведомление по email</div>
                        <div className="text-xs text-neutral mt-0.5">Получать письма о новых заявках</div>
                      </div>
                      <button
                        onClick={() => toggleSetting("emailNotifyAdmin")}
                        className={`relative w-11 h-6 rounded-full transition-colors ${settings.emailNotifyAdmin ? "bg-primary" : "bg-gray-300"}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.emailNotifyAdmin ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                    {settings.emailNotifyAdmin && (
                      <div className="mt-3">
                        <label className="text-xs text-neutral mb-1 block">Адрес для уведомлений</label>
                        <Input
                          type="email"
                          placeholder="admin@company.com"
                          value={settings.notifyEmail}
                          onChange={(e) => setSettings((prev) => ({ ...prev, notifyEmail: e.target.value }))}
                        />
                        <p className="text-xs text-neutral/60 mt-1">Если пусто — используется NOTIFY_EMAIL из окружения</p>
                      </div>
                    )}
                  </div>

                  {/* Email customer */}
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <div className="text-sm font-medium text-dark">Подтверждение заявки</div>
                      <div className="text-xs text-neutral mt-0.5">Отправлять клиенту письмо о принятии заявки</div>
                    </div>
                    <button
                      onClick={() => toggleSetting("emailNotifyCustomer")}
                      className={`relative w-11 h-6 rounded-full transition-colors ${settings.emailNotifyCustomer ? "bg-primary" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.emailNotifyCustomer ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>

                  {/* Telegram */}
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <div className="text-sm font-medium text-dark">Уведомление в Telegram</div>
                      <div className="text-xs text-neutral mt-0.5">Отправлять сообщение в чат бота</div>
                    </div>
                    <button
                      onClick={() => toggleSetting("telegramNotify")}
                      className={`relative w-11 h-6 rounded-full transition-colors ${settings.telegramNotify ? "bg-primary" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.telegramNotify ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>

                  {/* Контакты компании */}
                  <div className="py-4 space-y-3">
                    <div className="text-xs font-semibold text-neutral uppercase tracking-wide">Контакты компании</div>
                    <div>
                      <label className="text-xs text-neutral mb-1 block">Телефон</label>
                      <Input
                        type="text"
                        placeholder="8 (800) 123-45-67"
                        value={settings.companyPhone}
                        onChange={(e) => setSettings((prev) => ({ ...prev, companyPhone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-neutral mb-1 block">Email</label>
                      <Input
                        type="email"
                        placeholder="info@company.com"
                        value={settings.companyEmail}
                        onChange={(e) => setSettings((prev) => ({ ...prev, companyEmail: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-neutral mb-1 block">Адрес</label>
                      <Input
                        type="text"
                        placeholder="г. Москва, ул. Примерная, д. 1"
                        value={settings.companyAddress}
                        onChange={(e) => setSettings((prev) => ({ ...prev, companyAddress: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Смена пароля */}
                  <div className="py-4 space-y-3">
                    <div className="text-xs font-semibold text-neutral uppercase tracking-wide">Смена пароля</div>
                    <div>
                      <label className="text-xs text-neutral mb-1 block">Новый пароль</label>
                      <Input
                        type="password"
                        placeholder="Минимум 4 символа"
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); setPasswordSuccess(false); }}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-neutral mb-1 block">Повторите пароль</label>
                      <Input
                        type="password"
                        placeholder="Повторите новый пароль"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); setPasswordSuccess(false); }}
                      />
                    </div>
                    {passwordError && (
                      <p className="text-xs text-red-500">{passwordError}</p>
                    )}
                    {passwordSuccess && (
                      <p className="text-xs text-green-600">Пароль успешно изменён</p>
                    )}
                    <button
                      onClick={changePassword}
                      className="w-full gradient-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all"
                    >
                      Сменить пароль
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
}
