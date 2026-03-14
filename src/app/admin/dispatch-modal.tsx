"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface PendingItem {
  execReqId: number;
  request: {
    id: number;
    service: string;
    company: string;
    items?: {
      id: number;
      service: string;
      poverk: string | null;
      object: string | null;
      fabricNumber: string | null;
      registry: string | null;
    }[];
  };
  executor: { id: number; name: string; email: string };
  suggestedSubject: string;
}

interface AutoSentItem {
  requestId: number;
  service: string;
  company: string;
  executorName: string;
  sentAt: string | null;
}

interface NoExecutorItem {
  requestId: number;
  service: string;
  company: string;
}

interface DispatchData {
  pendingApproval: PendingItem[];
  autoSent: AutoSentItem[];
  noExecutor: NoExecutorItem[];
}

interface DispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  getAuthHeaders: () => Record<string, string>;
  allExecutors: { id: number; name: string; email: string; services: string }[];
  onRefreshRequests: () => void;
}

export default function DispatchModal({
  isOpen,
  onClose,
  getAuthHeaders,
  allExecutors,
  onRefreshRequests,
}: DispatchModalProps) {
  const [data, setData] = useState<DispatchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [skippedIds, setSkippedIds] = useState<Set<number>>(new Set());
  const [approvingIds, setApprovingIds] = useState<Set<number>>(new Set());
  const [batchApproving, setBatchApproving] = useState(false);

  // Per-card edit state
  const [editExecutorId, setEditExecutorId] = useState<Record<number, number>>({});
  const [editSubject, setEditSubject] = useState<Record<number, string>>({});
  const [editMessage, setEditMessage] = useState<Record<number, string>>({});

  // No-executor inline assignment
  const [assignExecutorId, setAssignExecutorId] = useState<Record<number, number | null>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pending-dispatch", {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Ошибка загрузки");
      const json: DispatchData = await res.json();
      setData(json);
      setSkippedIds(new Set());
      setExpandedId(null);
    } catch {
      toast.error("Не удалось загрузить данные диспетчеризации");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    } else {
      setData(null);
      setExpandedId(null);
      setSkippedIds(new Set());
      setEditExecutorId({});
      setEditSubject({});
      setEditMessage({});
      setAssignExecutorId({});
    }
  }, [isOpen, fetchData]);

  const handleExpand = (item: PendingItem) => {
    if (expandedId === item.execReqId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(item.execReqId);
    setEditExecutorId((prev) => ({ ...prev, [item.execReqId]: item.executor.id }));
    setEditSubject((prev) => ({ ...prev, [item.execReqId]: item.suggestedSubject }));
    setEditMessage((prev) => ({ ...prev, [item.execReqId]: "" }));
  };

  const handleApproveSingle = async (
    execReqId: number,
    options?: { executorId?: number; customSubject?: string; customMessage?: string }
  ) => {
    setApprovingIds((prev) => new Set(prev).add(execReqId));
    try {
      const body: Record<string, unknown> = { action: "approve-and-send" };
      if (options?.executorId) body.executorId = options.executorId;
      if (options?.customSubject) body.customSubject = options.customSubject;
      if (options?.customMessage) body.customMessage = options.customMessage;

      const res = await fetch(`/api/admin/executor-request/${execReqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Ошибка");
      }
      toast.success("Заявка одобрена и отправлена исполнителю");
      setData((prev) =>
        prev
          ? {
              ...prev,
              pendingApproval: prev.pendingApproval.filter((p) => p.execReqId !== execReqId),
            }
          : prev
      );
      if (expandedId === execReqId) setExpandedId(null);
      onRefreshRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка при одобрении");
    } finally {
      setApprovingIds((prev) => {
        const next = new Set(prev);
        next.delete(execReqId);
        return next;
      });
    }
  };

  const handleBatchApprove = async () => {
    if (!data) return;
    const ids = data.pendingApproval
      .filter((p) => !skippedIds.has(p.execReqId))
      .map((p) => p.execReqId);
    if (ids.length === 0) {
      toast.info("Нет заявок для одобрения");
      return;
    }
    setBatchApproving(true);
    try {
      const res = await fetch("/api/admin/batch-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ approvals: ids }),
      });
      if (!res.ok) throw new Error("Ошибка");
      const result = await res.json();
      toast.success(`Одобрено: ${result.success} из ${result.total}`);
      if (result.failed > 0) {
        toast.warning(`Не удалось: ${result.failed}`);
      }
      setData((prev) =>
        prev
          ? {
              ...prev,
              pendingApproval: prev.pendingApproval.filter((p) => skippedIds.has(p.execReqId)),
            }
          : prev
      );
      onRefreshRequests();
    } catch {
      toast.error("Ошибка при массовом одобрении");
    } finally {
      setBatchApproving(false);
    }
  };

  const handleAssignManual = async (requestId: number, executorId: number) => {
    try {
      const res = await fetch("/api/admin/executor-request", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ requestId, executorId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Ошибка");
      }
      toast.success("Исполнитель назначен");
      setData((prev) =>
        prev
          ? {
              ...prev,
              noExecutor: prev.noExecutor.filter((n) => n.requestId !== requestId),
            }
          : prev
      );
      onRefreshRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка при назначении");
    }
  };

  const pendingCount = data
    ? data.pendingApproval.filter((p) => !skippedIds.has(p.execReqId)).length
    : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 rounded-t-2xl border-b border-zinc-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Диспетчеризация заявок
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Просмотр и управление отправкой заявок исполнителям
              </p>
            </div>

            {/* Body */}
            <div className="space-y-6 p-6">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
                </div>
              )}

              {!loading && data && (
                <>
                  {/* Section 1: Pending Approval */}
                  {data.pendingApproval.length > 0 && (
                    <section>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                        <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                        Ожидают подтверждения ({data.pendingApproval.length})
                      </h3>
                      <div className="space-y-3">
                        {data.pendingApproval.map((item) => {
                          const isSkipped = skippedIds.has(item.execReqId);
                          const isExpanded = expandedId === item.execReqId;
                          const isApproving = approvingIds.has(item.execReqId);

                          return (
                            <div
                              key={item.execReqId}
                              className={`rounded-xl border p-4 transition-shadow ${
                                isSkipped
                                  ? "border-zinc-200 bg-zinc-50 opacity-50 dark:border-zinc-700 dark:bg-zinc-800/50"
                                  : "border-amber-200 bg-amber-50/50 dark:border-amber-800/50 dark:bg-amber-950/20"
                              }`}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                      #{item.request.id}
                                    </span>
                                    <span className="truncate text-zinc-600 dark:text-zinc-400">
                                      {item.request.service}
                                    </span>
                                  </div>
                                  <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                    {item.request.company}
                                  </div>
                                  <div className="mt-1 text-sm">
                                    <span className="text-zinc-400 dark:text-zinc-500">Исполнитель: </span>
                                    <span className="font-medium text-amber-700 dark:text-amber-400">
                                      {item.executor.name}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-shrink-0 items-center gap-2">
                                  {!isSkipped && (
                                    <>
                                      <button
                                        onClick={() => handleApproveSingle(item.execReqId)}
                                        disabled={isApproving}
                                        className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
                                      >
                                        {isApproving ? "..." : "Одобрить"}
                                      </button>
                                      <button
                                        onClick={() => handleExpand(item)}
                                        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                      >
                                        Изменить {isExpanded ? "▴" : "▾"}
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() =>
                                      setSkippedIds((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(item.execReqId)) {
                                          next.delete(item.execReqId);
                                        } else {
                                          next.add(item.execReqId);
                                          if (expandedId === item.execReqId) setExpandedId(null);
                                        }
                                        return next;
                                      })
                                    }
                                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                  >
                                    {isSkipped ? "Вернуть" : "Пропустить"}
                                  </button>
                                </div>
                              </div>

                              {/* Expanded edit area */}
                              <AnimatePresence>
                                {isExpanded && !isSkipped && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="mt-4 space-y-3 border-t border-amber-200 pt-4 dark:border-amber-800/50">
                                      {/* Executor dropdown */}
                                      <div>
                                        <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                          Исполнитель
                                        </label>
                                        <select
                                          value={editExecutorId[item.execReqId] ?? item.executor.id}
                                          onChange={(e) =>
                                            setEditExecutorId((prev) => ({
                                              ...prev,
                                              [item.execReqId]: Number(e.target.value),
                                            }))
                                          }
                                          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                                        >
                                          {allExecutors.map((ex) => (
                                            <option key={ex.id} value={ex.id}>
                                              {ex.name} ({ex.email})
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      {/* Subject */}
                                      <div>
                                        <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                          Тема письма
                                        </label>
                                        <input
                                          type="text"
                                          value={editSubject[item.execReqId] ?? item.suggestedSubject}
                                          onChange={(e) =>
                                            setEditSubject((prev) => ({
                                              ...prev,
                                              [item.execReqId]: e.target.value,
                                            }))
                                          }
                                          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                                        />
                                      </div>

                                      {/* Message */}
                                      <div>
                                        <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                          Дополнительное сообщение
                                        </label>
                                        <textarea
                                          value={editMessage[item.execReqId] ?? ""}
                                          onChange={(e) =>
                                            setEditMessage((prev) => ({
                                              ...prev,
                                              [item.execReqId]: e.target.value,
                                            }))
                                          }
                                          rows={3}
                                          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                                          placeholder="Необязательное сообщение для исполнителя..."
                                        />
                                      </div>

                                      {/* Items table */}
                                      {item.request.items && item.request.items.length > 0 && (
                                        <div>
                                          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                            Позиции заявки
                                          </label>
                                          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
                                            <table className="w-full text-left text-xs">
                                              <thead className="bg-zinc-100 dark:bg-zinc-800">
                                                <tr>
                                                  <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400">
                                                    Услуга
                                                  </th>
                                                  <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400">
                                                    Объект
                                                  </th>
                                                  <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400">
                                                    Зав. номер
                                                  </th>
                                                  <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400">
                                                    Реестр
                                                  </th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {item.request.items.map((ri) => (
                                                  <tr
                                                    key={ri.id}
                                                    className="border-t border-zinc-200 dark:border-zinc-700"
                                                  >
                                                    <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100">
                                                      {ri.service}
                                                    </td>
                                                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                                                      {ri.object || "—"}
                                                    </td>
                                                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                                                      {ri.fabricNumber || "—"}
                                                    </td>
                                                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                                                      {ri.registry || "—"}
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      )}

                                      {/* Expanded action buttons */}
                                      <div className="flex items-center gap-2 pt-1">
                                        <button
                                          onClick={() =>
                                            handleApproveSingle(item.execReqId, {
                                              executorId: editExecutorId[item.execReqId],
                                              customSubject: editSubject[item.execReqId],
                                              customMessage: editMessage[item.execReqId] || undefined,
                                            })
                                          }
                                          disabled={isApproving}
                                          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
                                        >
                                          {isApproving ? "Отправка..." : "Отправить"}
                                        </button>
                                        <button
                                          onClick={() => setExpandedId(null)}
                                          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                        >
                                          Отмена
                                        </button>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* Section 2: Auto-Sent */}
                  {data.autoSent.length > 0 && (
                    <section>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">
                        <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                        Автоматически отправлено: {data.autoSent.length} заявок
                      </h3>
                      <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 dark:border-green-800/50 dark:bg-green-950/20">
                        <ul className="space-y-2">
                          {data.autoSent.map((item) => (
                            <li
                              key={`${item.requestId}-${item.executorName}`}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-zinc-700 dark:text-zinc-300">
                                <span className="font-medium">#{item.requestId}</span>{" "}
                                <span className="text-zinc-500 dark:text-zinc-400">
                                  {item.service}
                                </span>
                              </span>
                              <span className="font-medium text-green-700 dark:text-green-400">
                                {item.executorName}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </section>
                  )}

                  {/* Section 3: No Executor Found */}
                  {data.noExecutor.length > 0 && (
                    <section>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                        <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
                        Не найден исполнитель: {data.noExecutor.length} заявок
                      </h3>
                      <div className="space-y-2">
                        {data.noExecutor.map((item) => (
                          <div
                            key={item.requestId}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50/50 p-3 dark:border-rose-800/50 dark:bg-rose-950/20"
                          >
                            <div className="text-sm">
                              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                #{item.requestId}
                              </span>{" "}
                              <span className="text-zinc-600 dark:text-zinc-400">
                                {item.service}
                              </span>
                              {item.company && (
                                <span className="ml-2 text-zinc-500 dark:text-zinc-400">
                                  ({item.company})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {assignExecutorId[item.requestId] !== undefined ? (
                                <>
                                  <select
                                    value={assignExecutorId[item.requestId] ?? ""}
                                    onChange={(e) =>
                                      setAssignExecutorId((prev) => ({
                                        ...prev,
                                        [item.requestId]: e.target.value
                                          ? Number(e.target.value)
                                          : null,
                                      }))
                                    }
                                    className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                                  >
                                    <option value="">Выберите...</option>
                                    {allExecutors.map((ex) => (
                                      <option key={ex.id} value={ex.id}>
                                        {ex.name}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => {
                                      const exId = assignExecutorId[item.requestId];
                                      if (exId) handleAssignManual(item.requestId, exId);
                                    }}
                                    disabled={!assignExecutorId[item.requestId]}
                                    className="rounded-lg bg-rose-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
                                  >
                                    OK
                                  </button>
                                  <button
                                    onClick={() =>
                                      setAssignExecutorId((prev) => {
                                        const next = { ...prev };
                                        delete next[item.requestId];
                                        return next;
                                      })
                                    }
                                    className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
                                  >
                                    Отмена
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() =>
                                    setAssignExecutorId((prev) => ({
                                      ...prev,
                                      [item.requestId]: null,
                                    }))
                                  }
                                  className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-100 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
                                >
                                  Назначить вручную
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Empty state */}
                  {data.pendingApproval.length === 0 &&
                    data.autoSent.length === 0 &&
                    data.noExecutor.length === 0 && (
                      <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                        Нет новых заявок для диспетчеризации
                      </div>
                    )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-b-2xl border-t border-zinc-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95">
              <button
                onClick={handleBatchApprove}
                disabled={batchApproving || pendingCount === 0}
                className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {batchApproving ? "Отправка..." : `Одобрить все (${pendingCount})`}
              </button>
              <button
                onClick={onClose}
                className="rounded-lg border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Закрыть
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
