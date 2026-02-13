"use client";

import Modal from "@/components/Modal";
import { useEffect, useState } from "react";

interface Request {
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

const statusLabels: Record<string, { label: string; color: string }> = {
  new: { label: "Новая", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  in_progress: { label: "В работе", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  done: { label: "Выполнена", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [user, setUser] = useState<{ name: string; phone: string | null; email: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, reqRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/user/requests"),
        ]);
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);
        }
        if (reqRes.ok) {
          const data = await reqRes.json();
          setRequests(data.requests);
          setTotalPages(data.pages || 1);
        }
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const refreshRequests = async () => {
    const res = await fetch("/api/user/requests");
    if (res.ok) {
      const data = await res.json();
      setRequests(data.requests);
      setPage(1);
      setTotalPages(data.pages || 1);
    }
  };

  const loadMore = async () => {
    const nextPage = page + 1;
    const res = await fetch(`/api/user/requests?page=${nextPage}`);
    if (res.ok) {
      const data = await res.json();
      setRequests((prev) => [...prev, ...data.requests]);
      setPage(nextPage);
      setTotalPages(data.pages || 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-dark dark:text-white">Мои заявки</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 gradient-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/30 transition-shadow"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Новая заявка
        </button>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-white/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-dark dark:text-white mb-2">У вас пока нет заявок</h3>
            <p className="text-neutral dark:text-white/70">Нажмите «Новая заявка» для создания</p>
          </div>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-semibold text-dark dark:text-white">{request.service}</h3>
                  <p className="text-sm text-neutral dark:text-white/70">
                    Заявка #{request.id} от{" "}
                    {new Date(request.createdAt).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusLabels[request.status]?.color || statusLabels.new.color}`}>
                  {statusLabels[request.status]?.label || "Новая"}
                </span>
              </div>
              {request.message && (
                <p className="text-sm text-neutral dark:text-white/70 bg-gray-50 dark:bg-white/5 rounded-xl p-3">
                  {request.message}
                </p>
              )}
              {request.fileName && request.filePath && (
                <a
                  href={request.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {request.fileName}
                </a>
              )}
            </div>
          ))
        )}

        {page < totalPages && (
          <div className="text-center pt-4">
            <button
              onClick={loadMore}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-dark-light text-dark dark:text-white shadow hover:shadow-md transition-shadow"
            >
              Загрузить ещё
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          refreshRequests();
        }}
        initialValues={{
          name: user?.name || "",
          phone: user?.phone || "",
          email: user?.email || "",
        }}
      />
    </div>
  );
}
