# Automation Modes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add semi-auto / auto toggle for executor dispatch, plus a dispatch modal that appears when admin enters the panel showing pending requests for approval or informational summary.

**Architecture:** Setting-based mode toggle (`automationMode` key in DB). Submit route branches on mode. New `pending-dispatch` endpoint aggregates data for the modal. New `batch-approve` endpoint handles mass approval. `DispatchModal` component renders on admin page entry.

**Tech Stack:** Next.js 14 App Router, Prisma (SQLite), Socket.IO, shadcn/ui, Tailwind CSS, Framer Motion

---

### Task 1: Add `automationMode` to settings API

**Files:**
- Modify: `src/app/api/admin/settings/route.ts`

**Step 1: Add `automationMode` to string keys**

In `src/app/api/admin/settings/route.ts`, add to `AUTOMATION_STRING_KEYS` array:

```typescript
const AUTOMATION_STRING_KEYS = [
  "imapCheckInterval",
  "defaultMarkup",
  "automationMode",
];
```

**Step 2: Set default value for `automationMode` in GET handler**

In the GET handler, after the `AUTOMATION_STRING_KEYS` loop, add a default:

```typescript
if (!result["automationMode"]) {
  result["automationMode"] = "semi-auto";
}
```

**Step 3: Verify**

Run: `npm run build`
Expected: Compiles successfully.

**Step 4: Commit**

```bash
git add src/app/api/admin/settings/route.ts
git commit -m "feat: add automationMode to admin settings API"
```

---

### Task 2: Branch submit route on automation mode

**Files:**
- Modify: `src/app/api/submit/route.ts`

**Step 1: Read `automationMode` setting before executor matching**

Replace the existing auto-find block (lines ~186-216) with mode-aware logic:

```typescript
    // Auto-find executor (non-blocking) — mode-aware dispatch
    (async () => {
      try {
        // Read automation mode
        const modeSetting = await prisma.setting.findUnique({
          where: { key: "automationMode" },
        });
        const mode = modeSetting?.value || "semi-auto";

        const { findExecutorForService } = await import("@/lib/executorMatcher");
        const services = serviceItems.map((i) => i.service);
        const matched = await findExecutorForService(services);

        const { getIO } = await import("@/lib/socket");
        const io = getIO();

        if (!matched) {
          // No executor found — notify admin in both modes
          if (io) {
            io.to("admin").emit("no-executor-found", {
              requestId: request.id,
              service: serviceItems[0]?.service || service,
            });
          }
          return;
        }

        const { v4: uuidv4 } = await import("uuid");

        if (mode === "auto") {
          // AUTO: create ExecutorRequest, send email immediately
          const executorRequest = await prisma.executorRequest.create({
            data: {
              requestId: request.id,
              executorId: matched.id,
              status: "awaiting_response",
              sentAt: new Date(),
              paymentToken: uuidv4(),
            },
          });

          const { sendExecutorEmail } = await import("@/lib/executorEmail");
          const msgId = await sendExecutorEmail({
            executorName: matched.name,
            executorEmail: matched.email,
            requestId: request.id,
            executorRequestId: executorRequest.id,
            clientCompany: company || name,
            clientInn: inn || undefined,
            items: serviceItems,
            message: message || undefined,
            files: submitFiles,
          });

          if (msgId) {
            await prisma.executorRequest.update({
              where: { id: executorRequest.id },
              data: { emailMessageId: msgId },
            });
          }

          await prisma.request.update({
            where: { id: request.id },
            data: { status: "in_progress" },
          });

          if (io) {
            io.to("admin").emit("auto-dispatched", {
              requestId: request.id,
              executorName: matched.name,
            });
            if (request.userId) {
              io.to(`user:${request.userId}`).emit("request-status-changed", {
                requestId: request.id,
                status: "in_progress",
              });
              io.to(`user:${request.userId}`).emit("executor-assigned", {
                requestId: request.id,
                executorName: matched.name,
                message: `По вашей заявке #${request.id} найден исполнитель и отправлен запрос`,
              });
            }
          }
        } else {
          // SEMI-AUTO: create ExecutorRequest with pending_approval
          await prisma.executorRequest.create({
            data: {
              requestId: request.id,
              executorId: matched.id,
              status: "pending_approval",
              paymentToken: uuidv4(),
            },
          });

          if (io) {
            io.to("admin").emit("executor-match-found", {
              requestId: request.id,
              executorName: matched.name,
            });
          }
        }
      } catch (err) {
        console.error("Auto executor match error:", err);
      }
    })();
```

**Step 2: Verify**

Run: `npm run build`
Expected: Compiles successfully.

**Step 3: Commit**

```bash
git add src/app/api/submit/route.ts
git commit -m "feat: branch executor dispatch on automationMode setting"
```

---

### Task 3: Create `GET /api/admin/pending-dispatch` endpoint

**Files:**
- Create: `src/app/api/admin/pending-dispatch/route.ts`

**Step 1: Create the route file**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Pending approval: ExecutorRequests waiting for admin confirmation
  const pendingApproval = await prisma.executorRequest.findMany({
    where: { status: "pending_approval" },
    include: {
      request: {
        include: {
          items: true,
          files: true,
        },
      },
      executor: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const pendingData = pendingApproval.map((er) => {
    const code = `[CSM-${er.requestId}-${er.id}]`;
    return {
      execReqId: er.id,
      request: {
        id: er.request.id,
        service: er.request.service,
        company: er.request.company,
        name: er.request.name,
        inn: er.request.inn,
        message: er.request.message,
        items: er.request.items,
        files: er.request.files,
        createdAt: er.request.createdAt,
      },
      executor: er.executor,
      suggestedSubject: `Заявка на поверку ${code} — ${er.request.company || er.request.name}`,
    };
  });

  // 2. Auto-sent: recently dispatched automatically (since admin's last view)
  const lastViewSetting = await prisma.setting.findUnique({
    where: { key: "adminLastDispatchView" },
  });
  const lastView = lastViewSetting?.value
    ? new Date(lastViewSetting.value)
    : new Date(Date.now() - 24 * 60 * 60 * 1000); // default: last 24h

  const autoSent = await prisma.executorRequest.findMany({
    where: {
      status: { in: ["awaiting_response", "response_received", "invoice_parsed"] },
      sentAt: { gte: lastView },
    },
    include: {
      request: { select: { id: true, service: true, company: true, name: true } },
      executor: { select: { name: true, email: true } },
    },
    orderBy: { sentAt: "desc" },
  });

  const autoSentData = autoSent.map((er) => ({
    requestId: er.requestId,
    service: er.request.service,
    clientName: er.request.company || er.request.name,
    executorName: er.executor.name,
    sentAt: er.sentAt,
  }));

  // 3. No executor: requests that are "new" and have no ExecutorRequest at all
  const newRequests = await prisma.request.findMany({
    where: { status: "new" },
    select: { id: true, service: true, company: true, name: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  // Filter out those that already have an ExecutorRequest
  const requestsWithExecReq = await prisma.executorRequest.findMany({
    where: { requestId: { in: newRequests.map((r) => r.id) } },
    select: { requestId: true },
  });
  const hasExecReqIds = new Set(requestsWithExecReq.map((e) => e.requestId));

  const noExecutor = newRequests
    .filter((r) => !hasExecReqIds.has(r.id))
    .map((r) => ({
      requestId: r.id,
      service: r.service,
      clientName: r.company || r.name,
      createdAt: r.createdAt,
    }));

  // Update last view timestamp
  await prisma.setting.upsert({
    where: { key: "adminLastDispatchView" },
    update: { value: new Date().toISOString() },
    create: { key: "adminLastDispatchView", value: new Date().toISOString() },
  });

  return NextResponse.json({
    pendingApproval: pendingData,
    autoSent: autoSentData,
    noExecutor,
  });
}
```

**Step 2: Verify**

Run: `npm run build`
Expected: Compiles successfully.

**Step 3: Commit**

```bash
git add src/app/api/admin/pending-dispatch/route.ts
git commit -m "feat: add GET /api/admin/pending-dispatch endpoint"
```

---

### Task 4: Create `POST /api/admin/batch-approve` endpoint

**Files:**
- Create: `src/app/api/admin/batch-approve/route.ts`

**Step 1: Create the route file**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/adminAuth";
import { sendExecutorEmail } from "@/lib/executorEmail";
import { getIO } from "@/lib/socket";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { approvals } = body as { approvals: number[] };

  if (!Array.isArray(approvals) || approvals.length === 0) {
    return NextResponse.json({ error: "No approvals provided" }, { status: 400 });
  }

  const results: { execReqId: number; success: boolean; error?: string }[] = [];

  for (const execReqId of approvals) {
    try {
      const execReq = await prisma.executorRequest.findUnique({
        where: { id: execReqId },
        include: {
          request: { include: { items: true, files: true } },
          executor: true,
        },
      });

      if (!execReq || execReq.status !== "pending_approval") {
        results.push({ execReqId, success: false, error: "Not found or not pending" });
        continue;
      }

      const request = execReq.request;
      const items = request.items.map((i) => ({
        service: i.service,
        poverk: i.poverk || undefined,
        object: i.object || undefined,
        fabricNumber: i.fabricNumber || undefined,
        registry: i.registry || undefined,
      }));

      const messageId = await sendExecutorEmail({
        executorName: execReq.executor.name,
        executorEmail: execReq.executor.email,
        requestId: request.id,
        executorRequestId: execReq.id,
        clientCompany: request.company || request.name,
        clientInn: request.inn || undefined,
        items,
        message: request.message || undefined,
        files: request.files?.map((f) => ({ fileName: f.fileName, filePath: f.filePath })),
      });

      await prisma.executorRequest.update({
        where: { id: execReqId },
        data: {
          status: "awaiting_response",
          sentAt: new Date(),
          emailMessageId: messageId || undefined,
        },
      });

      if (request.status === "new") {
        await prisma.request.update({
          where: { id: request.id },
          data: { status: "in_progress" },
        });
      }

      const io = getIO();
      if (io && request.userId) {
        io.to(`user:${request.userId}`).emit("request-status-changed", {
          requestId: request.id,
          status: "in_progress",
        });
        io.to(`user:${request.userId}`).emit("executor-assigned", {
          requestId: request.id,
          executorName: execReq.executor.name,
          message: `По вашей заявке #${request.id} найден исполнитель и отправлен запрос`,
        });
      }

      results.push({ execReqId, success: true });
    } catch (err) {
      console.error(`Batch approve error for ${execReqId}:`, err);
      results.push({ execReqId, success: false, error: "Internal error" });
    }
  }

  return NextResponse.json({ results });
}
```

**Step 2: Verify**

Run: `npm run build`
Expected: Compiles successfully.

**Step 3: Commit**

```bash
git add src/app/api/admin/batch-approve/route.ts
git commit -m "feat: add POST /api/admin/batch-approve endpoint"
```

---

### Task 5: Create DispatchModal component

**Files:**
- Create: `src/app/admin/dispatch-modal.tsx`

**Step 1: Create the component file**

Create `src/app/admin/dispatch-modal.tsx` with the full dispatch modal:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface RequestItem {
  id: number;
  service: string;
  poverk?: string | null;
  object?: string | null;
  fabricNumber?: string | null;
  registry?: string | null;
}

interface RequestFile {
  id: number;
  fileName: string;
  filePath: string;
}

interface PendingApproval {
  execReqId: number;
  request: {
    id: number;
    service: string;
    company: string | null;
    name: string;
    inn: string | null;
    message: string | null;
    items: RequestItem[];
    files: RequestFile[];
    createdAt: string;
  };
  executor: { id: number; name: string; email: string };
  suggestedSubject: string;
}

interface AutoSent {
  requestId: number;
  service: string;
  clientName: string;
  executorName: string;
  sentAt: string;
}

interface NoExecutor {
  requestId: number;
  service: string;
  clientName: string;
  createdAt: string;
}

interface DispatchData {
  pendingApproval: PendingApproval[];
  autoSent: AutoSent[];
  noExecutor: NoExecutor[];
}

interface ExecutorOption {
  id: number;
  name: string;
  email: string;
  services: string;
}

interface DispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  getAuthHeaders: () => Record<string, string>;
  allExecutors: ExecutorOption[];
  onRefresh: () => void;
}

export default function DispatchModal({
  isOpen,
  onClose,
  getAuthHeaders,
  allExecutors,
  onRefresh,
}: DispatchModalProps) {
  const [data, setData] = useState<DispatchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editState, setEditState] = useState<Record<number, {
    executorId: number;
    subject: string;
    message: string;
  }>>({});
  const [approvingIds, setApprovingIds] = useState<Set<number>>(new Set());
  const [batchApproving, setBatchApproving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pending-dispatch", {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen, fetchData]);

  const handleApprove = async (item: PendingApproval) => {
    setApprovingIds((prev) => new Set(prev).add(item.execReqId));
    try {
      const edit = editState[item.execReqId];
      const body: Record<string, unknown> = { action: "approve-and-send" };
      if (edit) {
        if (edit.executorId !== item.executor.id) body.executorId = edit.executorId;
        if (edit.subject !== item.suggestedSubject) body.customSubject = edit.subject;
        if (edit.message) body.customMessage = edit.message;
      }

      const res = await fetch(`/api/admin/executor-request/${item.execReqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(`Заявка #${item.request.id} отправлена исполнителю`);
        setData((prev) =>
          prev
            ? { ...prev, pendingApproval: prev.pendingApproval.filter((p) => p.execReqId !== item.execReqId) }
            : null
        );
        setExpandedId(null);
      } else {
        const err = await res.json();
        toast.error(err.error || "Ошибка отправки");
      }
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setApprovingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.execReqId);
        return next;
      });
    }
  };

  const handleBatchApprove = async () => {
    if (!data || data.pendingApproval.length === 0) return;
    setBatchApproving(true);
    try {
      const ids = data.pendingApproval.map((p) => p.execReqId);
      const res = await fetch("/api/admin/batch-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ approvals: ids }),
      });
      if (res.ok) {
        const result = await res.json();
        const successCount = result.results.filter((r: { success: boolean }) => r.success).length;
        toast.success(`Одобрено: ${successCount} из ${ids.length}`);
        setData((prev) => (prev ? { ...prev, pendingApproval: [] } : null));
        onRefresh();
      } else {
        toast.error("Ошибка массового одобрения");
      }
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setBatchApproving(false);
    }
  };

  const handleSkip = (execReqId: number) => {
    setData((prev) =>
      prev
        ? { ...prev, pendingApproval: prev.pendingApproval.filter((p) => p.execReqId !== execReqId) }
        : null
    );
  };

  const toggleExpand = (item: PendingApproval) => {
    if (expandedId === item.execReqId) {
      setExpandedId(null);
    } else {
      setExpandedId(item.execReqId);
      if (!editState[item.execReqId]) {
        setEditState((prev) => ({
          ...prev,
          [item.execReqId]: {
            executorId: item.executor.id,
            subject: item.suggestedSubject,
            message: "",
          },
        }));
      }
    }
  };

  const totalItems =
    (data?.pendingApproval.length || 0) +
    (data?.autoSent.length || 0) +
    (data?.noExecutor.length || 0);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white dark:bg-dark-light rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-dark dark:text-white">
              Новые заявки {totalItems > 0 && `(${totalItems})`}
            </h2>
            <p className="text-sm text-neutral dark:text-white/50 mt-0.5">Обработайте поступившие заявки</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5 text-neutral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : !data || totalItems === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-green-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-neutral dark:text-white/50">Все заявки обработаны</p>
            </div>
          ) : (
            <>
              {/* Section 1: Pending Approval */}
              {data.pendingApproval.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-dark dark:text-white uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Ожидают подтверждения ({data.pendingApproval.length})
                  </h3>
                  <div className="space-y-3">
                    {data.pendingApproval.map((item) => {
                      const isExpanded = expandedId === item.execReqId;
                      const isApproving = approvingIds.has(item.execReqId);
                      const edit = editState[item.execReqId];

                      return (
                        <div
                          key={item.execReqId}
                          className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden"
                        >
                          {/* Card header */}
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-sm text-dark dark:text-white">
                                    Заявка #{item.request.id}
                                  </span>
                                  <span className="text-xs text-neutral dark:text-white/50">
                                    {item.request.service}
                                  </span>
                                </div>
                                <div className="text-xs text-neutral dark:text-white/50">
                                  Клиент: {item.request.company || item.request.name}
                                  {item.request.inn && ` (ИНН ${item.request.inn})`}
                                </div>
                                <div className="text-xs text-primary mt-1">
                                  Исполнитель: {edit ? allExecutors.find((e) => e.id === edit.executorId)?.name || item.executor.name : item.executor.name}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => handleApprove(item)}
                                  disabled={isApproving}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
                                >
                                  {isApproving ? (
                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  ) : (
                                    "Одобрить"
                                  )}
                                </button>
                                <button
                                  onClick={() => toggleExpand(item)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-white/10 text-dark dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                >
                                  {isExpanded ? "Свернуть" : "Изменить"}
                                </button>
                                <button
                                  onClick={() => handleSkip(item.execReqId)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral hover:text-dark dark:hover:text-white transition-colors"
                                >
                                  Пропустить
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Expanded edit section */}
                          <AnimatePresence>
                            {isExpanded && edit && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-gray-100 dark:border-white/10 overflow-hidden"
                              >
                                <div className="p-4 space-y-4">
                                  {/* Executor select */}
                                  <div>
                                    <label className="block text-xs font-semibold text-dark dark:text-white mb-1.5">
                                      Исполнитель
                                    </label>
                                    <select
                                      value={edit.executorId}
                                      onChange={(e) =>
                                        setEditState((prev) => ({
                                          ...prev,
                                          [item.execReqId]: { ...prev[item.execReqId], executorId: Number(e.target.value) },
                                        }))
                                      }
                                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    >
                                      {allExecutors.map((ex) => (
                                        <option key={ex.id} value={ex.id}>
                                          {ex.name} — {ex.email}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Items table */}
                                  {item.request.items.length > 0 && (
                                    <div>
                                      <label className="block text-xs font-semibold text-dark dark:text-white mb-1.5">
                                        Позиции заявки
                                      </label>
                                      <div className="overflow-x-auto bg-white dark:bg-dark rounded-lg border border-gray-100 dark:border-white/10">
                                        <table className="w-full text-xs">
                                          <thead>
                                            <tr className="text-left text-neutral dark:text-white/50 border-b border-gray-100 dark:border-white/10">
                                              <th className="p-2 font-medium">#</th>
                                              <th className="p-2 font-medium">Услуга</th>
                                              <th className="p-2 font-medium">Объект</th>
                                              <th className="p-2 font-medium">Зав. номер</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {item.request.items.map((ri, idx) => (
                                              <tr key={ri.id} className="border-b border-gray-50 dark:border-white/5 last:border-0">
                                                <td className="p-2 text-neutral">{idx + 1}</td>
                                                <td className="p-2 text-dark dark:text-white">{ri.service}</td>
                                                <td className="p-2 text-dark dark:text-white">{ri.object || "—"}</td>
                                                <td className="p-2 text-dark dark:text-white">{ri.fabricNumber || "—"}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}

                                  {/* Subject */}
                                  <div>
                                    <label className="block text-xs font-semibold text-dark dark:text-white mb-1.5">
                                      Тема письма
                                    </label>
                                    <input
                                      type="text"
                                      value={edit.subject}
                                      onChange={(e) =>
                                        setEditState((prev) => ({
                                          ...prev,
                                          [item.execReqId]: { ...prev[item.execReqId], subject: e.target.value },
                                        }))
                                      }
                                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                  </div>

                                  {/* Message */}
                                  <div>
                                    <label className="block text-xs font-semibold text-dark dark:text-white mb-1.5">
                                      Дополнительное сообщение
                                    </label>
                                    <textarea
                                      value={edit.message}
                                      onChange={(e) =>
                                        setEditState((prev) => ({
                                          ...prev,
                                          [item.execReqId]: { ...prev[item.execReqId], message: e.target.value },
                                        }))
                                      }
                                      rows={2}
                                      placeholder="Необязательно..."
                                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                    />
                                  </div>

                                  <button
                                    onClick={() => handleApprove(item)}
                                    disabled={isApproving}
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                  >
                                    {isApproving ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Отправка...
                                      </>
                                    ) : (
                                      <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                        Отправить исполнителю
                                      </>
                                    )}
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section 2: Auto-Sent */}
              {data.autoSent.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-dark dark:text-white uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    Автоматически отправлено ({data.autoSent.length})
                  </h3>
                  <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-xl p-4 space-y-2">
                    {data.autoSent.map((item) => (
                      <div key={item.requestId} className="flex items-center justify-between text-sm">
                        <span className="text-dark dark:text-white">
                          #{item.requestId} — {item.service} ({item.clientName})
                        </span>
                        <span className="text-xs text-green-600 dark:text-green-400">
                          → {item.executorName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 3: No Executor */}
              {data.noExecutor.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-dark dark:text-white uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    Без исполнителя ({data.noExecutor.length})
                  </h3>
                  <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/30 rounded-xl p-4 space-y-2">
                    {data.noExecutor.map((item) => (
                      <div key={item.requestId} className="flex items-center justify-between text-sm">
                        <span className="text-dark dark:text-white">
                          #{item.requestId} — {item.service} ({item.clientName})
                        </span>
                        <a
                          href={`/admin?expand=${item.requestId}`}
                          onClick={onClose}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          Назначить вручную
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {data && data.pendingApproval.length > 1 && (
          <div className="shrink-0 p-5 border-t border-gray-100 dark:border-white/10 flex items-center gap-3">
            <button
              onClick={handleBatchApprove}
              disabled={batchApproving}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {batchApproving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Одобрить все ({data.pendingApproval.length})
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-xl text-sm font-semibold border border-gray-200 dark:border-white/10 text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Закрыть
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
```

**Step 2: Verify**

Run: `npm run build`
Expected: Compiles successfully.

**Step 3: Commit**

```bash
git add src/app/admin/dispatch-modal.tsx
git commit -m "feat: create DispatchModal component for admin entry"
```

---

### Task 6: Integrate DispatchModal, toggle, and badge into admin page

**Files:**
- Modify: `src/app/admin/page.tsx`

**Step 1: Add import for DispatchModal**

At the top of `src/app/admin/page.tsx`, add:

```typescript
import DispatchModal from "./dispatch-modal";
```

**Step 2: Add state variables**

After the existing `allExecutors` state (around line ~370), add:

```typescript
const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
const [automationMode, setAutomationMode] = useState<string>("semi-auto");
const [pendingBadgeCount, setPendingBadgeCount] = useState(0);
```

**Step 3: Fetch automation mode and auto-open modal on mount**

After the existing `fetchExecutors` useEffect, add:

```typescript
  // Fetch automation mode
  useEffect(() => {
    const fetchMode = async () => {
      try {
        const res = await fetch("/api/admin/settings", {
          headers: { ...getAuthHeaders() },
        });
        if (res.ok) {
          const data = await res.json();
          setAutomationMode(data.automationMode || "semi-auto");
        }
      } catch {
        // Non-critical
      }
    };
    fetchMode();
  }, [getAuthHeaders]);

  // Auto-open dispatch modal on entry
  const didAutoOpen = useRef(false);
  useEffect(() => {
    if (didAutoOpen.current || !requests.length) return;
    didAutoOpen.current = true;
    const checkPending = async () => {
      try {
        const res = await fetch("/api/admin/pending-dispatch", {
          headers: { ...getAuthHeaders() },
        });
        if (res.ok) {
          const data = await res.json();
          const count = (data.pendingApproval?.length || 0) + (data.noExecutor?.length || 0);
          setPendingBadgeCount(count);
          if (count > 0 || (data.autoSent?.length || 0) > 0) {
            setDispatchModalOpen(true);
          }
        }
      } catch {
        // Non-critical
      }
    };
    checkPending();
  }, [requests.length, getAuthHeaders]);
```

**Step 4: Add toggle mode handler**

```typescript
  const handleToggleMode = async (mode: string) => {
    setAutomationMode(mode);
    try {
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ automationMode: mode }),
      });
      toast.success(`Режим: ${mode === "auto" ? "Автоматический" : "Полуавтоматический"}`);
    } catch {
      toast.error("Ошибка сохранения");
    }
  };
```

**Step 5: Add Socket.IO listeners for badge updates**

In the existing Socket.IO `useEffect` (where `socketRef` is used), add listeners:

```typescript
    socketRef.current.on("executor-match-found", () => {
      setPendingBadgeCount((prev) => prev + 1);
    });
    socketRef.current.on("no-executor-found", () => {
      setPendingBadgeCount((prev) => prev + 1);
    });
```

**Step 6: Add toggle and badge to toolbar**

In the toolbar JSX (near the filter/search area), add the automation toggle and badge button. Find the toolbar div that contains view mode toggle (table/kanban) and add before it:

```tsx
{/* Automation mode toggle */}
{role === "admin" && (
  <div className="flex items-center gap-2">
    <div className="flex items-center bg-gray-100 dark:bg-white/10 rounded-lg p-0.5">
      <button
        onClick={() => handleToggleMode("semi-auto")}
        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
          automationMode === "semi-auto"
            ? "bg-white dark:bg-dark shadow-sm text-dark dark:text-white"
            : "text-neutral dark:text-white/50 hover:text-dark dark:hover:text-white"
        }`}
      >
        Полуавто
      </button>
      <button
        onClick={() => handleToggleMode("auto")}
        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
          automationMode === "auto"
            ? "bg-white dark:bg-dark shadow-sm text-dark dark:text-white"
            : "text-neutral dark:text-white/50 hover:text-dark dark:hover:text-white"
        }`}
      >
        Авто
      </button>
    </div>

    {/* Dispatch badge */}
    <button
      onClick={() => setDispatchModalOpen(true)}
      className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
      title="Диспетчер заявок"
    >
      <svg className="w-5 h-5 text-neutral dark:text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {pendingBadgeCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
          {pendingBadgeCount}
        </span>
      )}
    </button>
  </div>
)}
```

**Step 7: Render DispatchModal**

Before the closing `</TooltipProvider>`, add:

```tsx
<DispatchModal
  isOpen={dispatchModalOpen}
  onClose={() => setDispatchModalOpen(false)}
  getAuthHeaders={getAuthHeaders}
  allExecutors={allExecutors}
  onRefresh={() => {
    fetchRequests();
    setPendingBadgeCount(0);
  }}
/>
```

**Step 8: Verify**

Run: `npm run build`
Expected: Compiles successfully.

**Step 9: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat: integrate dispatch modal, automation toggle, and badge into admin"
```

---

### Task 7: Final integration test and cleanup

**Files:**
- Multiple files from previous tasks

**Step 1: Full build verification**

Run: `npm run build`
Expected: Clean build, no type errors.

**Step 2: Manual test checklist**

1. Start dev server: `npm run dev`
2. Create a request as user → verify `ExecutorRequest` created with `pending_approval` (semi-auto mode)
3. Open admin panel → verify dispatch modal opens automatically
4. In modal: click "Одобрить" → verify email sent, status updates
5. In modal: click "Изменить" → change executor, subject → "Отправить" → verify
6. Toggle to "Авто" mode → create request → verify auto-sent without approval
7. Switch back to "Полуавто" → verify normal flow
8. Create request with no matching executor → verify "Без исполнителя" section in modal

**Step 3: Commit all remaining changes**

```bash
git add -A
git commit -m "feat: complete automation modes with dispatch modal"
```
