"use client";

import Modal from "@/components/Modal";
import { EmptyState } from "@/components/ui/empty-state";
import { useEffect, useState } from "react";

interface RequestItem {
  id: number;
  service: string;
  poverk?: string | null;
  object?: string | null;
  fabricNumber?: string | null;
  registry?: string | null;
}

interface Request {
  id: number;
  name: string;
  phone: string;
  email: string;
  company?: string | null;
  inn?: string | null;
  service: string;
  object?: string | null;
  fabricNumber?: string | null;
  registry?: string | null;
  poverk?: string | null;
  message: string | null;
  fileName: string | null;
  filePath: string | null;
  files?: { id: number; fileName: string; filePath: string }[];
  status: string;
  createdAt: string;
  needContract?: boolean;
  items?: RequestItem[];
}

const statusLabels: Record<string, { label: string; color: string }> = {
  new: { label: "Новая", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  in_progress: { label: "В работе", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  done: { label: "Выполнена", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
};

function DetailField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs text-neutral dark:text-white/50">{label}</span>
      <p className="text-sm text-dark dark:text-white">{value}</p>
    </div>
  );
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [user, setUser] = useState<{ name: string; phone: string | null; email: string } | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

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

  const hasDetails = (r: Request) =>
    r.company || r.inn || r.object || r.fabricNumber || r.registry || r.poverk ||
    r.message || r.fileName || (r.files && r.files.length > 0) || r.needContract || (r.items && r.items.length > 0);

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
          className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Новая заявка
        </button>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm">
            <EmptyState
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              title="У вас пока нет заявок"
              description="Оформите первую заявку на поверку или аттестацию оборудования"
              action={
                <button
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-2 gradient-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Новая заявка
                </button>
              }
            />
          </div>
        ) : (
          requests.map((request) => {
            const isExpanded = expandedId === request.id;
            const expandable = hasDetails(request);
            const items = request.items || [];

            return (
              <div
                key={request.id}
                className={`bg-white dark:bg-dark-light rounded-2xl shadow-sm ${expandable ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
              >
                {/* Header — always visible */}
                <div
                  className="p-6"
                  onClick={() => expandable && setExpandedId(isExpanded ? null : request.id)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
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
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusLabels[request.status]?.color || statusLabels.new.color}`}>
                        {statusLabels[request.status]?.label || "Новая"}
                      </span>
                      {expandable && (
                        <svg
                          className={`w-5 h-5 text-neutral dark:text-white/50 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-6 pb-6 space-y-4 border-t border-gray-100 dark:border-white/10 pt-4">
                    {/* Contact info */}
                    {(request.company || request.inn) && (
                      <div>
                        <h4 className="text-xs font-semibold text-neutral dark:text-white/50 uppercase tracking-wider mb-2">
                          Контактные данные
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <DetailField label="Компания" value={request.company} />
                          <DetailField label="ИНН" value={request.inn} />
                        </div>
                      </div>
                    )}

                    {/* Service details */}
                    {items.length > 0 ? (
                      <div>
                        <h4 className="text-xs font-semibold text-neutral dark:text-white/50 uppercase tracking-wider mb-2">
                          Позиции ({items.length})
                        </h4>
                        <div className="overflow-x-auto -mx-6 px-6">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-xs text-neutral dark:text-white/50 border-b border-gray-100 dark:border-white/10">
                                <th className="pb-2 pr-4 font-medium">Услуга</th>
                                <th className="pb-2 pr-4 font-medium">Объект</th>
                                <th className="pb-2 pr-4 font-medium">Зав. номер</th>
                                <th className="pb-2 pr-4 font-medium">Реестр</th>
                                <th className="pb-2 font-medium">Вид поверки</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item) => (
                                <tr key={item.id} className="border-b border-gray-50 dark:border-white/5 last:border-0">
                                  <td className="py-2 pr-4 text-dark dark:text-white">{item.service}</td>
                                  <td className="py-2 pr-4 text-dark dark:text-white">{item.object || "—"}</td>
                                  <td className="py-2 pr-4 text-dark dark:text-white">{item.fabricNumber || "—"}</td>
                                  <td className="py-2 pr-4 text-dark dark:text-white">{item.registry || "—"}</td>
                                  <td className="py-2 text-dark dark:text-white">{item.poverk || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (request.object || request.fabricNumber || request.registry || request.poverk) ? (
                      <div>
                        <h4 className="text-xs font-semibold text-neutral dark:text-white/50 uppercase tracking-wider mb-2">
                          Детали услуги
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <DetailField label="Объект" value={request.object} />
                          <DetailField label="Заводской номер" value={request.fabricNumber} />
                          <DetailField label="Реестр" value={request.registry} />
                          <DetailField label="Вид поверки" value={request.poverk} />
                        </div>
                      </div>
                    ) : null}

                    {/* Message */}
                    {request.message && (
                      <div>
                        <h4 className="text-xs font-semibold text-neutral dark:text-white/50 uppercase tracking-wider mb-2">
                          Сообщение
                        </h4>
                        <p className="text-sm text-neutral dark:text-white/70 bg-gray-50 dark:bg-white/5 rounded-xl p-3">
                          {request.message}
                        </p>
                      </div>
                    )}

                    {/* Files */}
                    {((request.files && request.files.length > 0) || (request.fileName && request.filePath)) && (
                      <div>
                        <h4 className="text-xs font-semibold text-neutral dark:text-white/50 uppercase tracking-wider mb-2">
                          Прикреплённые файлы
                        </h4>
                        <div className="space-y-1.5">
                          {request.files && request.files.length > 0 ? (
                            request.files.map((file) => (
                              <a
                                key={file.id}
                                href={file.filePath}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-2 text-sm text-primary hover:underline"
                              >
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                {file.fileName}
                              </a>
                            ))
                          ) : (
                            <a
                              href={request.filePath!}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              {request.fileName}
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Contract badge */}
                    {request.needContract && (
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Требуется договор
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
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
