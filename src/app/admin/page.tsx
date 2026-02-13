"use client";

import AdminAnalytics from "@/components/AdminAnalytics";
import Logo from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { io as ioClient, Socket } from "socket.io-client";
import { toast, Toaster } from "sonner";

interface ServiceItemData {
  id: number;
  service: string;
  poverk: string | null;
  object: string | null;
  fabricNumber: string | null;
  registry: string | null;
}

interface AdminRequest {
  id: number;
  name: string;
  phone: string;
  email: string;
  company: string | null;
  inn: string | null;
  service: string;
  object: string | null;
  fabricNumber: string | null;
  registry: string | null;
  poverk: string | null;
  message: string | null;
  fileName: string | null;
  filePath: string | null;
  status: string;
  createdAt: string;
  adminNotes: string | null;
  executorPrice: number | null;
  markup: number | null;
  clientPrice: number | null;
  needContract: boolean;
  items?: ServiceItemData[];
}

interface Stats {
  total: number;
  new: number;
  in_progress: number;
  done: number;
}

const statusLabels: Record<
  string,
  { label: string; variant: "new" | "in_progress" | "done" }
> = {
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
  const [initializing, setInitializing] = useState(true);
  const [requests, setRequests] = useState<AdminRequest[]>([]);
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
  const [editingPricing, setEditingPricing] = useState<{
    [key: number]: {
      adminNotes: string;
      executorPrice: string;
      markup: string;
    };
  }>({});

  useEffect(() => {
    const stored = sessionStorage.getItem("admin-password");
    if (stored) {
      setPassword(stored);
      setAuthenticated(true);
    }
    setInitializing(false);
  }, []);

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
          sessionStorage.removeItem("admin-password");
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

  useEffect(() => {
    if (authenticated) {
      fetchRequests();
      fetchStats();
    }
  }, [authenticated, fetchRequests, fetchStats]);

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

    socket.on("new-request", (request: AdminRequest) => {
      setRequests((prev) => {
        if (prev.some((r) => r.id === request.id)) return prev;
        return [request, ...prev];
      });
      setTotal((prev) => prev + 1);
      fetchStats();
    });

    socket.on("request-update", (updated: AdminRequest) => {
      setRequests((prev) =>
        prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
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
    sessionStorage.setItem("admin-password", password);
    setAuthenticated(true);
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setPassword("");
    sessionStorage.removeItem("admin-password");
  };

  const cycleStatus = async (
    e: React.MouseEvent,
    id: number,
    currentStatus: string,
  ) => {
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
          prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r)),
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

  const [exportMenuId, setExportMenuId] = useState<number | null>(null);

  const handleExportToExcel = async (id: number, filter?: string) => {
    setExportMenuId(null);
    const filterLabel = filter || "все";
    try {
      toast.loading("Формирование Excel файла...", { id: `export-${id}-${filterLabel}` });

      const url = filter
        ? `/api/admin/export/${id}?filter=${encodeURIComponent(filter)}`
        : `/api/admin/export/${id}`;
      const res = await fetch(url, {
        method: "GET",
        headers: { "x-admin-password": password },
      });

      if (!res.ok) {
        throw new Error("Export failed");
      }

      // Get filename from Content-Disposition header
      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = `Заявка_${id}.xlsx`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*=UTF-8''(.+)/);
        if (match) {
          filename = decodeURIComponent(match[1]);
        }
      }

      // Download file
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(blobUrl);

      toast.success("Excel файл скачан", { id: `export-${id}-${filterLabel}` });
    } catch {
      toast.error("Не удалось экспортировать", { id: `export-${id}-${filterLabel}` });
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

  const hasChanges = (id: number, request: AdminRequest) => {
    const editing = editingPricing[id];
    if (!editing) return false;

    const currentNotes = request.adminNotes || "";
    const currentPrice = request.executorPrice?.toString() || "";
    const currentMarkup = request.markup?.toString() || "";

    return (
      editing.adminNotes !== currentNotes ||
      editing.executorPrice !== currentPrice ||
      editing.markup !== currentMarkup
    );
  };

  const handleSavePricing = async (id: number) => {
    const editing = editingPricing[id];
    if (!editing) return;

    try {
      const executorPrice = editing.executorPrice
        ? parseFloat(editing.executorPrice)
        : null;
      const markup = editing.markup ? parseFloat(editing.markup) : null;
      const adminNotes = editing.adminNotes || null;

      const res = await fetch(`/api/admin/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({
          adminNotes,
          executorPrice,
          markup,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...updated } : r)),
        );
        // Clear editing state after successful save
        setEditingPricing((prev) => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
        toast.success("Данные успешно сохранены", {
          description: "Заметки и ценообразование обновлены",
          duration: 3000,
        });
      } else {
        toast.error("Ошибка сохранения", {
          description: "Не удалось сохранить данные",
          duration: 3000,
        });
      }
    } catch {
      toast.error("Ошибка сохранения", {
        description: "Произошла ошибка при сохранении",
        duration: 3000,
      });
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

  const exportCSV = async () => {
    const params = new URLSearchParams({
      status: filter,
      sortBy,
      sortOrder,
      export: "true",
    });
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin?${params}`, {
      headers: { "x-admin-password": password },
    });
    if (!res.ok) return;
    const data = await res.json();
    const allRequests: AdminRequest[] = data.requests;
    const headers = [
      "ID",
      "Дата",
      "Имя",
      "Телефон",
      "Email",
      "Услуга",
      "Сообщение",
      "Статус",
    ];
    const rows = allRequests.map((r) => [
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
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"),
      ),
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
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
    if (sortBy !== field)
      return <span className="text-gray-300 ml-1">&#8597;</span>;
    return (
      <span className="ml-1">{sortOrder === "asc" ? "\u2191" : "\u2193"}</span>
    );
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-warm-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-warm-bg flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm"
        >
          <div className="text-center mb-6">
            <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-dark">Админ-панель</h1>
            <p className="text-neutral text-sm mt-1">
              Введите пароль для входа
            </p>
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
    {
      key: "all",
      label: "Всего",
      value: stats?.total ?? 0,
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
      bg: "bg-gray-50",
      iconBg: "bg-gray-200 text-gray-600",
    },
    {
      key: "new",
      label: "Новые",
      value: stats?.new ?? 0,
      icon: "M12 6v6m0 0v6m0-6h6m-6 0H6",
      bg: "bg-blue-50",
      iconBg: "bg-blue-200 text-blue-600",
    },
    {
      key: "in_progress",
      label: "В работе",
      value: stats?.in_progress ?? 0,
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      bg: "bg-yellow-50",
      iconBg: "bg-yellow-200 text-yellow-600",
    },
    {
      key: "done",
      label: "Завершены",
      value: stats?.done ?? 0,
      icon: "M5 13l4 4L19 7",
      bg: "bg-green-50",
      iconBg: "bg-green-200 text-green-600",
    },
  ];

  return (
    <TooltipProvider>
      <Toaster position="top-center" className="rounded-sm" />
      <div className="min-h-screen bg-warm-bg">
        {/* Header */}
        <div className="gradient-dark text-white">
          <div className="max-w-8xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Link href="/" className="flex items-center gap-2 shrink-0">
                <Logo size="sm" />
              </Link>
              <span className="text-white/40 text-xs sm:text-sm truncate">/ Админ-панель</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
              <a
                href="/admin/services"
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Управление услугами"
              >
                <svg
                  className="w-5 h-5 text-white/70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </a>
              <a
                href="/admin/settings"
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Настройки"
              >
                <svg
                  className="w-5 h-5 text-white/70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              </a>
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`}
                />
                <span className="text-xs text-white/50 hidden sm:inline">
                  {connected ? "Онлайн" : "Оффлайн"}
                </span>
              </div>
              <span className="text-sm text-white/60 hidden sm:inline">Заявок: {total}</span>
              <button
                onClick={handleLogout}
                className="text-xs sm:text-sm text-white/60 hover:text-white transition-colors"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-8xl mx-auto px-4 sm:px-6 py-6">
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
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBg}`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={card.icon}
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-dark">
                      {card.value}
                    </div>
                    <div className="text-xs text-neutral">{card.label}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Analytics */}
          <AdminAnalytics password={password} />

          {/* Search + Actions */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 mb-6">
            <div className="relative flex-1 min-w-0 sm:min-w-[200px] sm:max-w-md">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral z-10"
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
              <Input
                type="text"
                placeholder="Поиск по имени, телефону, email..."
                value={searchInput}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchRequests}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-medium bg-white text-neutral hover:bg-gray-50 transition-all border border-gray-200"
              >
                Обновить
              </button>
              <button
                onClick={exportCSV}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-medium bg-white text-neutral hover:bg-gray-50 transition-all border border-gray-200 flex items-center justify-center gap-1.5"
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
                <span className="hidden sm:inline">Экспорт</span> CSV
              </button>
            </div>
          </div>

          {/* Mobile sort */}
          <div className="flex md:hidden items-center gap-2 mb-4">
            <span className="text-xs text-neutral shrink-0">Сортировка:</span>
            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(val) => {
                const [field, order] = val.split("-") as [SortField, "asc" | "desc"];
                setSortBy(field);
                setSortOrder(order);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">Сначала новые</SelectItem>
                <SelectItem value="createdAt-asc">Сначала старые</SelectItem>
                <SelectItem value="name-asc">Имя А-Я</SelectItem>
                <SelectItem value="name-desc">Имя Я-А</SelectItem>
                <SelectItem value="status-asc">Статус</SelectItem>
              </SelectContent>
            </Select>
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

          {/* Requests */}
          {loading ? (
            <div className="text-center py-20 text-neutral">Загрузка...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-20 text-neutral">
              Заявок пока нет
            </div>
          ) : (
            <>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    className="p-4 cursor-pointer active:bg-warm-bg/50"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-dark truncate">{r.company || r.name}</div>
                        <div className="text-xs text-neutral mt-0.5">{formatDate(r.createdAt)}</div>
                      </div>
                      <button
                        onClick={(e) => cycleStatus(e, r.id, r.status)}
                        className="shrink-0"
                      >
                        <Badge variant={statusLabels[r.status]?.variant || "default"}>
                          {statusLabels[r.status]?.label || r.status}
                        </Badge>
                      </button>
                    </div>
                    <div className="text-sm text-neutral truncate">{r.service}</div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-neutral">
                      <span>{r.phone}</span>
                      <span className="truncate">{r.email}</span>
                    </div>
                  </div>
                  {expandedId === r.id && (
                    <div className="border-t border-gray-100 p-4 bg-warm-bg/30">
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-neutral mb-1 font-medium uppercase tracking-wide">Сообщение</div>
                          <div className="text-sm text-dark bg-white rounded-xl p-3">
                            {r.message || <span className="text-neutral italic">Нет сообщения</span>}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-neutral mb-1 font-medium uppercase tracking-wide">Дата создания</div>
                          <div className="text-sm text-dark">{formatDateFull(r.createdAt)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-neutral mb-1 font-medium uppercase tracking-wide">Контакты</div>
                          <div className="text-sm text-dark space-y-0.5">
                            <div>{r.name}</div>
                            <div>{r.phone}</div>
                            <div>{r.email}</div>
                            {r.inn && <div>ИНН {r.inn}</div>}
                          </div>
                        </div>
                        {r.items && r.items.length > 0 ? (
                          <div>
                            <div className="text-xs text-neutral mb-2 font-medium uppercase tracking-wide">Позиции ({r.items.length})</div>
                            <div className="space-y-2">
                              {r.items.map((item, idx) => (
                                <div key={item.id} className="bg-white rounded-lg p-3 border border-gray-100">
                                  <div className="text-xs font-semibold text-primary mb-1">Позиция {idx + 1}: {item.service}</div>
                                  <div className="space-y-1 text-sm">
                                    {item.poverk && <div><span className="text-neutral">Поверка:</span> {item.poverk}</div>}
                                    {item.object && <div><span className="text-neutral">СИ:</span> {item.object}</div>}
                                    {item.fabricNumber && <div><span className="text-neutral">Зав. №:</span> {item.fabricNumber}</div>}
                                    {item.registry && <div><span className="text-neutral">Реестр:</span> {item.registry}</div>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <>
                            <div>
                              <div className="text-xs text-neutral mb-1 font-medium uppercase tracking-wide">Услуга</div>
                              <div className="text-sm text-dark">{r.service}</div>
                            </div>
                            {r.object && (
                              <div>
                                <div className="text-xs text-neutral mb-1 font-medium uppercase tracking-wide">Наименование СИ</div>
                                <div className="text-sm text-dark">{r.object}</div>
                              </div>
                            )}
                            {r.fabricNumber && (
                              <div>
                                <div className="text-xs text-neutral mb-1 font-medium uppercase tracking-wide">Заводской номер</div>
                                <div className="text-sm text-dark">{r.fabricNumber}</div>
                              </div>
                            )}
                            {r.registry && (
                              <div>
                                <div className="text-xs text-neutral mb-1 font-medium uppercase tracking-wide">Номер реестра</div>
                                <div className="text-sm text-dark">{r.registry}</div>
                              </div>
                            )}
                            {r.poverk && (
                              <div>
                                <div className="text-xs text-neutral mb-1 font-medium uppercase tracking-wide">Тип поверки</div>
                                <div className="text-sm text-dark">{r.poverk}</div>
                              </div>
                            )}
                          </>
                        )}
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
                        <div>
                          <div className="text-xs text-neutral mb-1 font-medium uppercase tracking-wide">Договор оказания услуг</div>
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${r.needContract ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                            {r.needContract ? "Требуется" : "Не требуется"}
                          </div>
                        </div>

                        {/* Admin Notes and Pricing */}
                        <div className="pt-3 border-t border-gray-200">
                          <div className="text-sm font-semibold text-dark mb-3 uppercase tracking-wide">Заметки и ценообразование</div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs text-neutral mb-2 font-medium uppercase tracking-wide">Заметки админа</label>
                              <Textarea
                                placeholder="Внутренние заметки..."
                                value={editingPricing[r.id]?.adminNotes !== undefined ? editingPricing[r.id].adminNotes : r.adminNotes || ""}
                                onChange={(e) => {
                                  setEditingPricing((prev) => ({
                                    ...prev,
                                    [r.id]: {
                                      adminNotes: e.target.value,
                                      executorPrice: prev[r.id]?.executorPrice ?? (r.executorPrice?.toString() || ""),
                                      markup: prev[r.id]?.markup ?? (r.markup?.toString() || ""),
                                    },
                                  }));
                                }}
                                className="min-h-[80px] resize-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-neutral mb-2 font-medium uppercase tracking-wide">Цена исполнителя (₽)</label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="10000"
                                value={editingPricing[r.id]?.executorPrice !== undefined ? editingPricing[r.id].executorPrice : r.executorPrice?.toString() || ""}
                                onChange={(e) => {
                                  setEditingPricing((prev) => ({
                                    ...prev,
                                    [r.id]: {
                                      adminNotes: prev[r.id]?.adminNotes ?? (r.adminNotes || ""),
                                      executorPrice: e.target.value,
                                      markup: prev[r.id]?.markup ?? (r.markup?.toString() || ""),
                                    },
                                  }));
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-neutral mb-2 font-medium uppercase tracking-wide">Процент наценки</label>
                              <Select
                                value={editingPricing[r.id]?.markup !== undefined ? editingPricing[r.id].markup : r.markup?.toString() || ""}
                                onValueChange={(value) => {
                                  setEditingPricing((prev) => ({
                                    ...prev,
                                    [r.id]: {
                                      adminNotes: prev[r.id]?.adminNotes ?? (r.adminNotes || ""),
                                      executorPrice: prev[r.id]?.executorPrice ?? (r.executorPrice?.toString() || ""),
                                      markup: value,
                                    },
                                  }));
                                }}
                              >
                                <SelectTrigger><SelectValue placeholder="Выберите наценку" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="5">5%</SelectItem>
                                  <SelectItem value="10">10%</SelectItem>
                                  <SelectItem value="15">15%</SelectItem>
                                  <SelectItem value="20">20%</SelectItem>
                                  <SelectItem value="25">25%</SelectItem>
                                  <SelectItem value="30">30%</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {(() => {
                              const execPrice = editingPricing[r.id]?.executorPrice !== undefined ? parseFloat(editingPricing[r.id].executorPrice) : r.executorPrice;
                              const markupVal = editingPricing[r.id]?.markup !== undefined ? parseFloat(editingPricing[r.id].markup) : r.markup;
                              if (execPrice && markupVal && !isNaN(execPrice) && !isNaN(markupVal)) {
                                const clientPrice = execPrice * (1 + markupVal / 100);
                                return (
                                  <div>
                                    <div className="text-xs text-neutral mb-2 font-medium uppercase tracking-wide">Финальная цена для клиента</div>
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg font-semibold">{clientPrice.toFixed(2)} ₽</div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                            <button
                              onClick={() => handleSavePricing(r.id)}
                              disabled={!hasChanges(r.id, r)}
                              className={`w-full px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${hasChanges(r.id, r) ? "bg-primary text-white hover:bg-primary/90" : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"}`}
                            >
                              Сохранить
                            </button>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-200">
                          <div className="relative">
                            <button
                              onClick={(e) => { e.stopPropagation(); setExportMenuId(exportMenuId === r.id ? null : r.id); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-green-600 hover:bg-green-50 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Excel
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {exportMenuId === r.id && (
                              <div onClick={(e) => e.stopPropagation()} className="absolute left-0 bottom-full mb-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20 min-w-[200px]">
                                <button onClick={() => handleExportToExcel(r.id)} className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 transition-colors text-dark">Все позиции</button>
                                <div className="border-t border-gray-100 my-1" />
                                <button onClick={() => handleExportToExcel(r.id, "поверка")} className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 transition-colors text-dark">Только поверки</button>
                                <button onClick={() => handleExportToExcel(r.id, "аттестация")} className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 transition-colors text-dark">Только аттестации</button>
                                <button onClick={() => handleExportToExcel(r.id, "калибровка")} className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 transition-colors text-dark">Только калибровки</button>
                              </div>
                            )}
                          </div>
                          {deleteConfirmId === r.id ? (
                            <>
                              <span className="text-sm text-red-600">Удалить?</span>
                              <button onClick={() => handleDelete(r.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors">Да</button>
                              <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors">Нет</button>
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
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Mobile Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-center gap-2 py-4">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${page === p ? "gradient-primary text-white" : "bg-white text-neutral hover:bg-gray-100"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-2xl shadow-lg overflow-hidden">
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
                    <TableHead className="font-semibold text-dark">
                      Телефон
                    </TableHead>
                    <TableHead className="font-semibold text-dark">
                      Email
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => (
                    <Fragment key={r.id}>
                      <TableRow
                        onClick={() =>
                          setExpandedId(expandedId === r.id ? null : r.id)
                        }
                        className="border-t border-gray-100 hover:bg-warm-bg/50 cursor-pointer"
                      >
                        <TableCell className="text-neutral">{r.id}</TableCell>
                        <TableCell className="text-neutral whitespace-nowrap">
                          {formatDate(r.createdAt)}
                        </TableCell>
                        <TableCell className="font-medium text-dark">
                          {r.company || r.name}
                        </TableCell>
                        <TableCell className="text-neutral">
                          {r.service}
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={(e) => cycleStatus(e, r.id, r.status)}
                                className="transition-all hover:scale-105"
                              >
                                <Badge
                                  variant={
                                    statusLabels[r.status]?.variant || "default"
                                  }
                                >
                                  {statusLabels[r.status]?.label || r.status}
                                </Badge>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Нажмите для смены статуса</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-neutral">
                          {r.phone}
                        </TableCell>
                        <TableCell className="text-neutral">
                          {r.email}
                        </TableCell>
                      </TableRow>
                      {expandedId === r.id && (
                        <TableRow
                          key={`${r.id}-detail`}
                          className="border-t border-gray-100"
                        >
                          <TableCell colSpan={7} className="bg-warm-bg/30">
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div>
                                <div className="text-xs text-neutral mb-1 font-medium uppercase tracking-wide">
                                  Сообщение
                                </div>
                                <div className="text-sm text-dark bg-white rounded-xl p-3">
                                  {r.message || (
                                    <span className="text-neutral italic">
                                      Нет сообщения
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <div className="text-xs text-neutral mb-1 font-medium uppercase tracking-wide">
                                    Дата создания
                                  </div>
                                  <div className="text-sm text-dark">
                                    {formatDateFull(r.createdAt)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-neutral mb-1 font-medium uppercase tracking-wide">
                                    Контакты
                                  </div>
                                  <div className="text-sm text-dark">
                                    {r.name} &middot; {r.phone} &middot;{" "}
                                    {r.email}
                                    {r.inn && <> &middot; ИНН {r.inn}</>}
                                  </div>
                                </div>
                                {r.items && r.items.length > 0 ? (
                                  <div>
                                    <div className="text-xs text-neutral mb-2 font-medium uppercase tracking-wide">
                                      Позиции ({r.items.length})
                                    </div>
                                    <div className="space-y-2">
                                      {r.items.map((item, idx) => (
                                        <div
                                          key={item.id}
                                          className="bg-white rounded-lg p-3 border border-gray-100"
                                        >
                                          <div className="text-xs font-semibold text-primary mb-1">
                                            Позиция {idx + 1}: {item.service}
                                          </div>
                                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                            {item.poverk && (
                                              <div>
                                                <span className="text-neutral">
                                                  Поверка:
                                                </span>{" "}
                                                {item.poverk}
                                              </div>
                                            )}
                                            {item.object && (
                                              <div>
                                                <span className="text-neutral">
                                                  СИ:
                                                </span>{" "}
                                                {item.object}
                                              </div>
                                            )}
                                            {item.fabricNumber && (
                                              <div>
                                                <span className="text-neutral">
                                                  Зав. №:
                                                </span>{" "}
                                                {item.fabricNumber}
                                              </div>
                                            )}
                                            {item.registry && (
                                              <div>
                                                <span className="text-neutral">
                                                  Реестр:
                                                </span>{" "}
                                                {item.registry}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div>
                                      <div className="text-xs text-neutral mb-1 font-medium uppercase tracking-wide">
                                        Услуга
                                      </div>
                                      <div className="text-sm text-dark">
                                        {r.service}
                                      </div>
                                    </div>
                                    {r.object && (
                                      <div>
                                        <div className="text-xs text-neutral mb-1 font-medium uppercase tracking-wide">
                                          Наименование СИ
                                        </div>
                                        <div className="text-sm text-dark">
                                          {r.object}
                                        </div>
                                      </div>
                                    )}
                                    {r.fabricNumber && (
                                      <div>
                                        <div className="text-xs text-neutral mb-1 font-medium uppercase tracking-wide">
                                          Заводской номер
                                        </div>
                                        <div className="text-sm text-dark">
                                          {r.fabricNumber}
                                        </div>
                                      </div>
                                    )}
                                    {r.registry && (
                                      <div>
                                        <div className="text-xs text-neutral mb-1 font-medium uppercase tracking-wide">
                                          Номер реестра
                                        </div>
                                        <div className="text-sm text-dark">
                                          {r.registry}
                                        </div>
                                      </div>
                                    )}
                                    {r.poverk && (
                                      <div>
                                        <div className="text-xs text-neutral mb-1 font-medium uppercase tracking-wide">
                                          Тип поверки
                                        </div>
                                        <div className="text-sm text-dark">
                                          {r.poverk}
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                                {r.fileName && r.filePath && (
                                  <div>
                                    <div className="text-xs text-neutral mb-1 font-medium uppercase tracking-wide">
                                      Прикрепленный файл
                                    </div>
                                    <button
                                      onClick={() => openFile(r.filePath!)}
                                      className="inline-flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors"
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
                                      {r.fileName}
                                    </button>
                                  </div>
                                )}
                                <div>
                                  <div className="text-xs text-neutral mb-1 font-medium uppercase tracking-wide">
                                    Договор оказания услуг
                                  </div>
                                  <div
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${r.needContract ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                                  >
                                    {r.needContract ? (
                                      <>
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
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                          />
                                        </svg>
                                        Требуется
                                      </>
                                    ) : (
                                      <>
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
                                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                          />
                                        </svg>
                                        Не требуется
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Admin Notes and Pricing Section */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                              <div className="text-sm font-semibold text-dark mb-4 uppercase tracking-wide">
                                Заметки и ценообразование
                              </div>
                              <div className="grid lg:grid-cols-2 gap-6">
                                {/* Left column: Admin Notes */}
                                <div>
                                  <label className="block text-xs text-neutral mb-2 font-medium uppercase tracking-wide">
                                    Заметки админа
                                  </label>
                                  <Textarea
                                    placeholder="Внутренние заметки (видны только в админке)..."
                                    value={
                                      editingPricing[r.id]?.adminNotes !==
                                      undefined
                                        ? editingPricing[r.id].adminNotes
                                        : r.adminNotes || ""
                                    }
                                    onChange={(e) => {
                                      setEditingPricing((prev) => ({
                                        ...prev,
                                        [r.id]: {
                                          adminNotes: e.target.value,
                                          executorPrice:
                                            prev[r.id]?.executorPrice ??
                                            (r.executorPrice?.toString() || ""),
                                          markup:
                                            prev[r.id]?.markup ??
                                            (r.markup?.toString() || ""),
                                        },
                                      }));
                                    }}
                                    className="min-h-[100px] resize-none"
                                  />
                                </div>

                                {/* Right column: Pricing */}
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-xs text-neutral mb-2 font-medium uppercase tracking-wide">
                                      Цена исполнителя (₽)
                                    </label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder="10000"
                                      value={
                                        editingPricing[r.id]?.executorPrice !==
                                        undefined
                                          ? editingPricing[r.id].executorPrice
                                          : r.executorPrice?.toString() || ""
                                      }
                                      onChange={(e) => {
                                        setEditingPricing((prev) => ({
                                          ...prev,
                                          [r.id]: {
                                            adminNotes:
                                              prev[r.id]?.adminNotes ??
                                              (r.adminNotes || ""),
                                            executorPrice: e.target.value,
                                            markup:
                                              prev[r.id]?.markup ??
                                              (r.markup?.toString() || ""),
                                          },
                                        }));
                                      }}
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs text-neutral mb-2 font-medium uppercase tracking-wide">
                                      Процент наценки
                                    </label>
                                    <Select
                                      value={
                                        editingPricing[r.id]?.markup !==
                                        undefined
                                          ? editingPricing[r.id].markup
                                          : r.markup?.toString() || ""
                                      }
                                      onValueChange={(value) => {
                                        setEditingPricing((prev) => ({
                                          ...prev,
                                          [r.id]: {
                                            adminNotes:
                                              prev[r.id]?.adminNotes ??
                                              (r.adminNotes || ""),
                                            executorPrice:
                                              prev[r.id]?.executorPrice ??
                                              (r.executorPrice?.toString() ||
                                                ""),
                                            markup: value,
                                          },
                                        }));
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Выберите наценку" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="5">5%</SelectItem>
                                        <SelectItem value="10">10%</SelectItem>
                                        <SelectItem value="15">15%</SelectItem>
                                        <SelectItem value="20">20%</SelectItem>
                                        <SelectItem value="25">25%</SelectItem>
                                        <SelectItem value="30">30%</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {/* Display calculated client price */}
                                  {(() => {
                                    const execPrice =
                                      editingPricing[r.id]?.executorPrice !==
                                      undefined
                                        ? parseFloat(
                                            editingPricing[r.id].executorPrice,
                                          )
                                        : r.executorPrice;
                                    const markupVal =
                                      editingPricing[r.id]?.markup !== undefined
                                        ? parseFloat(
                                            editingPricing[r.id].markup,
                                          )
                                        : r.markup;

                                    if (
                                      execPrice &&
                                      markupVal &&
                                      !isNaN(execPrice) &&
                                      !isNaN(markupVal)
                                    ) {
                                      const clientPrice =
                                        execPrice * (1 + markupVal / 100);
                                      return (
                                        <div className="pt-2">
                                          <div className="text-xs text-neutral mb-2 font-medium uppercase tracking-wide">
                                            Финальная цена для клиента
                                          </div>
                                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg font-semibold">
                                            {clientPrice.toFixed(2)} ₽
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}

                                  <button
                                    onClick={() => handleSavePricing(r.id)}
                                    disabled={!hasChanges(r.id, r)}
                                    className={`w-full mt-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                      hasChanges(r.id, r)
                                        ? "bg-primary text-white hover:bg-primary/90 cursor-pointer"
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                                    }`}
                                  >
                                    Сохранить
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center gap-2">
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExportMenuId(exportMenuId === r.id ? null : r.id);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-green-600 hover:bg-green-50 transition-colors"
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
                                  Экспорт в Excel
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                                {exportMenuId === r.id && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute left-0 top-full mt-1 bg-white dark:bg-dark-light rounded-lg shadow-xl border border-gray-200 dark:border-white/10 py-1 z-20 min-w-[200px]"
                                  >
                                    <button
                                      onClick={() => handleExportToExcel(r.id)}
                                      className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-dark dark:text-white"
                                    >
                                      Все позиции
                                    </button>
                                    <div className="border-t border-gray-100 dark:border-white/10 my-1" />
                                    <button
                                      onClick={() => handleExportToExcel(r.id, "поверка")}
                                      className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-dark dark:text-white"
                                    >
                                      Только поверки
                                    </button>
                                    <button
                                      onClick={() => handleExportToExcel(r.id, "аттестация")}
                                      className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-dark dark:text-white"
                                    >
                                      Только аттестации
                                    </button>
                                    <button
                                      onClick={() => handleExportToExcel(r.id, "калибровка")}
                                      className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-dark dark:text-white"
                                    >
                                      Только калибровки
                                    </button>
                                  </div>
                                )}
                              </div>

                              {deleteConfirmId === r.id ? (
                                <>
                                  <span className="text-sm text-red-600">
                                    Удалить заявку?
                                  </span>
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
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
