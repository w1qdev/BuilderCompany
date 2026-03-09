# Request Automation — Design Document

> **Date:** 2026-03-08
> **Status:** Approved

## Goal

Automate the verification/calibration request lifecycle: auto-find executor company, send email, receive response with invoice via IMAP, parse amount, add markup, admin approval with invoice preview, send to client, track payment, pay executor.

## Architecture: Embedded Module (Approach A)

Everything inside the existing Next.js app + custom server.js. IMAP polling via node-cron alongside Socket.IO.

---

## 1. Data Models

### Executor (company directory)

```prisma
model Executor {
  id                  Int               @id @default(autoincrement())
  name                String
  inn                 String?
  email               String
  phone               String?
  address             String?
  website             String?
  services            String            @default("[]") // JSON array of service names
  accreditationNumber String?
  active              Boolean           @default(true)
  notes               String?
  createdAt           DateTime          @default(now())
  executorRequests    ExecutorRequest[]
}
```

### ExecutorRequest (request ↔ executor link)

```prisma
model ExecutorRequest {
  id              Int       @id @default(autoincrement())
  requestId       Int
  request         Request   @relation(fields: [requestId], references: [id], onDelete: Cascade)
  executorId      Int
  executor        Executor  @relation(fields: [executorId], references: [id])
  status          String    @default("sent")
  // "sent" | "awaiting_response" | "response_received" | "invoice_parsed" | "approved" | "sent_to_client" | "client_paid" | "executor_paid"
  sentAt          DateTime?
  emailMessageId  String?   // Message-ID header for IMAP matching
  responseEmail   String?   // response body text
  invoiceFiles    String    @default("[]") // JSON array of file paths
  parsedAmount    Float?    // auto-parsed from PDF
  finalAmount     Float?    // admin-editable
  markup          Float?    // percentage
  clientAmount    Float?    // finalAmount * (1 + markup/100)
  approvedAt      DateTime?
  clientPaidAt    DateTime?
  executorPaidAt  DateTime?
  paymentToken    String?   @unique // for public payment confirmation link
  createdAt       DateTime  @default(now())

  @@index([requestId])
  @@index([executorId])
  @@index([paymentToken])
  @@index([status])
}
```

Request model unchanged — automation logic lives in ExecutorRequest.

---

## 2. IMAP Polling & Email Matching

### Mechanism

Cron job in server.js (every 2 minutes):

1. Connect to IMAP using same SMTP credentials (zakaz@csm-center.ru)
2. Read unread messages from INBOX
3. For each message:
   - Search subject for `[CSM-{requestId}-{executorRequestId}]` → exact match
   - If not found → match sender email against Executor table → find active ExecutorRequest with status `awaiting_response`
   - No match → mark read, ignore
4. On match:
   - Save body to `responseEmail`
   - Extract attachments (PDF, DOCX, images) → `uploads/invoices/`
   - Try pdf-parse: regex for "Итого", "Сумма", "К оплате" + number → `parsedAmount`
   - Status → `response_received` or `invoice_parsed` (if amount found)
   - Emit Socket.IO `executor-response` event
   - Send admin notification (email/Telegram/MAX)

### Outgoing email subject format

```
Заявка на поверку [CSM-123-1] — ООО "Рога и копыта"
```

Where 123 = Request.id, 1 = ExecutorRequest.id.

---

## 3. Workflow

```
Client creates request (Request: new)
    ↓
System auto-finds executor by service match
    ↓
Sends email to executor (ExecutorRequest: sent → awaiting_response)
Request status auto → in_progress
    ↓
IMAP catches response with invoice (ExecutorRequest: response_received/invoice_parsed)
    ↓
Admin sees notification, opens request card:
  - Sees attached invoice PDF
  - Sees parsed amount (or enters manually)
  - Edits finalAmount, sets markup
  - clientAmount auto-calculated
  - Clicks "Согласовать" (ExecutorRequest: approved)
    ↓
Admin sees client invoice preview, can edit
  - Clicks "Отправить клиенту"
  - (ExecutorRequest: sent_to_client, Request: pending_payment)
  - Client gets email with invoice + payment confirmation link
    ↓
Client visits /payment/{token}
  - Sees amount, downloads invoice
  - Uploads payment proof
  - Clicks "Подтвердить оплату"
  - (ExecutorRequest: client_paid, Request: review)
    ↓
System notifies admin: "Client paid, pay executor X ₽"
  - Admin pays and clicks "Оплачено исполнителю"
  - (ExecutorRequest: executor_paid, Request: done)
```

### Auto-matching executor

1. Take service from Request.service / RequestItem.service
2. Search Executor.services JSON array for substring match
3. Multiple matches → pick first active (priorities/ratings later)
4. No match → Request stays `new`, admin notified "No executor found for service X"

### Manual override

Admin can always: pick/change executor, resend email, skip automation entirely.

---

## 4. UI/UX

### 4.1. Executor directory `/admin/executors`

- Table: name, email, services (tags), accreditation, active toggle, request count
- "Add" button → modal form
- Excel import button
- Edit inline or modal
- Style: matches existing `/admin/staff`

### 4.2. Request card — executor block

New collapsible block "Исполнитель" in expanded request card:

- Executor select dropdown + "Отправить" button
- Status indicator with timestamp
- Attached invoice files with download
- Parsed amount (editable), markup presets (5-30%), client amount (auto-calc)
- "Согласовать и создать счёт" button → invoice preview modal → "Отправить клиенту"

### 4.3. Payment confirmation page `/payment/[token]`

Public page (no auth, token-based):
- Request info (service, amount)
- Download invoice PDF
- Upload payment proof (drag & drop)
- "Подтвердить оплату" button

### 4.4. Admin notifications (Socket.IO)

- "Получен ответ от исполнителя по заявке #123"
- "Клиент оплатил заявку #123"
- "Напоминание: оплатите исполнителю по заявке #123"

### 4.5. Settings — "Автоматизация" tab

- IMAP polling on/off toggle
- Check interval (2/5/10 min)
- Default markup %
- "Test connection" button

---

## 5. Tech Stack

### New packages
- `imapflow` — IMAP client
- `pdf-parse` — PDF text extraction
- `node-cron` — scheduler in server.js
- `mailparser` — MIME email parsing
- `uuid` — payment token generation

### New files
```
src/app/api/admin/executors/route.ts          — GET, POST
src/app/api/admin/executors/[id]/route.ts     — PATCH, DELETE
src/app/api/admin/executors/import/route.ts   — Excel import
src/app/api/admin/executor-request/[id]/route.ts   — PATCH (approve, send-to-client, mark-paid)
src/app/api/admin/executor-request/[id]/send/route.ts — POST (send/resend to executor)
src/app/api/payment/[token]/route.ts          — GET info, POST confirm
src/app/admin/executors/page.tsx              — executor directory
src/app/payment/[token]/page.tsx              — payment confirmation page
src/lib/imap.ts                               — IMAP polling logic
src/lib/invoiceParser.ts                      — PDF amount parsing
src/lib/executorMatcher.ts                    — executor matching by service
src/lib/executorEmail.ts                      — executor email template
```

### Modified files
- `prisma/schema.prisma` — Executor, ExecutorRequest models
- `src/app/api/submit/route.ts` — auto-match + send after request creation
- `src/app/admin/page.tsx` — executor block in request card
- `src/app/admin/settings/page.tsx` — "Автоматизация" tab
- `src/app/api/admin/settings/route.ts` — IMAP setting keys
- `server.js` — IMAP cron job
- `src/app/admin/layout-client.tsx` — add "Исполнители" nav item
