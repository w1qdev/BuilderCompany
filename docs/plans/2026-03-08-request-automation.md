# Request Automation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automate the request lifecycle — auto-find executor, send email, receive invoice via IMAP, parse amount, add markup, admin approval with invoice preview, send to client, track payment.

**Architecture:** New Prisma models (Executor, ExecutorRequest) + IMAP polling cron in server.js + executor matching lib + PDF parsing + new admin pages + public payment page. Everything embedded in the existing Next.js app.

**Tech Stack:** Prisma (SQLite), imapflow, pdf-parse, mailparser, node-cron, uuid, Next.js 14 App Router, Socket.IO, Nodemailer, shadcn/ui, Framer Motion

---

### Task 1: Prisma Schema — Executor and ExecutorRequest models

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add Executor model**

In `prisma/schema.prisma`, after the Staff model, add:

```prisma
model Executor {
  id                  Int               @id @default(autoincrement())
  name                String
  inn                 String?
  email               String
  phone               String?
  address             String?
  website             String?
  services            String            @default("[]")
  accreditationNumber String?
  active              Boolean           @default(true)
  notes               String?
  createdAt           DateTime          @default(now())
  executorRequests    ExecutorRequest[]
}

model ExecutorRequest {
  id              Int       @id @default(autoincrement())
  requestId       Int
  request         Request   @relation(fields: [requestId], references: [id], onDelete: Cascade)
  executorId      Int
  executor        Executor  @relation(fields: [executorId], references: [id])
  status          String    @default("sent")
  sentAt          DateTime?
  emailMessageId  String?
  responseEmail   String?
  invoiceFiles    String    @default("[]")
  parsedAmount    Float?
  finalAmount     Float?
  markup          Float?
  clientAmount    Float?
  approvedAt      DateTime?
  clientPaidAt    DateTime?
  executorPaidAt  DateTime?
  paymentToken    String?   @unique
  paymentProofFile String?
  createdAt       DateTime  @default(now())

  @@index([requestId])
  @@index([executorId])
  @@index([paymentToken])
  @@index([status])
}
```

**Step 2: Add relation to Request model**

In the `Request` model, add after `items RequestItem[]`:

```prisma
  executorRequests ExecutorRequest[]
```

**Step 3: Create and apply migration**

```bash
npx prisma migrate dev --name add-executor-automation
```

**Step 4: Regenerate Prisma client**

```bash
npx prisma generate
```

**Step 5: Commit**

```bash
git add prisma/
git commit -m "feat: add Executor and ExecutorRequest models for request automation"
```

---

### Task 2: Install dependencies

**Step 1: Install packages**

```bash
npm install imapflow pdf-parse mailparser node-cron uuid
npm install -D @types/mailparser @types/node-cron @types/uuid
```

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add imapflow, pdf-parse, mailparser, node-cron, uuid for automation"
```

---

### Task 3: Executor CRUD API

**Files:**
- Create: `src/app/api/admin/executors/route.ts`
- Create: `src/app/api/admin/executors/[id]/route.ts`

**Step 1: GET /api/admin/executors — list all executors**

```typescript
// src/app/api/admin/executors/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const executors = await prisma.executor.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { executorRequests: true } },
    },
  });

  return NextResponse.json({ executors });
}
```

**Step 2: POST /api/admin/executors — create executor**

In same file. Accept: `{ name, email, inn?, phone?, address?, website?, services?, accreditationNumber?, notes? }`. Validate email is present. `services` comes as a JSON string array. Only admin role can create.

```typescript
export async function POST(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, email, inn, phone, address, website, services, accreditationNumber, notes } = body;

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Название и email обязательны" }, { status: 400 });
  }

  const executor = await prisma.executor.create({
    data: {
      name: name.trim(),
      email: email.trim(),
      inn: inn?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      website: website?.trim() || null,
      services: typeof services === "string" ? services : JSON.stringify(services || []),
      accreditationNumber: accreditationNumber?.trim() || null,
      notes: notes?.trim() || null,
    },
  });

  return NextResponse.json(executor, { status: 201 });
}
```

**Step 3: PATCH /api/admin/executors/[id] — update executor**

```typescript
// src/app/api/admin/executors/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/adminAuth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAuth(req);
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, email, inn, phone, address, website, services, accreditationNumber, notes, active } = body;

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name.trim();
  if (email !== undefined) data.email = email.trim();
  if (inn !== undefined) data.inn = inn?.trim() || null;
  if (phone !== undefined) data.phone = phone?.trim() || null;
  if (address !== undefined) data.address = address?.trim() || null;
  if (website !== undefined) data.website = website?.trim() || null;
  if (services !== undefined) data.services = typeof services === "string" ? services : JSON.stringify(services);
  if (accreditationNumber !== undefined) data.accreditationNumber = accreditationNumber?.trim() || null;
  if (notes !== undefined) data.notes = notes?.trim() || null;
  if (active !== undefined) data.active = active;

  const executor = await prisma.executor.update({
    where: { id: Number(id) },
    data,
  });

  return NextResponse.json(executor);
}
```

**Step 4: DELETE /api/admin/executors/[id]**

In same file:

```typescript
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAuth(req);
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.executor.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
```

**Step 5: Commit**

```bash
git add src/app/api/admin/executors/
git commit -m "feat: add executor CRUD API routes"
```

---

### Task 4: Executor management page — /admin/executors

**Files:**
- Create: `src/app/admin/executors/page.tsx`
- Modify: `src/app/admin/layout-client.tsx`

**Step 1: Build executor management page**

Client component with:
- Stats cards: total, active, inactive
- Table: Name, Email, Services (tags), Accreditation#, Active (toggle), Requests count, Actions
- "Добавить" button → modal with form: name, email, inn, phone, address, services (tag input), accreditation#, notes
- Edit button → same modal prefilled
- Delete with confirmation
- Style matching `/admin/staff` page
- Uses `verifyAdminAuth` headers for API calls

Services input: comma-separated text field, displayed as colored tags.

**Step 2: Add nav item in layout**

In `src/app/admin/layout-client.tsx`, add to `allNavItems` array after "Сотрудники":

```typescript
{
  href: "/admin/executors",
  label: "Исполнители",
  icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  roles: ["admin"],
},
```

Also add to `breadcrumbMap`:
```typescript
"/admin/executors": "Исполнители",
```

**Step 3: Commit**

```bash
git add src/app/admin/executors/ src/app/admin/layout-client.tsx
git commit -m "feat: add executor management page and nav item"
```

---

### Task 5: Excel import for executors

**Files:**
- Create: `src/app/api/admin/executors/import/route.ts`

**Step 1: POST /api/admin/executors/import — bulk import from Excel**

Accept multipart form with Excel file. Parse with `xlsx` (already in project for other imports). Expected columns: Название, Email, ИНН, Телефон, Адрес, Услуги, Аккредитация.

```typescript
// src/app/api/admin/executors/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/adminAuth";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) {
    return NextResponse.json({ error: "Файл не загружен" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = (row["Название"] || row["name"] || "").trim();
    const email = (row["Email"] || row["email"] || "").trim();
    if (!name || !email) { skipped++; continue; }

    const servicesRaw = (row["Услуги"] || row["services"] || "").trim();
    const services = servicesRaw
      ? JSON.stringify(servicesRaw.split(",").map(s => s.trim()).filter(Boolean))
      : "[]";

    await prisma.executor.create({
      data: {
        name,
        email,
        inn: (row["ИНН"] || row["inn"] || "").trim() || null,
        phone: (row["Телефон"] || row["phone"] || "").trim() || null,
        address: (row["Адрес"] || row["address"] || "").trim() || null,
        services,
        accreditationNumber: (row["Аккредитация"] || row["accreditation"] || "").trim() || null,
      },
    });
    created++;
  }

  return NextResponse.json({ created, skipped, total: rows.length });
}
```

**Step 2: Add import button to executors page**

In `src/app/admin/executors/page.tsx`, add "Импорт из Excel" button that uploads file to this endpoint.

**Step 3: Commit**

```bash
git add src/app/api/admin/executors/import/ src/app/admin/executors/page.tsx
git commit -m "feat: add Excel import for executors"
```

---

### Task 6: Executor matching library

**Files:**
- Create: `src/lib/executorMatcher.ts`

**Step 1: Implement service matching logic**

```typescript
// src/lib/executorMatcher.ts
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

export interface MatchedExecutor {
  id: number;
  name: string;
  email: string;
}

/**
 * Find best executor for given service(s).
 * Searches Executor.services JSON array for substring matches.
 * Returns first active match, or null if none found.
 */
export async function findExecutorForService(
  serviceNames: string[]
): Promise<MatchedExecutor | null> {
  const executors = await prisma.executor.findMany({
    where: { active: true },
    select: { id: true, name: true, email: true, services: true },
  });

  for (const executor of executors) {
    let executorServices: string[];
    try {
      executorServices = JSON.parse(executor.services);
    } catch {
      continue;
    }

    const matches = serviceNames.some((requestService) =>
      executorServices.some(
        (execService) =>
          execService.toLowerCase().includes(requestService.toLowerCase()) ||
          requestService.toLowerCase().includes(execService.toLowerCase())
      )
    );

    if (matches) {
      return { id: executor.id, name: executor.name, email: executor.email };
    }
  }

  logger.info(`No executor found for services: ${serviceNames.join(", ")}`);
  return null;
}
```

**Step 2: Commit**

```bash
git add src/lib/executorMatcher.ts
git commit -m "feat: add executor matching by service"
```

---

### Task 7: Executor email template and sending

**Files:**
- Create: `src/lib/executorEmail.ts`

**Step 1: Build executor email template and send function**

```typescript
// src/lib/executorEmail.ts
import { createTransporter, type NotificationItem, resolveAttachments, generateExcelBuffer } from "@/lib/email/transport";
import { COMPANY_NAME, COMPANY_SHORT, COLORS } from "@/lib/email/constants";
import { escapeHtml } from "@/lib/email/transport";
import logger from "@/lib/logger";

interface ExecutorEmailData {
  executorName: string;
  executorEmail: string;
  requestId: number;
  executorRequestId: number;
  clientCompany: string;
  clientInn?: string;
  items: NotificationItem[];
  message?: string;
  files?: { fileName: string; filePath: string }[];
}

export async function sendExecutorEmail(data: ExecutorEmailData): Promise<string | null> {
  const result = createTransporter();
  if (!result) {
    logger.info("Email not configured, skipping executor notification");
    return null;
  }
  const { transporter, user } = result;

  const code = `[CSM-${data.requestId}-${data.executorRequestId}]`;
  const subject = `Заявка на поверку ${code} — ${data.clientCompany}`;

  const itemsHtml = data.items
    .map((item, idx) => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;text-align:center;color:#666;font-size:13px;">${idx + 1}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;font-size:13px;">${escapeHtml(item.service)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;font-size:13px;">${item.object ? escapeHtml(item.object) : '—'}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;font-size:13px;">${item.fabricNumber ? escapeHtml(item.fabricNumber) : '—'}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;font-size:13px;">${item.registry ? escapeHtml(item.registry) : '—'}</td>
      </tr>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:24px 16px;">
    <div style="background:linear-gradient(135deg,${COLORS.headerDark} 0%,${COLORS.headerDarkEnd} 100%);border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
      <h1 style="margin:0 0 6px;font-size:20px;color:#fff;font-weight:700;">Запрос на выполнение работ</h1>
      <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);">${code} &middot; ${COMPANY_SHORT}</p>
    </div>
    <div style="background:#fff;padding:24px 32px;border-left:1px solid #eee;border-right:1px solid #eee;">
      <p style="font-size:14px;color:#333;">Уважаемые коллеги,</p>
      <p style="font-size:14px;color:#555;line-height:1.6;">
        ${COMPANY_NAME} просит вас рассмотреть возможность выполнения следующих работ
        для организации <strong>${escapeHtml(data.clientCompany)}</strong>${data.clientInn ? ` (ИНН: ${escapeHtml(data.clientInn)})` : ''}.
      </p>
      ${data.message ? `<div style="background:#fafafa;border-left:3px solid ${COLORS.primary};padding:14px 18px;border-radius:0 8px 8px 0;font-size:14px;color:#444;line-height:1.6;margin:16px 0;">${escapeHtml(data.message)}</div>` : ''}
      <h2 style="margin:20px 0 12px;font-size:15px;color:#333;text-transform:uppercase;letter-spacing:0.5px;">Позиции (${data.items.length})</h2>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f9f9f9;">
              <th style="padding:10px 14px;font-size:12px;color:#888;text-align:center;border-bottom:2px solid #eee;">№</th>
              <th style="padding:10px 14px;font-size:12px;color:#888;text-align:left;border-bottom:2px solid #eee;">Услуга</th>
              <th style="padding:10px 14px;font-size:12px;color:#888;text-align:left;border-bottom:2px solid #eee;">СИ</th>
              <th style="padding:10px 14px;font-size:12px;color:#888;text-align:left;border-bottom:2px solid #eee;">Зав. №</th>
              <th style="padding:10px 14px;font-size:12px;color:#888;text-align:left;border-bottom:2px solid #eee;">Реестр</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
      </div>
      <p style="font-size:14px;color:#555;margin:24px 0 0;line-height:1.6;">
        Просим направить коммерческое предложение и счёт на оплату в ответ на это письмо.
      </p>
    </div>
    <div style="background:#f9f9fb;border-radius:0 0 16px 16px;padding:20px 32px;border:1px solid #eee;border-top:none;text-align:center;">
      <p style="margin:0;font-size:12px;color:#999;">Пожалуйста, сохраните код ${code} в теме при ответе</p>
      <p style="margin:6px 0 0;font-size:12px;color:#bbb;">${COMPANY_SHORT} — ${COMPANY_NAME}</p>
    </div>
  </div>
</body>
</html>`;

  // Build attachments (Excel + client files)
  const attachments: import("nodemailer").SendMailOptions["attachments"] = [];
  try {
    const excelBuffer = await generateExcelBuffer(data.items, data.clientCompany, data.clientInn);
    const dateStr = new Date().toISOString().split("T")[0];
    attachments.push({
      filename: `Заявка_${data.requestId}_${dateStr}.xlsx`,
      content: excelBuffer,
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  } catch (err) {
    logger.error("Failed to generate Excel for executor:", err);
  }

  if (data.files && data.files.length > 0) {
    const clientAttachments = await resolveAttachments(data.files);
    if (clientAttachments) attachments.push(...clientAttachments);
  }

  try {
    const info = await transporter.sendMail({
      from: `"${COMPANY_SHORT} — Заявки" <${user}>`,
      to: data.executorEmail,
      subject,
      html,
      attachments,
    });
    return info.messageId || null;
  } catch (error) {
    logger.error("Executor email error:", error);
    return null;
  }
}
```

**Step 2: Commit**

```bash
git add src/lib/executorEmail.ts
git commit -m "feat: add executor email template and send function"
```

---

### Task 8: ExecutorRequest API — send, approve, payment tracking

**Files:**
- Create: `src/app/api/admin/executor-request/[id]/route.ts`
- Create: `src/app/api/admin/executor-request/[id]/send/route.ts`

**Step 1: POST send/route.ts — send or resend email to executor**

Accepts `{ executorId }` (optional — if not set, auto-match). Creates ExecutorRequest record, sends email, returns the record.

```typescript
// src/app/api/admin/executor-request/[id]/send/route.ts
// [id] = requestId
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/adminAuth";
import { sendExecutorEmail } from "@/lib/executorEmail";
import { findExecutorForService } from "@/lib/executorMatcher";
import { v4 as uuidv4 } from "uuid";
import { getIO } from "@/lib/socket";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const requestId = Number(id);
  const body = await req.json().catch(() => ({}));

  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { items: true, files: true },
  });
  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  // Find executor
  let executorId = body.executorId;
  let executor;

  if (executorId) {
    executor = await prisma.executor.findUnique({ where: { id: executorId } });
  } else {
    const services = request.items.map(i => i.service);
    const matched = await findExecutorForService(services.length > 0 ? services : [request.service]);
    if (!matched) {
      return NextResponse.json({ error: "Исполнитель не найден для данной услуги" }, { status: 404 });
    }
    executor = await prisma.executor.findUnique({ where: { id: matched.id } });
  }

  if (!executor || !executor.active) {
    return NextResponse.json({ error: "Исполнитель не найден или неактивен" }, { status: 404 });
  }

  // Create ExecutorRequest
  const executorRequest = await prisma.executorRequest.create({
    data: {
      requestId,
      executorId: executor.id,
      status: "awaiting_response",
      sentAt: new Date(),
      paymentToken: uuidv4(),
    },
  });

  // Send email
  const items = request.items.map(i => ({
    service: i.service,
    poverk: i.poverk,
    object: i.object,
    fabricNumber: i.fabricNumber,
    registry: i.registry,
  }));

  const messageId = await sendExecutorEmail({
    executorName: executor.name,
    executorEmail: executor.email,
    requestId,
    executorRequestId: executorRequest.id,
    clientCompany: request.company || request.name,
    clientInn: request.inn || undefined,
    items,
    message: request.message || undefined,
    files: request.files?.map(f => ({ fileName: f.fileName, filePath: f.filePath })),
  });

  // Update with message ID
  if (messageId) {
    await prisma.executorRequest.update({
      where: { id: executorRequest.id },
      data: { emailMessageId: messageId },
    });
  }

  // Update request status to in_progress
  if (request.status === "new") {
    await prisma.request.update({
      where: { id: requestId },
      data: { status: "in_progress" },
    });
    const io = getIO();
    if (io) {
      io.emit("request-update", { id: requestId, status: "in_progress" });
    }
  }

  return NextResponse.json({
    executorRequest: { ...executorRequest, emailMessageId: messageId },
    executor,
  });
}
```

**Step 2: PATCH route.ts — approve, send-to-client, mark-paid**

```typescript
// src/app/api/admin/executor-request/[id]/route.ts
// [id] = executorRequestId
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/adminAuth";
import { sendStatusUpdateEmail } from "@/lib/email";
import { getIO } from "@/lib/socket";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action, finalAmount, markup } = body;

  const execReq = await prisma.executorRequest.findUnique({
    where: { id: Number(id) },
    include: { request: true, executor: true },
  });
  if (!execReq) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};

  switch (action) {
    case "update-pricing": {
      if (finalAmount !== undefined) data.finalAmount = Number(finalAmount);
      if (markup !== undefined) data.markup = Number(markup);
      const fa = finalAmount !== undefined ? Number(finalAmount) : execReq.finalAmount;
      const mk = markup !== undefined ? Number(markup) : execReq.markup;
      if (fa != null && mk != null) {
        data.clientAmount = fa * (1 + mk / 100);
      }
      break;
    }

    case "approve": {
      data.status = "approved";
      data.approvedAt = new Date();
      if (finalAmount !== undefined) data.finalAmount = Number(finalAmount);
      if (markup !== undefined) data.markup = Number(markup);
      const fa2 = finalAmount !== undefined ? Number(finalAmount) : execReq.finalAmount;
      const mk2 = markup !== undefined ? Number(markup) : execReq.markup;
      if (fa2 != null && mk2 != null) {
        data.clientAmount = fa2 * (1 + mk2 / 100);
      }
      // Also update Request pricing fields for backwards compat
      await prisma.request.update({
        where: { id: execReq.requestId },
        data: {
          executorPrice: fa2,
          markup: mk2,
          clientPrice: fa2 != null && mk2 != null ? fa2 * (1 + mk2 / 100) : null,
        },
      });
      break;
    }

    case "send-to-client": {
      data.status = "sent_to_client";
      // Update request status to pending_payment
      await prisma.request.update({
        where: { id: execReq.requestId },
        data: { status: "pending_payment" },
      });
      // Send email to client with invoice and payment link
      const paymentUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://csm-center.ru"}/payment/${execReq.paymentToken}`;
      sendStatusUpdateEmail({
        name: execReq.request.name,
        email: execReq.request.email,
        requestId: execReq.requestId,
        status: "pending_payment",
        adminNotes: `Сумма к оплате: ${execReq.clientAmount?.toLocaleString("ru-RU")} ₽\n\nОплатить: ${paymentUrl}`,
      }).catch(console.error);
      const io = getIO();
      if (io) {
        io.emit("request-update", { id: execReq.requestId, status: "pending_payment" });
      }
      break;
    }

    case "mark-client-paid": {
      data.status = "client_paid";
      data.clientPaidAt = new Date();
      await prisma.request.update({
        where: { id: execReq.requestId },
        data: { status: "review" },
      });
      const io2 = getIO();
      if (io2) {
        io2.emit("request-update", { id: execReq.requestId, status: "review" });
        io2.to("admin").emit("executor-payment-reminder", {
          requestId: execReq.requestId,
          executorName: execReq.executor.name,
          amount: execReq.finalAmount,
        });
      }
      break;
    }

    case "mark-executor-paid": {
      data.status = "executor_paid";
      data.executorPaidAt = new Date();
      await prisma.request.update({
        where: { id: execReq.requestId },
        data: { status: "done" },
      });
      const io3 = getIO();
      if (io3) {
        io3.emit("request-update", { id: execReq.requestId, status: "done" });
      }
      break;
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const updated = await prisma.executorRequest.update({
    where: { id: Number(id) },
    data,
    include: { executor: true },
  });

  return NextResponse.json(updated);
}

// GET — get executor requests for a given request
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const execReqs = await prisma.executorRequest.findMany({
    where: { requestId: Number(id) },
    include: { executor: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ executorRequests: execReqs });
}
```

**Step 3: Commit**

```bash
git add src/app/api/admin/executor-request/
git commit -m "feat: add executor request API — send, approve, payment tracking"
```

---

### Task 9: Invoice PDF parser

**Files:**
- Create: `src/lib/invoiceParser.ts`

**Step 1: Implement PDF amount extraction**

```typescript
// src/lib/invoiceParser.ts
import logger from "@/lib/logger";

/**
 * Try to extract total amount from PDF buffer.
 * Looks for patterns like "Итого: 10 500,00", "Сумма: 10500.00", "К оплате 10 500 руб."
 * Returns parsed number or null if not found/not confident.
 */
export async function parseInvoiceAmount(pdfBuffer: Buffer): Promise<number | null> {
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(pdfBuffer);
    const text = data.text;

    // Patterns ordered by specificity (most specific first)
    const patterns = [
      /(?:итого|к\s*оплате|всего|сумма\s*к\s*оплате|общая\s*сумма)[:\s]*(\d[\d\s]*[.,]\d{2})/gi,
      /(?:итого|к\s*оплате|всего)[:\s]*(\d[\d\s]+)\s*(?:руб|₽|р\.)/gi,
      /(?:итого|к\s*оплате|всего)[:\s]*(\d[\d\s]*[.,]?\d*)/gi,
    ];

    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        // Take the last match (usually the grand total)
        const lastMatch = matches[matches.length - 1];
        const rawAmount = lastMatch[1]
          .replace(/\s/g, "")
          .replace(",", ".");
        const amount = parseFloat(rawAmount);
        if (!isNaN(amount) && amount > 0 && amount < 100_000_000) {
          logger.info(`Parsed invoice amount: ${amount}`);
          return amount;
        }
      }
    }

    logger.info("Could not parse amount from PDF");
    return null;
  } catch (error) {
    logger.error("PDF parse error:", error);
    return null;
  }
}
```

**Step 2: Commit**

```bash
git add src/lib/invoiceParser.ts
git commit -m "feat: add PDF invoice amount parser"
```

---

### Task 10: IMAP polling service

**Files:**
- Create: `src/lib/imap.ts`

**Step 1: Implement IMAP polling logic**

```typescript
// src/lib/imap.ts
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { prisma } from "@/lib/prisma";
import { parseInvoiceAmount } from "@/lib/invoiceParser";
import { getIO } from "@/lib/socket";
import logger from "@/lib/logger";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

interface ImapConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

function getImapConfig(): ImapConfig | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return {
    host,
    port: 993,
    user,
    pass,
  };
}

/**
 * Match incoming email to an ExecutorRequest.
 * Strategy 1: Parse [CSM-{requestId}-{executorRequestId}] from subject
 * Strategy 2: Match sender email to Executor table + active awaiting_response
 */
async function matchEmail(
  subject: string,
  senderEmail: string
): Promise<{ executorRequestId: number } | null> {
  // Strategy 1: code in subject
  const codeMatch = subject.match(/\[CSM-(\d+)-(\d+)\]/);
  if (codeMatch) {
    const executorRequestId = parseInt(codeMatch[2]);
    const execReq = await prisma.executorRequest.findUnique({
      where: { id: executorRequestId },
    });
    if (execReq && execReq.status === "awaiting_response") {
      return { executorRequestId };
    }
  }

  // Strategy 2: sender email → Executor → active ExecutorRequest
  const executor = await prisma.executor.findFirst({
    where: { email: senderEmail.toLowerCase(), active: true },
  });
  if (executor) {
    const execReq = await prisma.executorRequest.findFirst({
      where: {
        executorId: executor.id,
        status: "awaiting_response",
      },
      orderBy: { createdAt: "desc" },
    });
    if (execReq) {
      return { executorRequestId: execReq.id };
    }
  }

  return null;
}

export async function pollIncomingEmails(): Promise<void> {
  const config = getImapConfig();
  if (!config) {
    logger.info("IMAP not configured, skipping poll");
    return;
  }

  // Check if IMAP polling is enabled in settings
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "imapEnabled" },
    });
    if (setting && setting.value !== "true") {
      return;
    }
  } catch {
    // If setting doesn't exist, default to enabled
  }

  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: true,
    auth: { user: config.user, pass: config.pass },
    logger: false,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      // Search for unseen messages
      const messages = client.fetch({ seen: false }, {
        source: true,
        envelope: true,
        uid: true,
      });

      for await (const msg of messages) {
        try {
          const parsed = await simpleParser(msg.source);
          const subject = parsed.subject || "";
          const senderEmail = parsed.from?.value?.[0]?.address || "";

          const match = await matchEmail(subject, senderEmail);
          if (!match) {
            // Mark as seen and skip
            await client.messageFlagsAdd({ uid: msg.uid }, ["\\Seen"], { uid: true });
            continue;
          }

          // Save attachments
          const invoiceDir = path.join(process.cwd(), "uploads", "invoices", String(match.executorRequestId));
          await mkdir(invoiceDir, { recursive: true });
          const savedFiles: string[] = [];
          let parsedAmount: number | null = null;

          if (parsed.attachments && parsed.attachments.length > 0) {
            for (const att of parsed.attachments) {
              const safeName = att.filename?.replace(/[^a-zA-Zа-яА-Я0-9._-]/g, "_") || `attachment_${Date.now()}`;
              const filePath = path.join(invoiceDir, safeName);
              await writeFile(filePath, att.content);
              savedFiles.push(`invoices/${match.executorRequestId}/${safeName}`);

              // Try to parse PDF for amount
              if (att.contentType === "application/pdf" && !parsedAmount) {
                parsedAmount = await parseInvoiceAmount(att.content);
              }
            }
          }

          // Update ExecutorRequest
          const newStatus = parsedAmount ? "invoice_parsed" : "response_received";
          const updated = await prisma.executorRequest.update({
            where: { id: match.executorRequestId },
            data: {
              status: newStatus,
              responseEmail: parsed.text?.substring(0, 5000) || null,
              invoiceFiles: JSON.stringify(savedFiles),
              parsedAmount,
              finalAmount: parsedAmount, // Pre-fill, admin can edit
            },
            include: { request: true, executor: true },
          });

          // Emit Socket.IO notification to admin
          const io = getIO();
          if (io) {
            io.to("admin").emit("executor-response", {
              executorRequestId: updated.id,
              requestId: updated.requestId,
              executorName: updated.executor.name,
              status: newStatus,
              parsedAmount,
              hasAttachments: savedFiles.length > 0,
            });
          }

          logger.info(`IMAP: matched email to ExecutorRequest #${match.executorRequestId}, status → ${newStatus}`);

          // Mark as seen
          await client.messageFlagsAdd({ uid: msg.uid }, ["\\Seen"], { uid: true });
        } catch (msgError) {
          logger.error("IMAP: error processing message:", msgError);
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (error) {
    logger.error("IMAP polling error:", error);
    try { await client.logout(); } catch { /* ignore */ }
  }
}
```

**Step 2: Commit**

```bash
git add src/lib/imap.ts
git commit -m "feat: add IMAP polling service for executor responses"
```

---

### Task 11: Wire IMAP cron into server.js

**Files:**
- Modify: `server.js`

**Step 1: Add IMAP polling cron job**

After the verification reminder block (line ~114), add:

```javascript
  // IMAP polling for executor responses (every 2 minutes)
  const runImapPoll = async () => {
    try {
      const imapModule = await import("./src/lib/imap.ts").catch(() => null);
      if (imapModule && imapModule.pollIncomingEmails) {
        await imapModule.pollIncomingEmails();
      }
    } catch (err) {
      console.error("IMAP poll error:", err);
    }
  };

  // Run IMAP poll after 60s startup delay, then every 2 minutes
  setTimeout(runImapPoll, 60000);
  setInterval(runImapPoll, 2 * 60 * 1000);
```

**Step 2: Commit**

```bash
git add server.js
git commit -m "feat: add IMAP polling cron job to server.js"
```

---

### Task 12: Auto-match executor on request submission

**Files:**
- Modify: `src/app/api/submit/route.ts`

**Step 1: After request creation, auto-find and email executor**

After the `io.emit("new-request", request)` block (~line 184), add:

```typescript
    // Auto-find executor and send email (non-blocking)
    (async () => {
      try {
        const { findExecutorForService } = await import("@/lib/executorMatcher");
        const services = serviceItems.map(i => i.service);
        const matched = await findExecutorForService(services);
        if (!matched) return;

        const { v4: uuidv4 } = await import("uuid");
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

        // Auto-advance status
        await prisma.request.update({
          where: { id: request.id },
          data: { status: "in_progress" },
        });
      } catch (err) {
        console.error("Auto executor match error:", err);
      }
    })();
```

**Step 2: Commit**

```bash
git add src/app/api/submit/route.ts
git commit -m "feat: auto-match executor and send email on request submission"
```

---

### Task 13: Executor block in admin request card

**Files:**
- Modify: `src/app/admin/page.tsx`

**Step 1: Add executor data fetching**

Add state for executor requests per expanded request. When a request card is expanded, fetch `/api/admin/executor-request/{requestId}` to get executor request data.

Add new state:
```typescript
const [executorData, setExecutorData] = useState<Record<number, {
  executorRequests: Array<{
    id: number;
    status: string;
    executor: { id: number; name: string; email: string };
    parsedAmount: number | null;
    finalAmount: number | null;
    markup: number | null;
    clientAmount: number | null;
    invoiceFiles: string;
    sentAt: string | null;
    approvedAt: string | null;
    clientPaidAt: string | null;
    executorPaidAt: string | null;
    paymentToken: string | null;
  }>;
}>>({});
```

Fetch when `expandedId` changes.

**Step 2: Build executor section UI**

Inside the expanded request card, after the existing pricing section, add:

- Executor select dropdown (from `executors` list fetched on mount)
- "Отправить исполнителю" button → POST to send endpoint
- If ExecutorRequest exists: show status badge, response info, invoice files
- Parsed amount field (pre-filled, editable)
- Markup selector (5-30% presets)
- Client amount (auto-calculated, shown)
- "Согласовать" button → PATCH with action "approve"
- "Отправить счёт клиенту" button → PATCH with action "send-to-client"
- "Клиент оплатил" button → PATCH with action "mark-client-paid"
- "Оплачено исполнителю" button → PATCH with action "mark-executor-paid"

Each button only visible at the appropriate status step.

**Step 3: Add Socket.IO listener for executor events**

Listen for `executor-response` event to show toast notification and refresh data.

**Step 4: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat: add executor automation block to admin request card"
```

---

### Task 14: Public payment confirmation page

**Files:**
- Create: `src/app/payment/[token]/page.tsx`
- Create: `src/app/api/payment/[token]/route.ts`

**Step 1: GET /api/payment/[token] — get payment info**

```typescript
// src/app/api/payment/[token]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const execReq = await prisma.executorRequest.findUnique({
    where: { paymentToken: token },
    include: {
      request: { select: { id: true, name: true, service: true, company: true } },
      executor: { select: { name: true } },
    },
  });

  if (!execReq) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  return NextResponse.json({
    requestId: execReq.requestId,
    service: execReq.request.service,
    company: execReq.request.company || execReq.request.name,
    clientAmount: execReq.clientAmount,
    status: execReq.status,
    executorName: execReq.executor.name,
  });
}
```

**Step 2: POST /api/payment/[token] — confirm payment**

```typescript
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const execReq = await prisma.executorRequest.findUnique({
    where: { paymentToken: token },
  });

  if (!execReq || execReq.status !== "sent_to_client") {
    return NextResponse.json({ error: "Недоступно" }, { status: 400 });
  }

  // Handle file upload (payment proof)
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  let proofPath: string | null = null;

  if (file) {
    const { writeFile, mkdir } = await import("fs/promises");
    const path = await import("path");
    const dir = path.join(process.cwd(), "uploads", "payment-proofs");
    await mkdir(dir, { recursive: true });
    const safeName = file.name.replace(/[^a-zA-Zа-яА-Я0-9._-]/g, "_");
    const filePath = path.join(dir, `${execReq.id}_${safeName}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    proofPath = `payment-proofs/${execReq.id}_${safeName}`;
  }

  const updated = await prisma.executorRequest.update({
    where: { id: execReq.id },
    data: {
      status: "client_paid",
      clientPaidAt: new Date(),
      paymentProofFile: proofPath,
    },
  });

  // Update request status
  await prisma.request.update({
    where: { id: execReq.requestId },
    data: { status: "review" },
  });

  // Notify admin
  const { getIO } = await import("@/lib/socket");
  const io = getIO();
  if (io) {
    io.to("admin").emit("client-payment-received", {
      requestId: execReq.requestId,
      executorRequestId: execReq.id,
    });
  }

  return NextResponse.json({ success: true });
}
```

**Step 3: Build payment page UI**

```typescript
// src/app/payment/[token]/page.tsx
// Client component — public, no auth required
// Shows: service info, amount, download invoice, upload payment proof, confirm button
// After confirmation: success message
```

Style: clean card layout, company branding, drag & drop file upload area, prominent CTA button.

**Step 4: Commit**

```bash
git add src/app/payment/ src/app/api/payment/
git commit -m "feat: add public payment confirmation page"
```

---

### Task 15: Automation settings tab in admin

**Files:**
- Modify: `src/app/admin/settings/page.tsx`
- Modify: `src/app/api/admin/settings/route.ts`

**Step 1: Add automation setting keys to API**

In `src/app/api/admin/settings/route.ts`, add to the key arrays:

```typescript
const AUTOMATION_BOOL_KEYS = ["imapEnabled"];
const AUTOMATION_STRING_KEYS = ["imapCheckInterval", "defaultMarkup"];
```

Include these in GET/PUT handlers alongside existing keys.

**Step 2: Add "Автоматизация" tab**

In settings page, add new tab `automation` with:
- Toggle: "IMAP-поллинг входящей почты" (on/off)
- Select: "Интервал проверки" (2 мин / 5 мин / 10 мин)
- Input: "Наценка по умолчанию (%)" (number, default 20)
- Button: "Проверить IMAP-подключение" — calls a test endpoint
- Info box: "Используется ящик из SMTP-настроек (SMTP_USER)"

**Step 3: Commit**

```bash
git add src/app/admin/settings/page.tsx src/app/api/admin/settings/route.ts
git commit -m "feat: add automation settings tab with IMAP controls"
```

---

### Task 16: Final integration and cleanup

**Files:**
- Modify: `TODO.md`

**Step 1: Update TODO.md**

Mark the automation item as completed:
```
[+] ВАЖНО: Автоматизация процесса заявок — поиск исполнителей, отправка писем, IMAP-поллинг, парсинг счетов, наценка, согласование, оплата
```

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add TODO.md
git commit -m "docs: mark request automation as completed in TODO"
```

---

## Execution Order

```
Task 1 (Schema) → Task 2 (Deps) → Task 3 (Executor API) → Task 4 (Executor page)
                                                                    ↓
Task 5 (Excel import) ─────────────────────────────────────────────┤
Task 6 (Matcher) → Task 7 (Executor email) → Task 8 (ExecReq API) ┤
Task 9 (PDF parser) → Task 10 (IMAP) → Task 11 (server.js cron)   ┤
                                                                    ↓
Task 12 (Auto-match in submit) ────────────────────────────────────┤
Task 13 (Admin UI block) ─────────────────────────────────────────┤
Task 14 (Payment page) ───────────────────────────────────────────┤
Task 15 (Settings tab) ───────────────────────────────────────────┤
                                                                    ↓
                                                            Task 16 (Cleanup)
```

**Parallelizable batches:**
- Batch 1: Tasks 1-2 (schema + deps)
- Batch 2: Tasks 3-5 (executor CRUD + page + import)
- Batch 3: Tasks 6-11 (matching + email + PDF + IMAP, sequential)
- Batch 4: Tasks 12-15 (integration, can be parallelized)
- Batch 5: Task 16 (cleanup)
