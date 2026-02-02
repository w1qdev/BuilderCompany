"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { io as ioClient, Socket } from "socket.io-client";

interface RequestItem {
  id: number;
  name: string;
  phone: string;
  email: string;
  service: string;
  message: string | null;
  status: string;
  createdAt: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  new: { label: "Новая", color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "В работе", color: "bg-yellow-100 text-yellow-700" },
  done: { label: "Завершена", color: "bg-green-100 text-green-700" },
};

const statusCycle = ["new", "in_progress", "done"];

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

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin?status=${filter}&page=${page}`, {
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
  }, [password, filter, page]);

  useEffect(() => {
    if (authenticated) fetchRequests();
  }, [authenticated, fetchRequests]);

  // Socket.io connection
  useEffect(() => {
    if (!authenticated) {
      // Disconnect on logout
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
        // Deduplicate
        if (prev.some((r) => r.id === request.id)) return prev;
        return [request, ...prev];
      });
      setTotal((prev) => prev + 1);
    });

    socket.on("status-update", (updated: RequestItem) => {
      setRequests((prev) =>
        prev.map((r) => (r.id === updated.id ? { ...r, status: updated.status } : r))
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [authenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAuthenticated(true);
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setPassword("");
  };

  const cycleStatus = async (id: number, currentStatus: string) => {
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
      }
    } catch {
      console.error("Status update failed");
    }
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

          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all bg-warm-bg mb-4"
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

  return (
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
              <span className="font-bold">СтройКомпани</span>
            </a>
            <span className="text-white/40 text-sm">/ Админ-панель</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Connection indicator */}
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

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
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
          <button
            onClick={fetchRequests}
            className="ml-auto px-4 py-2 rounded-xl text-sm font-medium bg-white text-neutral hover:bg-gray-50 transition-all"
          >
            Обновить
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-20 text-neutral">Загрузка...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20 text-neutral">Заявок пока нет</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-warm-bg">
                    <th className="text-left px-4 py-3 font-semibold text-dark">#</th>
                    <th className="text-left px-4 py-3 font-semibold text-dark">Дата</th>
                    <th className="text-left px-4 py-3 font-semibold text-dark">Имя</th>
                    <th className="text-left px-4 py-3 font-semibold text-dark">Телефон</th>
                    <th className="text-left px-4 py-3 font-semibold text-dark">Email</th>
                    <th className="text-left px-4 py-3 font-semibold text-dark">Услуга</th>
                    <th className="text-left px-4 py-3 font-semibold text-dark">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} className="border-t border-gray-100 hover:bg-warm-bg/50 transition-colors">
                      <td className="px-4 py-3 text-neutral">{r.id}</td>
                      <td className="px-4 py-3 text-neutral whitespace-nowrap">{formatDate(r.createdAt)}</td>
                      <td className="px-4 py-3 font-medium text-dark">{r.name}</td>
                      <td className="px-4 py-3 text-neutral">{r.phone}</td>
                      <td className="px-4 py-3 text-neutral">{r.email}</td>
                      <td className="px-4 py-3 text-neutral">{r.service}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => cycleStatus(r.id, r.status)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:scale-105 ${
                            statusLabels[r.status]?.color || "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {statusLabels[r.status]?.label || r.status}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
  );
}
