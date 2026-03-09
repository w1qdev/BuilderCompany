# Automation Modes — Design Document

> **Date:** 2026-03-09
> **Status:** Approved

## Goal

Add two automation modes for request-to-executor dispatch: **semi-automatic** (admin confirms before sending) and **automatic** (system sends immediately). Plus a dispatch modal that appears when admin enters the admin panel, showing pending requests that need attention.

## 1. Two Automation Modes

### Toggle
On the admin requests page toolbar — pill-toggle next to filters:
- **Semi-auto** (default): system finds executor → `pending_approval` → admin confirms
- **Auto**: system finds executor → sends email immediately → `awaiting_response`

Stored in `Setting` model: key `automationMode`, values `semi-auto` / `auto`.

### Behavior on Request Creation

| | Semi-auto | Auto |
|---|---|---|
| Executor found | `ExecutorRequest` → `pending_approval` | `ExecutorRequest` → `awaiting_response`, email sent, request → `in_progress` |
| Executor NOT found | No `ExecutorRequest`, request stays `new` | Same — request stays `new` |

Both modes emit Socket.IO events to admin for real-time badge updates.

## 2. Dispatch Modal

### When it Appears
On first load of `/admin` — if there are unprocessed items:
- **Semi-auto**: requests with `ExecutorRequest.status = pending_approval`
- **Auto**: recently auto-sent (since admin's last dispatch view) + requests with no executor match
- Nothing pending → modal doesn't appear

Admin can close and reopen via badge button in toolbar (shows count of pending items).

### Structure

```
┌─────────────────────────────────────────────────────┐
│  Новые заявки (5)                              [X]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Section 1: Pending Approval]                      │
│  ┌─ Request #45 — Поверка ────────────────────┐    │
│  │ Client: ООО "Рога" (INN 1234567890)        │    │
│  │ Executor: ООО "МетроСервис"                │    │
│  │ [Одобрить] [Изменить ▾] [Пропустить]       │    │
│  └────────────────────────────────────────────┘    │
│                                                     │
│  [Section 2: Auto-Sent (informational)]             │
│  ✓ Автоматически отправлено: 2 заявки               │
│    #43 → ООО "МетроСервис"                          │
│    #44 → АО "Калибр"                                │
│                                                     │
│  [Section 3: No Executor Found]                     │
│  ⚠ Не найден исполнитель: 1 заявка                  │
│    #47 — "Аттестация ИО"  [Назначить вручную]       │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [Одобрить все (3)]                    [Закрыть]    │
└─────────────────────────────────────────────────────┘
```

### "Изменить" — Expanded View
Card expands inline inside modal:
- Executor dropdown (all active executors)
- Email subject (editable, pre-filled)
- Additional message (textarea)
- Request items table (read-only)
- Buttons: "Отправить" / "Отмена"

### "Одобрить все"
Batch approve all `pending_approval` with default executors and subjects.

## 3. Data Flow & API

### Submit Route Changes
Reads `automationMode` from Setting:
- `semi-auto` → creates `ExecutorRequest` with `pending_approval`
- `auto` → creates `ExecutorRequest`, sends email, status `awaiting_response`, request → `in_progress`
- No executor found → request stays `new`, no `ExecutorRequest`

### New Endpoints

**`GET /api/admin/pending-dispatch`**
Returns data for the dispatch modal:
```json
{
  "pendingApproval": [
    {
      "execReqId": 1,
      "request": { "id": 45, "service": "Поверка", "company": "ООО Рога" },
      "executor": { "id": 3, "name": "МетроСервис", "email": "..." },
      "suggestedSubject": "Заявка на поверку [CSM-45-1] — ООО Рога"
    }
  ],
  "autoSent": [
    { "requestId": 43, "executorName": "МетроСервис", "sentAt": "..." }
  ],
  "noExecutor": [
    { "requestId": 47, "service": "Аттестация ИО" }
  ]
}
```

**`POST /api/admin/batch-approve`**
Mass approval — accepts array of `execReqId`:
```json
{ "approvals": [1, 2, 3] }
```
For each: sends email, updates status → `awaiting_response`.

### Existing Endpoints
- `PATCH /api/admin/executor-request/[id]` with `approve-and-send` — single approval with editing (already implemented)
- `GET/PUT /api/admin/settings` — adds `automationMode` key

### Socket.IO Events
- `executor-match-found` → admin (already exists) — updates badge
- `auto-dispatched` → admin — when auto-sent (for informational block)
- `no-executor-found` → admin — when no executor matched

### Admin Last Visit Tracking
`Setting` key `adminLastDispatchView` — timestamp. Updated when modal opens. Auto-sent requests after this timestamp shown as "new".

## 4. UI Components

### Toggle in Toolbar
Pill-toggle: `[◉ Полуавто] [  Авто  ]`
On change → `PUT /api/admin/settings`. Toast confirmation.

### Badge in Toolbar
Icon button with counter badge. Count = `pending_approval` + `noExecutor`. Updates via Socket.IO in real-time.

### DispatchModal Component
Separate file: `src/app/admin/dispatch-modal.tsx`
- Props: `isOpen`, `onClose`, `authHeaders`, callbacks
- Fetches `/api/admin/pending-dispatch` on open
- Three sections: pending approval, auto-sent, no-executor
- Expandable cards on "Изменить"
- "Одобрить все" calls `/api/admin/batch-approve`

### Auto-open on Entry
In `admin/page.tsx` — `useEffect` on first render:
1. Fetch `/api/admin/pending-dispatch`
2. If data present → open modal
3. Can reopen via badge button

### Styling
Matches existing: `rounded-2xl`, `shadow-2xl`, `max-w-3xl`, `max-h-[85vh]` scroll.
- Pending: amber accents
- Auto-sent: green accents
- No executor: rose accents

## 5. File Changes

### New Files
- `src/app/admin/dispatch-modal.tsx`
- `src/app/api/admin/pending-dispatch/route.ts`
- `src/app/api/admin/batch-approve/route.ts`

### Modified Files
- `src/app/api/submit/route.ts` — read `automationMode`, branch logic
- `src/app/admin/page.tsx` — toggle, badge, auto-open modal
- `src/app/api/admin/settings/route.ts` — support `automationMode` key

### No Changes
- `prisma/schema.prisma` — no new models needed
- `server.js` — IMAP cron already works
