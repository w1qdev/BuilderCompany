"use client";

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
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { motion } from "framer-motion";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { io as ioClient, Socket } from "socket.io-client";
import { toast } from "sonner";

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
  files?: { id: number; fileName: string; filePath: string }[];
  status: string;
  createdAt: string;
  adminNotes: string | null;
  executorPrice: number | null;
  markup: number | null;
  clientPrice: number | null;
  needContract: boolean;
  assignee: string | null;
  items?: ServiceItemData[];
}

interface Stats {
  total: number;
  new: number;
  in_progress: number;
  pending_payment: number;
  review: number;
  done: number;
  cancelled: number;
}

const statusLabels: Record<
  string,
  { label: string; variant: "new" | "in_progress" | "pending_payment" | "review" | "done" | "cancelled" }
> = {
  new: { label: "Новая", variant: "new" },
  in_progress: { label: "В работе", variant: "in_progress" },
  pending_payment: { label: "Ожидает оплаты", variant: "pending_payment" },
  review: { label: "На проверке", variant: "review" },
  done: { label: "Завершена", variant: "done" },
  cancelled: { label: "Отменена", variant: "cancelled" },
};

const statusCycle = ["new", "in_progress", "pending_payment", "review", "done", "cancelled"];

const RESPONSE_TEMPLATES = [
  { label: "Принято в работу", text: "Ваша заявка принята в работу. Мы свяжемся с вами в ближайшее время для уточнения деталей." },
  { label: "Запрос документов", text: "Для обработки заявки нам необходимы дополнительные документы. Пожалуйста, предоставьте копии свидетельств о поверке." },
  { label: "Готово к выдаче", text: "Работы по вашей заявке завершены. Документы готовы к выдаче. Свяжитесь с нами для получения." },
  { label: "Ожидание оплаты", text: "Счёт на оплату направлен на вашу электронную почту. После оплаты мы приступим к выполнению работ." },
  { label: "Уточнение данных", text: "Просим уточнить данные по заявке: наименование СИ, заводской номер и номер в реестре ФИФ." },
];

type SortField = "createdAt" | "name" | "service" | "status";

const sortableColumns: { field: SortField; label: string }[] = [
  { field: "createdAt", label: "Дата" },
  { field: "name", label: "Имя" },
  { field: "service", label: "Услуга" },
  { field: "status", label: "Статус" },
];

export default function AdminPage() {
  const { password } = useAdminAuth();

  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [exportPeriod, setExportPeriod] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [draggedRequest, setDraggedRequest] = useState<AdminRequest | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [editingPricing, setEditingPricing] = useState<{
    [key: number]: {
      adminNotes: string;
      executorPrice: string;
      markup: string;
    };
  }>({});
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [clientHistory, setClientHistory] = useState<{ email: string; requests: AdminRequest[] } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    fetchRequests();
    fetchStats();
  }, [fetchRequests, fetchStats]);

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

      // Sound notification
      if (soundEnabled) {
        try {
          if (!audioRef.current) {
            audioRef.current = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGdCPFmGtN3LfVBCS3ORwNbEd0lCSHKNudTKe0tESW2JtNDMgE5FS2mEr87OhVBGS2d/q8vRilJHS2V7p8jTj1VIS2N3o8XVlFhJS2FznMLYmVtLTF9vm7/boF5NTF1rlrvdpWFOTVtolbfgqmRQTlllkLPjr2dST1dhiqvmtWtUUFZdg6fovnBXUVVafKHrw3RZU1RWdJrnyHlcVVRTbZPjzX9gV1VRZozf0oVjWVZPX4Xb1oxnXFdNV37W2pNrYFlNUHfR3ZpyZFpMSHDM4KB3aFxKQWnF5KZ9bF5IP2K+6K2Db2BHOlu37LOKc2JGNFS07rmRd2VFMk2u8cCYfGlELkao7sigiG1CKD+h6dCok3NEIzib5NmynntDHTOT39+5poZCFyyM2uXEsZFBFCSF0uy/t5s/");
          }
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        } catch {}
      }

      // Browser notification
      if (Notification.permission === "granted") {
        new Notification("Новая заявка", {
          body: `${request.name} — ${request.service}`,
          icon: "/favicon.ico",
        });
      }

      toast.success("Новая заявка!", {
        description: `${request.name} — ${request.service}`,
        duration: 5000,
      });
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
  }, [fetchStats]);

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

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === requests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(requests.map((r) => r.id)));
    }
  };

  const handleBulkStatus = async (status: string) => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/admin/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "x-admin-password": password },
            body: JSON.stringify({ status }),
          }),
        ),
      );
      toast.success(`Статус обновлён для ${selectedIds.size} заявок`);
      setSelectedIds(new Set());
      fetchRequests();
      fetchStats();
    } catch {
      toast.error("Ошибка при обновлении статусов");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Удалить ${selectedIds.size} заявок? Это действие нельзя отменить.`)) return;
    setBulkLoading(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/admin/${id}`, {
            method: "DELETE",
            headers: { "x-admin-password": password },
          }),
        ),
      );
      toast.success(`Удалено ${selectedIds.size} заявок`);
      setSelectedIds(new Set());
      fetchRequests();
      fetchStats();
    } catch {
      toast.error("Ошибка при удалении");
    } finally {
      setBulkLoading(false);
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

      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = `Заявка_${id}.xlsx`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*=UTF-8''(.+)/);
        if (match) {
          filename = decodeURIComponent(match[1]);
        }
      }

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

  const handleAssigneeChange = async (id: number, assignee: string) => {
    try {
      const res = await fetch(`/api/admin/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ assignee: assignee || null }),
      });
      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, assignee: assignee || null } : r)),
        );
        toast.success("Исполнитель назначен");
      }
    } catch {
      toast.error("Ошибка назначения исполнителя");
    }
  };

  const fetchClientHistory = async (email: string) => {
    try {
      const params = new URLSearchParams({ search: email, export: "true" });
      const res = await fetch(`/api/admin?${params}`, {
        headers: { "x-admin-password": password },
      });
      if (res.ok) {
        const data = await res.json();
        setClientHistory({ email, requests: data.requests });
      }
    } catch {
      toast.error("Ошибка загрузки истории клиента");
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

    if (exportPeriod) {
      const now = new Date();
      let dateFrom: Date | null = null;
      if (exportPeriod === "week") dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      else if (exportPeriod === "month") dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      else if (exportPeriod === "quarter") dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      if (dateFrom) params.set("dateFrom", dateFrom.toISOString());
    }
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
      return <span className="text-gray-300 dark:text-white/30 ml-1">&#8597;</span>;
    return (
      <span className="ml-1">{sortOrder === "asc" ? "\u2191" : "\u2193"}</span>
    );
  };

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3 inline-block">
          {error}
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      key: "all",
      label: "Всего",
      value: stats?.total ?? 0,
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
      bg: "bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-white/5 dark:to-white/10",
      iconBg: "bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-white/60",
    },
    {
      key: "new",
      label: "Новые",
      value: stats?.new ?? 0,
      icon: "M12 6v6m0 0v6m0-6h6m-6 0H6",
      bg: "bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-500/10 dark:to-blue-600/10",
      iconBg: "bg-blue-200 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    },
    {
      key: "in_progress",
      label: "В работе",
      value: stats?.in_progress ?? 0,
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      bg: "bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-500/10 dark:to-amber-600/10",
      iconBg: "bg-yellow-200 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400",
    },
    {
      key: "pending_payment",
      label: "Ожидает оплаты",
      value: stats?.pending_payment ?? 0,
      icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
      bg: "bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-500/10 dark:to-orange-600/10",
      iconBg: "bg-orange-200 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
    },
    {
      key: "done",
      label: "Завершены",
      value: stats?.done ?? 0,
      icon: "M5 13l4 4L19 7",
      bg: "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-600/10",
      iconBg: "bg-green-200 text-green-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    },
    {
      key: "cancelled",
      label: "Отменены",
      value: stats?.cancelled ?? 0,
      icon: "M6 18L18 6M6 6l12 12",
      bg: "bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-500/10 dark:to-red-600/10",
      iconBg: "bg-red-200 text-red-600 dark:bg-red-500/20 dark:text-red-400",
    },
  ];

  return (
    <TooltipProvider>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsCards.map((card, index) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <button
              onClick={() => {
                setFilter(card.key);
                setPage(1);
              }}
              className={`${card.bg} w-full rounded-2xl shadow-sm p-4 text-left transition-shadow hover:shadow-md ${
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
                  <div className="text-2xl font-bold text-dark dark:text-white">
                    {card.value}
                  </div>
                  <div className="text-xs text-neutral dark:text-white/50">{card.label}</div>
                </div>
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="space-y-3 mb-6">
        {/* Row 1: Search + Status indicators */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 min-w-0">
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
              className="pl-10 bg-white dark:bg-dark dark:border-white/10 dark:text-white dark:placeholder-white/30"
            />
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-dark-light border border-gray-200 dark:border-white/10 shrink-0">
            <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`} />
            <span className="text-xs text-neutral dark:text-white/50">{connected ? "Онлайн" : "Оффлайн"}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-2 rounded-xl border transition-colors ${soundEnabled ? "bg-white dark:bg-dark-light border-gray-200 dark:border-white/10 text-neutral dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/5" : "bg-gray-100 dark:bg-white/10 border-gray-300 dark:border-white/15 text-gray-400 dark:text-white/40"}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {soundEnabled ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    )}
                  </svg>
                </button>
              </TooltipTrigger>
              <TooltipContent>{soundEnabled ? "Звук включён" : "Звук выключен"}</TooltipContent>
            </Tooltip>
            {typeof Notification !== "undefined" && Notification.permission !== "granted" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => Notification.requestPermission()}
                    className="p-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-light text-neutral dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </button>
                </TooltipTrigger>
                <TooltipContent>Включить уведомления</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Row 2: Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View mode toggle */}
          <div className="flex items-center rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-2 transition-colors ${viewMode === "table" ? "bg-primary text-white" : "bg-white dark:bg-dark-light text-neutral dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/5"}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                </button>
              </TooltipTrigger>
              <TooltipContent>Таблица</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`px-3 py-2 transition-colors ${viewMode === "kanban" ? "bg-primary text-white" : "bg-white dark:bg-dark-light text-neutral dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/5"}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
                </button>
              </TooltipTrigger>
              <TooltipContent>Канбан</TooltipContent>
            </Tooltip>
          </div>

          <button
            onClick={fetchRequests}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-dark-light text-neutral dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-gray-200 dark:border-white/10 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Обновить
          </button>

          <div className="w-px h-6 bg-gray-200 dark:bg-white/10 hidden sm:block" />

          {/* Export group */}
          <div className="flex items-center gap-2">
            <select
              value={exportPeriod}
              onChange={(e) => setExportPeriod(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm font-medium bg-white dark:bg-dark dark:text-white text-neutral border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Все время</option>
              <option value="week">За неделю</option>
              <option value="month">За месяц</option>
              <option value="quarter">За квартал</option>
            </select>
            <button
              onClick={exportCSV}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-dark-light text-neutral dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-gray-200 dark:border-white/10 flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV
            </button>
            <button
              onClick={async () => {
                toast.loading("Формирование Excel...", { id: "bulk-excel" });
                try {
                  const params = new URLSearchParams();
                  if (filter !== "all") params.set("status", filter);
                  if (search) params.set("search", search);
                  if (exportPeriod) {
                    const now = new Date();
                    let dateFrom: Date | null = null;
                    if (exportPeriod === "week") dateFrom = new Date(now.getTime() - 7 * 86400000);
                    else if (exportPeriod === "month") dateFrom = new Date(now.getTime() - 30 * 86400000);
                    else if (exportPeriod === "quarter") dateFrom = new Date(now.getTime() - 90 * 86400000);
                    if (dateFrom) params.set("dateFrom", dateFrom.toISOString());
                  }
                  const res = await fetch(`/api/admin/export/bulk?${params}`, {
                    headers: { "x-admin-password": password },
                  });
                  if (!res.ok) throw new Error();
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  const cd = res.headers.get("Content-Disposition");
                  const match = cd?.match(/filename\*=UTF-8''(.+)/);
                  a.download = match ? decodeURIComponent(match[1]) : "export.xlsx";
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Excel скачан", { id: "bulk-excel" });
                } catch {
                  toast.error("Ошибка экспорта", { id: "bulk-excel" });
                }
              }}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-green-50 dark:bg-emerald-500/10 text-green-700 dark:text-emerald-400 hover:bg-green-100 dark:hover:bg-emerald-500/20 transition-colors border border-green-200 dark:border-emerald-500/20 flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sort */}
      <div className="flex md:hidden items-center gap-2 mb-4">
        <span className="text-xs text-neutral dark:text-white/50 shrink-0">Сортировка:</span>
        <Select
          value={`${sortBy}-${sortOrder}`}
          onValueChange={(val) => {
            const [field, order] = val.split("-") as [SortField, "asc" | "desc"];
            setSortBy(field);
            setSortOrder(order);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 text-xs bg-white dark:bg-dark dark:border-white/10 dark:text-white">
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
          { value: "pending_payment", label: "Ожидает оплаты" },
          { value: "review", label: "На проверке" },
          { value: "done", label: "Завершены" },
          { value: "cancelled", label: "Отменены" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setFilter(f.value);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-primary text-white shadow-md"
                : "bg-white dark:bg-dark-light text-neutral dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/5"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Requests */}
      {loading ? (
        <div className="text-center py-20 text-neutral dark:text-white/50">Загрузка...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 text-neutral dark:text-white/50">
          Заявок пока нет
        </div>
      ) : viewMode === "kanban" ? (
        /* Kanban Board */
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 overflow-x-auto">
          {statusCycle.map((status) => {
            const columnRequests = requests.filter((r) => r.status === status);
            const label = statusLabels[status];
            return (
              <div
                key={status}
                className="bg-gray-50 dark:bg-white/5 rounded-2xl p-3 min-w-[220px] min-h-[300px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  if (!draggedRequest || draggedRequest.status === status) return;
                  const reqId = draggedRequest.id;
                  setRequests((prev) => prev.map((r) => r.id === reqId ? { ...r, status } : r));
                  try {
                    const res = await fetch(`/api/admin/${reqId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json", "x-admin-password": password },
                      body: JSON.stringify({ status }),
                    });
                    if (res.ok) {
                      fetchStats();
                      toast.success(`Статус изменён: ${label?.label}`);
                    } else {
                      setRequests((prev) => prev.map((r) => r.id === reqId ? { ...r, status: draggedRequest.status } : r));
                    }
                  } catch {
                    setRequests((prev) => prev.map((r) => r.id === reqId ? { ...r, status: draggedRequest.status } : r));
                  }
                  setDraggedRequest(null);
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={label?.variant || "default"}>
                    {label?.label || status}
                  </Badge>
                  <span className="text-xs text-neutral dark:text-white/50 font-medium">{columnRequests.length}</span>
                </div>
                <div className="space-y-2">
                  {columnRequests.map((r) => (
                    <div
                      key={r.id}
                      draggable
                      onDragStart={() => setDraggedRequest(r)}
                      onDragEnd={() => setDraggedRequest(null)}
                      onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                      className={`bg-white dark:bg-dark-light rounded-xl p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border border-gray-100 dark:border-white/10 ${draggedRequest?.id === r.id ? "opacity-50" : ""}`}
                    >
                      <div className="font-medium text-dark dark:text-white text-sm truncate">{r.company || r.name}</div>
                      <div className="text-xs text-neutral dark:text-white/50 mt-1 truncate">{r.service}</div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-neutral dark:text-white/50">{formatDate(r.createdAt)}</span>
                        {r.assignee && (
                          <span className="text-xs bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/70 px-1.5 py-0.5 rounded">{r.assignee}</span>
                        )}
                      </div>
                      {r.clientPrice && (
                        <div className="text-xs font-medium text-primary mt-1">{r.clientPrice.toFixed(2)} ₽</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="bg-white dark:bg-dark-light rounded-2xl shadow-sm overflow-hidden">
              <div
                onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                className="p-4 cursor-pointer active:bg-warm-bg/50 dark:active:bg-white/5"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-dark dark:text-white truncate">{r.company || r.name}</div>
                    <div className="text-xs text-neutral dark:text-white/50 mt-0.5">{formatDate(r.createdAt)}</div>
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
                <div className="text-sm text-neutral dark:text-white/70 truncate">{r.service}</div>
                <div className="flex items-center gap-3 mt-2 text-xs text-neutral dark:text-white/50">
                  <span>{r.phone}</span>
                  <span className="truncate">{r.email}</span>
                </div>
              </div>
              {expandedId === r.id && (
                <div className="border-t border-gray-100 dark:border-white/10 p-4 bg-warm-bg/30 dark:bg-white/5">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-neutral dark:text-white/50 mb-1 font-medium uppercase tracking-wide">Сообщение</div>
                      <div className="text-sm text-dark dark:text-white bg-white dark:bg-dark rounded-xl p-3">
                        {r.message || <span className="text-neutral dark:text-white/50 italic">Нет сообщения</span>}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral dark:text-white/50 mb-1 font-medium uppercase tracking-wide">Дата создания</div>
                      <div className="text-sm text-dark dark:text-white">{formatDateFull(r.createdAt)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral dark:text-white/50 mb-1 font-medium uppercase tracking-wide">Контакты</div>
                      <div className="text-sm text-dark dark:text-white space-y-0.5">
                        <div>{r.name}</div>
                        <div>{r.phone}</div>
                        <div>{r.email}</div>
                        {r.inn && <div>ИНН {r.inn}</div>}
                      </div>
                    </div>
                    {r.items && r.items.length > 0 ? (
                      <div>
                        <div className="text-xs text-neutral dark:text-white/50 mb-2 font-medium uppercase tracking-wide">Позиции ({r.items.length})</div>
                        <div className="space-y-2">
                          {r.items.map((item, idx) => (
                            <div key={item.id} className="bg-white dark:bg-dark rounded-lg p-3 border border-gray-100 dark:border-white/10">
                              <div className="text-xs font-semibold text-primary mb-1">Позиция {idx + 1}: {item.service}</div>
                              <div className="space-y-1 text-sm">
                                {item.poverk && <div><span className="text-neutral dark:text-white/50">Поверка:</span> {item.poverk}</div>}
                                {item.object && <div><span className="text-neutral dark:text-white/50">СИ:</span> {item.object}</div>}
                                {item.fabricNumber && <div><span className="text-neutral dark:text-white/50">Зав. №:</span> {item.fabricNumber}</div>}
                                {item.registry && <div><span className="text-neutral dark:text-white/50">Реестр:</span> {item.registry}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <div className="text-xs text-neutral dark:text-white/50 mb-1 font-medium uppercase tracking-wide">Услуга</div>
                          <div className="text-sm text-dark dark:text-white">{r.service}</div>
                        </div>
                        {r.object && (
                          <div>
                            <div className="text-xs text-neutral dark:text-white/50 mb-1 font-medium uppercase tracking-wide">Наименование СИ</div>
                            <div className="text-sm text-dark dark:text-white">{r.object}</div>
                          </div>
                        )}
                        {r.fabricNumber && (
                          <div>
                            <div className="text-xs text-neutral dark:text-white/50 mb-1 font-medium uppercase tracking-wide">Заводской номер</div>
                            <div className="text-sm text-dark dark:text-white">{r.fabricNumber}</div>
                          </div>
                        )}
                        {r.registry && (
                          <div>
                            <div className="text-xs text-neutral dark:text-white/50 mb-1 font-medium uppercase tracking-wide">Номер реестра</div>
                            <div className="text-sm text-dark dark:text-white">{r.registry}</div>
                          </div>
                        )}
                        {r.poverk && (
                          <div>
                            <div className="text-xs text-neutral dark:text-white/50 mb-1 font-medium uppercase tracking-wide">Тип поверки</div>
                            <div className="text-sm text-dark dark:text-white">{r.poverk}</div>
                          </div>
                        )}
                      </>
                    )}
                    {((r.files && r.files.length > 0) || (r.fileName && r.filePath)) && (
                      <div>
                        <div className="text-xs text-neutral dark:text-white/50 mb-1 font-medium uppercase tracking-wide">
                          Прикрепленные файлы ({(r.files && r.files.length > 0) ? r.files.length : 1})
                        </div>
                        <div className="space-y-1.5">
                          {r.files && r.files.length > 0 ? (
                            r.files.map((file) => (
                              <button
                                key={file.id}
                                onClick={() => openFile(file.filePath)}
                                className="flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors"
                              >
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="truncate">{file.fileName}</span>
                              </button>
                            ))
                          ) : (
                            <button
                              onClick={() => openFile(r.filePath!)}
                              className="flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors"
                            >
                              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="truncate">{r.fileName}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-neutral dark:text-white/50 mb-1 font-medium uppercase tracking-wide">Договор оказания услуг</div>
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${r.needContract ? "bg-green-100 dark:bg-emerald-500/10 text-green-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/70"}`}>
                        {r.needContract ? "Требуется" : "Не требуется"}
                      </div>
                    </div>

                    {/* Admin Notes and Pricing */}
                    <div className="pt-3 border-t border-gray-200 dark:border-white/10">
                      <div className="text-sm font-semibold text-dark dark:text-white mb-3 uppercase tracking-wide">Заметки и ценообразование</div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-neutral dark:text-white/50 mb-2 font-medium uppercase tracking-wide">Заметки админа</label>
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
                          <label className="block text-xs text-neutral dark:text-white/50 mb-2 font-medium uppercase tracking-wide">Цена исполнителя (₽)</label>
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
                          <label className="block text-xs text-neutral dark:text-white/50 mb-2 font-medium uppercase tracking-wide">Процент наценки</label>
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
                                <div className="text-xs text-neutral dark:text-white/50 mb-2 font-medium uppercase tracking-wide">Финальная цена для клиента</div>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg font-semibold">{clientPrice.toFixed(2)} ₽</div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                        <button
                          onClick={() => handleSavePricing(r.id)}
                          disabled={!hasChanges(r.id, r)}
                          className={`w-full px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${hasChanges(r.id, r) ? "bg-primary text-white hover:bg-primary/90" : "bg-gray-300 dark:bg-white/10 text-gray-500 dark:text-white/40 cursor-not-allowed opacity-60"}`}
                        >
                          Сохранить
                        </button>
                      </div>
                    </div>

                    {/* Quick actions mobile */}
                    <div className="pt-3 border-t border-gray-200 dark:border-white/10">
                      <div className="text-xs text-neutral dark:text-white/50 mb-2 font-medium uppercase tracking-wide">Быстрые действия</div>
                      <div className="flex flex-wrap gap-2">
                        <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          Позвонить
                        </a>
                        <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          Написать
                        </a>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${r.name}, ${r.phone}, ${r.email}`);
                            toast.success("Скопировано");
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-700"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          Копировать
                        </button>
                      </div>
                      {/* Assignee mobile */}
                      <div className="mt-3">
                        <div className="text-xs text-neutral dark:text-white/50 mb-1 font-medium uppercase tracking-wide">Исполнитель</div>
                        <Input
                          placeholder="Имя исполнителя..."
                          defaultValue={r.assignee || ""}
                          onBlur={(e) => {
                            if (e.target.value !== (r.assignee || "")) {
                              handleAssigneeChange(r.id, e.target.value);
                            }
                          }}
                          className="h-8 text-sm"
                        />
                      </div>
                      {/* Status dropdown mobile */}
                      <div className="mt-3">
                        <div className="text-xs text-neutral dark:text-white/50 mb-1 font-medium uppercase tracking-wide">Изменить статус</div>
                        <Select
                          value={r.status}
                          onValueChange={(value) => {
                            fetch(`/api/admin/${r.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json", "x-admin-password": password },
                              body: JSON.stringify({ status: value }),
                            }).then((res) => {
                              if (res.ok) {
                                setRequests((prev) => prev.map((req) => req.id === r.id ? { ...req, status: value } : req));
                                fetchStats();
                              }
                            });
                          }}
                        >
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {statusCycle.map((s) => (
                              <SelectItem key={s} value={s}>{statusLabels[s]?.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-200 dark:border-white/10">
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/api/admin/kp/${r.id}`, "_blank");
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-600 hover:bg-violet-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        КП
                      </button>
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
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === p ? "bg-primary text-white" : "bg-white dark:bg-dark-light text-neutral dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/10"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bulk actions bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-primary/10 border border-primary/20 rounded-2xl">
            <span className="text-sm font-medium text-primary">
              Выбрано: {selectedIds.size}
            </span>
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              {statusCycle.map((s) => (
                <button
                  key={s}
                  onClick={() => handleBulkStatus(s)}
                  disabled={bulkLoading}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: s === "new" ? "#dbeafe" : s === "in_progress" ? "#fef3c7" : s === "pending_payment" ? "#ffedd5" : s === "review" ? "#f3e8ff" : s === "done" ? "#dcfce7" : "#fee2e2",
                    color: s === "new" ? "#1d4ed8" : s === "in_progress" ? "#a16207" : s === "pending_payment" ? "#c2410c" : s === "review" ? "#7c3aed" : s === "done" ? "#15803d" : "#dc2626",
                  }}
                >
                  → {statusLabels[s]?.label}
                </button>
              ))}
              <button
                onClick={handleBulkDelete}
                disabled={bulkLoading}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
              >
                Удалить
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Desktop Table */}
        <div className="hidden md:block bg-white dark:bg-dark-light rounded-2xl shadow-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-warm-bg dark:bg-dark hover:bg-warm-bg dark:hover:bg-dark">
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={requests.length > 0 && selectedIds.size === requests.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 dark:border-white/15 text-primary dark:bg-dark"
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableHead>
                <TableHead className="font-semibold text-dark dark:text-white">#</TableHead>
                {sortableColumns.map((col) => (
                  <TableHead
                    key={col.field}
                    className="font-semibold text-dark dark:text-white cursor-pointer select-none hover:text-primary transition-colors"
                    onClick={() => handleSort(col.field)}
                  >
                    {col.label}
                    <SortArrow field={col.field} />
                  </TableHead>
                ))}
                <TableHead className="font-semibold text-dark dark:text-white">
                  Телефон
                </TableHead>
                <TableHead className="font-semibold text-dark dark:text-white">
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
                    className="border-t border-gray-100 dark:border-white/10 hover:bg-warm-bg/50 dark:hover:bg-white/5 cursor-pointer"
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(r.id)}
                        onChange={() => toggleSelect(r.id)}
                        className="rounded border-gray-300 dark:border-white/15 text-primary dark:bg-dark"
                      />
                    </TableCell>
                    <TableCell className="text-neutral dark:text-white/50">{r.id}</TableCell>
                    <TableCell className="text-neutral dark:text-white/50 whitespace-nowrap">
                      {formatDate(r.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium text-dark dark:text-white">
                      {r.company || r.name}
                    </TableCell>
                    <TableCell className="text-neutral dark:text-white/70">
                      {r.service}
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => cycleStatus(e, r.id, r.status)}
                            className="transition-transform hover:scale-105"
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
                    <TableCell className="text-neutral dark:text-white/70">
                      {r.phone}
                    </TableCell>
                    <TableCell className="text-neutral dark:text-white/70">
                      {r.email}
                    </TableCell>
                  </TableRow>
                  {expandedId === r.id && (
                    <TableRow
                      key={`${r.id}-detail`}
                      className="border-t border-gray-100 dark:border-white/10"
                    >
                      <TableCell colSpan={8} className="bg-warm-bg/30 dark:bg-white/5">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-neutral dark:text-white/50 mb-1 font-medium uppercase tracking-wide">
                              Сообщение
                            </div>
                            <div className="text-sm text-dark dark:text-white bg-white dark:bg-dark rounded-xl p-3">
                              {r.message || (
                                <span className="text-neutral dark:text-white/50 italic">
                                  Нет сообщения
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <div className="text-xs text-neutral dark:text-white/50 mb-1 font-medium uppercase tracking-wide">
                                Дата создания
                              </div>
                              <div className="text-sm text-dark dark:text-white">
                                {formatDateFull(r.createdAt)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-neutral dark:text-white/50 mb-1 font-medium uppercase tracking-wide">
                                Контакты
                              </div>
                              <div className="text-sm text-dark dark:text-white">
                                {r.name} &middot; {r.phone} &middot;{" "}
                                {r.email}
                                {r.inn && <> &middot; ИНН {r.inn}</>}
                              </div>
                            </div>
                            {r.items && r.items.length > 0 ? (
                              <div>
                                <div className="text-xs text-neutral dark:text-white/50 mb-2 font-medium uppercase tracking-wide">
                                  Позиции ({r.items.length})
                                </div>
                                <div className="space-y-2">
                                  {r.items.map((item, idx) => (
                                    <div
                                      key={item.id}
                                      className="bg-white dark:bg-dark rounded-lg p-3 border border-gray-100 dark:border-white/10"
                                    >
                                      <div className="text-xs font-semibold text-primary mb-1">
                                        Позиция {idx + 1}: {item.service}
                                      </div>
                                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                        {item.poverk && (
                                          <div>
                                            <span className="text-neutral dark:text-white/50">
                                              Поверка:
                                            </span>{" "}
                                            {item.poverk}
                                          </div>
                                        )}
                                        {item.object && (
                                          <div>
                                            <span className="text-neutral dark:text-white/50">
                                              СИ:
                                            </span>{" "}
                                            {item.object}
                                          </div>
                                        )}
                                        {item.fabricNumber && (
                                          <div>
                                            <span className="text-neutral dark:text-white/50">
                                              Зав. №:
                                            </span>{" "}
                                            {item.fabricNumber}
                                          </div>
                                        )}
                                        {item.registry && (
                                          <div>
                                            <span className="text-neutral dark:text-white/50">
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
                                  <div className="text-xs text-neutral dark:text-white/50 mb-1 font-medium uppercase tracking-wide">
                                    Услуга
                                  </div>
                                  <div className="text-sm text-dark dark:text-white">
                                    {r.service}
                                  </div>
                                </div>
                                {r.object && (
                                  <div>
                                    <div className="text-xs text-neutral dark:text-white/50 mb-1 font-medium uppercase tracking-wide">
                                      Наименование СИ
                                    </div>
                                    <div className="text-sm text-dark dark:text-white">
                                      {r.object}
                                    </div>
                                  </div>
                                )}
                                {r.fabricNumber && (
                                  <div>
                                    <div className="text-xs text-neutral dark:text-white/50 mb-1 font-medium uppercase tracking-wide">
                                      Заводской номер
                                    </div>
                                    <div className="text-sm text-dark dark:text-white">
                                      {r.fabricNumber}
                                    </div>
                                  </div>
                                )}
                                {r.registry && (
                                  <div>
                                    <div className="text-xs text-neutral dark:text-white/50 mb-1 font-medium uppercase tracking-wide">
                                      Номер реестра
                                    </div>
                                    <div className="text-sm text-dark dark:text-white">
                                      {r.registry}
                                    </div>
                                  </div>
                                )}
                                {r.poverk && (
                                  <div>
                                    <div className="text-xs text-neutral dark:text-white/50 mb-1 font-medium uppercase tracking-wide">
                                      Тип поверки
                                    </div>
                                    <div className="text-sm text-dark dark:text-white">
                                      {r.poverk}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                            {((r.files && r.files.length > 0) || (r.fileName && r.filePath)) && (
                              <div>
                                <div className="text-xs text-neutral dark:text-white/50 mb-1 font-medium uppercase tracking-wide">
                                  Прикрепленные файлы ({(r.files && r.files.length > 0) ? r.files.length : 1})
                                </div>
                                <div className="space-y-1.5">
                                  {r.files && r.files.length > 0 ? (
                                    r.files.map((file) => (
                                      <button
                                        key={file.id}
                                        onClick={() => openFile(file.filePath)}
                                        className="inline-flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors"
                                      >
                                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        {file.fileName}
                                      </button>
                                    ))
                                  ) : (
                                    <button
                                      onClick={() => openFile(r.filePath!)}
                                      className="inline-flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors"
                                    >
                                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      {r.fileName}
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                            <div>
                              <div className="text-xs text-neutral dark:text-white/50 mb-1 font-medium uppercase tracking-wide">
                                Договор оказания услуг
                              </div>
                              <div
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${r.needContract ? "bg-green-100 dark:bg-emerald-500/10 text-green-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/70"}`}
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
                            <div>
                              <label className="block text-xs text-neutral dark:text-white/50 mb-2 font-medium uppercase tracking-wide">
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

                            <div className="space-y-4">
                              <div>
                                <label className="block text-xs text-neutral dark:text-white/50 mb-2 font-medium uppercase tracking-wide">
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
                                <label className="block text-xs text-neutral dark:text-white/50 mb-2 font-medium uppercase tracking-wide">
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
                                      <div className="text-xs text-neutral dark:text-white/50 mb-2 font-medium uppercase tracking-wide">
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
                                    : "bg-gray-300 dark:bg-white/10 text-gray-500 dark:text-white/40 cursor-not-allowed opacity-60"
                                }`}
                              >
                                Сохранить
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Quick actions + Assignee + Templates */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <div className="grid lg:grid-cols-3 gap-6">
                            {/* Quick actions */}
                            <div>
                              <div className="text-xs text-neutral dark:text-white/50 mb-2 font-medium uppercase tracking-wide">Быстрые действия</div>
                              <div className="flex flex-wrap gap-2">
                                <a
                                  href={`tel:${r.phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                  Позвонить
                                </a>
                                <a
                                  href={`mailto:${r.email}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                  Написать
                                </a>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(`${r.name}, ${r.phone}, ${r.email}${r.company ? `, ${r.company}` : ""}`);
                                    toast.success("Контакт скопирован");
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                  Копировать
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    fetchClientHistory(r.email);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                  История клиента
                                </button>
                              </div>
                            </div>

                            {/* Assignee */}
                            <div>
                              <div className="text-xs text-neutral dark:text-white/50 mb-2 font-medium uppercase tracking-wide">Исполнитель</div>
                              <div className="flex items-center gap-2">
                                <Input
                                  placeholder="Имя исполнителя..."
                                  defaultValue={r.assignee || ""}
                                  onBlur={(e) => {
                                    if (e.target.value !== (r.assignee || "")) {
                                      handleAssigneeChange(r.id, e.target.value);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      (e.target as HTMLInputElement).blur();
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>

                            {/* Status dropdown */}
                            <div>
                              <div className="text-xs text-neutral dark:text-white/50 mb-2 font-medium uppercase tracking-wide">Изменить статус</div>
                              <Select
                                value={r.status}
                                onValueChange={(value) => {
                                  fetch(`/api/admin/${r.id}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json", "x-admin-password": password },
                                    body: JSON.stringify({ status: value }),
                                  }).then((res) => {
                                    if (res.ok) {
                                      setRequests((prev) => prev.map((req) => req.id === r.id ? { ...req, status: value } : req));
                                      fetchStats();
                                      toast.success(`Статус изменён: ${statusLabels[value]?.label}`);
                                    }
                                  });
                                }}
                              >
                                <SelectTrigger className="h-8 text-sm" onClick={(e) => e.stopPropagation()}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {statusCycle.map((s) => (
                                    <SelectItem key={s} value={s}>{statusLabels[s]?.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* Response templates */}
                        <div className="mt-4">
                          <div className="text-xs text-neutral dark:text-white/50 mb-2 font-medium uppercase tracking-wide">Шаблоны ответов</div>
                          <div className="flex flex-wrap gap-1.5">
                            {RESPONSE_TEMPLATES.map((tmpl, idx) => (
                              <button
                                key={idx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPricing((prev) => ({
                                    ...prev,
                                    [r.id]: {
                                      adminNotes: (prev[r.id]?.adminNotes ?? (r.adminNotes || "")) + (prev[r.id]?.adminNotes || r.adminNotes ? "\n" : "") + tmpl.text,
                                      executorPrice: prev[r.id]?.executorPrice ?? (r.executorPrice?.toString() || ""),
                                      markup: prev[r.id]?.markup ?? (r.markup?.toString() || ""),
                                    },
                                  }));
                                  toast.success(`Шаблон "${tmpl.label}" добавлен`);
                                }}
                                className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                              >
                                {tmpl.label}
                              </button>
                            ))}
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
                                className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20 min-w-[200px]"
                              >
                                <button
                                  onClick={() => handleExportToExcel(r.id)}
                                  className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 transition-colors text-dark"
                                >
                                  Все позиции
                                </button>
                                <div className="border-t border-gray-100 my-1" />
                                <button
                                  onClick={() => handleExportToExcel(r.id, "поверка")}
                                  className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 transition-colors text-dark"
                                >
                                  Только поверки
                                </button>
                                <button
                                  onClick={() => handleExportToExcel(r.id, "аттестация")}
                                  className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 transition-colors text-dark"
                                >
                                  Только аттестации
                                </button>
                                <button
                                  onClick={() => handleExportToExcel(r.id, "калибровка")}
                                  className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 transition-colors text-dark"
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
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    page === p
                      ? "bg-primary text-white"
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
      {/* Client History Modal */}
      {clientHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setClientHistory(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-dark dark:text-white">История клиента</h3>
                <p className="text-sm text-neutral">{clientHistory.email} — {clientHistory.requests.length} заявок</p>
              </div>
              <button onClick={() => setClientHistory(null)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5 text-neutral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh] space-y-3">
              {clientHistory.requests.length === 0 ? (
                <div className="text-center py-8 text-neutral">Заявок не найдено</div>
              ) : (
                clientHistory.requests.map((req) => (
                  <div key={req.id} className="bg-warm-bg/50 rounded-xl p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-dark">#{req.id} — {req.service}</span>
                      <Badge variant={statusLabels[req.status]?.variant || "default"}>
                        {statusLabels[req.status]?.label || req.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-neutral">{formatDate(req.createdAt)}</div>
                    {req.message && <div className="text-sm text-dark mt-1">{req.message}</div>}
                    {req.clientPrice && (
                      <div className="text-sm font-medium text-primary">{req.clientPrice.toFixed(2)} ₽</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </TooltipProvider>
  );
}
