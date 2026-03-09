# Admin Operations: Staff, Kanban, Templates — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add staff accounts with limited access, kanban board with drag & drop, and editable email templates per status to the admin panel.

**Architecture:** New `Staff` model with bcrypt auth replaces the single admin password. Login form on /admin detects role (admin vs staff). Kanban uses `@dnd-kit/core` for drag & drop in the existing view toggle. Email templates stored in `Setting` model, editable in settings page.

**Tech Stack:** Prisma (SQLite), Next.js 14 App Router, @dnd-kit/core, bcrypt, Socket.IO, Framer Motion, shadcn/ui, Nodemailer

---

### Task 1: Prisma Schema — Staff model + assigneeId migration

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add Staff model and update Request**

In `prisma/schema.prisma`, add the Staff model and change `assignee String?` to `assigneeId Int?` with a relation:

```prisma
model Staff {
  id        Int       @id @default(autoincrement())
  name      String
  login     String    @unique
  password  String
  role      String    @default("staff") // "admin" | "staff"
  active    Boolean   @default(true)
  createdAt DateTime  @default(now())
  requests  Request[] @relation("AssignedRequests")
}
```

In the `Request` model, replace:
```prisma
assignee       String?
```
with:
```prisma
assigneeId     Int?
assignedTo     Staff?    @relation("AssignedRequests", fields: [assigneeId], references: [id], onDelete: SetNull)
```

Keep index: `@@index([assigneeId])` (replace the old `@@index([assignee])`)

**Step 2: Create and apply migration**

```bash
npx prisma migrate dev --name add-staff-model
```

**Step 3: Seed default admin staff record**

Create a small seed step: in the migration SQL or via a script, insert a default admin staff:
- login: "admin", name: "Администратор", role: "admin", password: bcrypt hash of current ADMIN_PASSWORD

**Step 4: Regenerate Prisma client**

```bash
npx prisma generate
```

**Step 5: Commit**

```bash
git add prisma/
git commit -m "feat: add Staff model and assigneeId relation to Request"
```

---

### Task 2: Staff API — CRUD for managing staff members

**Files:**
- Create: `src/app/api/admin/staff/route.ts` (GET list, POST create)
- Create: `src/app/api/admin/staff/[id]/route.ts` (PATCH update, DELETE)

**Step 1: GET /api/admin/staff — list all staff**

```typescript
// src/app/api/admin/staff/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminPassword } from "@/lib/adminAuth";

export async function GET(req: Request) {
  const pwd = req.headers.get("x-admin-password") || "";
  if (!(await verifyAdminPassword(pwd))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const staff = await prisma.staff.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, login: true, role: true,
      active: true, createdAt: true,
      _count: { select: { requests: true } }
    }
  });

  return NextResponse.json({ staff });
}
```

**Step 2: POST /api/admin/staff — create staff member**

In same file. Accept: `{ name, login, password, role? }`. Hash password with bcrypt (cost 12). Validate login uniqueness. Only admin role can create.

**Step 3: PATCH /api/admin/staff/[id] — update staff**

```typescript
// src/app/api/admin/staff/[id]/route.ts
```
Accept: `{ name?, login?, password?, role?, active? }`. If password provided, hash it. Admin-only.

**Step 4: DELETE /api/admin/staff/[id] — delete staff**

Set `assigneeId = null` on all their requests first, then delete. Admin-only.

**Step 5: Commit**

```bash
git add src/app/api/admin/staff/
git commit -m "feat: add staff CRUD API routes"
```

---

### Task 3: Staff Auth — unified login for admin and staff

**Files:**
- Modify: `src/lib/AdminAuthContext.tsx`
- Create: `src/app/api/admin/auth/route.ts`

**Step 1: Create /api/admin/auth login endpoint**

```typescript
// src/app/api/admin/auth/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminPassword } from "@/lib/adminAuth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { login, password } = await req.json();

  // Try staff login first
  if (login) {
    const staff = await prisma.staff.findUnique({ where: { login } });
    if (staff && staff.active && await bcrypt.compare(password, staff.password)) {
      return NextResponse.json({
        authenticated: true,
        role: staff.role,
        staffId: staff.id,
        name: staff.name
      });
    }
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Fallback: admin password (legacy)
  if (await verifyAdminPassword(password)) {
    return NextResponse.json({
      authenticated: true,
      role: "admin",
      staffId: null,
      name: "Администратор"
    });
  }

  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}
```

**Step 2: Update AdminAuthContext**

Modify `src/lib/AdminAuthContext.tsx`:
- Add state: `role` ("admin" | "staff"), `staffId` (number | null), `staffName` (string)
- Login form: add optional "login" field. If login provided → POST /api/admin/auth. If only password → legacy admin auth
- Store in sessionStorage: `admin-role`, `admin-staff-id`, `admin-staff-name`, `admin-password`
- Expose via context: `{ password, authenticated, role, staffId, staffName, login, logout }`

**Step 3: Commit**

```bash
git add src/lib/AdminAuthContext.tsx src/app/api/admin/auth/
git commit -m "feat: unified admin/staff login with role detection"
```

---

### Task 4: Staff-aware admin layout — hide nav for staff role

**Files:**
- Modify: `src/app/admin/layout-client.tsx`

**Step 1: Read role from AdminAuthContext**

```typescript
const { role, staffName } = useAdmin();
```

**Step 2: Filter navigation items by role**

Staff sees only "Заявки" tab. Hide "Пользователи", "Аналитика", "Настройки" when `role === "staff"`.

```typescript
const navItems = [
  { href: "/admin", label: "Заявки", icon: ClipboardList },
  ...(role === "admin" ? [
    { href: "/admin/users", label: "Пользователи", icon: Users },
    { href: "/admin/analytics", label: "Аналитика", icon: BarChart3 },
    { href: "/admin/settings", label: "Настройки", icon: Settings },
    { href: "/admin/staff", label: "Сотрудники", icon: UserCog },
  ] : []),
];
```

**Step 3: Show staff name in sidebar profile section**

Replace "Администратор" with `staffName` when available.

**Step 4: Commit**

```bash
git add src/app/admin/layout-client.tsx
git commit -m "feat: role-based navigation in admin layout"
```

---

### Task 5: Staff management page — /admin/staff

**Files:**
- Create: `src/app/admin/staff/page.tsx`

**Step 1: Build staff management page**

Client component with:
- Stats cards: total staff, active, inactive
- Table: Name, Login, Role (badge), Active (toggle), Requests count, Created date, Actions
- "Add staff" button → modal with form: name, login, password, role select (admin/staff)
- Edit inline or modal: change name, login, role, active status, reset password
- Delete with confirmation
- Uses `x-admin-password` header for API calls
- Only accessible when `role === "admin"` (redirect or block otherwise)

**Step 2: Commit**

```bash
git add src/app/admin/staff/
git commit -m "feat: staff management page with CRUD"
```

---

### Task 6: Filter requests by assigneeId for staff role

**Files:**
- Modify: `src/app/api/admin/route.ts` (GET)
- Modify: `src/app/admin/page.tsx`

**Step 1: Add staffId query param to GET /api/admin**

In `src/app/api/admin/route.ts`, accept optional `staffId` query param. When provided, filter: `where: { assigneeId: parseInt(staffId) }`.

**Step 2: Add x-admin-staff-id header support**

Alternative: read `x-admin-staff-id` header. If present and role is staff, auto-filter by that staffId.

**Step 3: Update admin page.tsx fetch**

When `role === "staff"`, include `staffId` in the fetch URL so only assigned requests are returned.

**Step 4: Hide delete button for staff role**

In the expanded row details, conditionally hide the delete button when `role === "staff"`.

**Step 5: Update assignee UI**

Replace the text input for assignee with a `<Select>` dropdown fetching from GET /api/admin/staff. Show staff names, save `assigneeId` instead of string.

**Step 6: Update PATCH /api/admin/[id]**

Accept `assigneeId` (number) instead of `assignee` (string). Update the existing PATCH handler.

**Step 7: Commit**

```bash
git add src/app/api/admin/route.ts src/app/api/admin/[id]/route.ts src/app/admin/page.tsx
git commit -m "feat: staff-based request filtering and assignee dropdown"
```

---

### Task 7: Kanban board with drag & drop

**Files:**
- Modify: `src/app/admin/page.tsx`

**Step 1: Install @dnd-kit**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Step 2: Build KanbanBoard component**

Inside `page.tsx` (or extract to a separate component file if preferred), implement:

```typescript
import { DndContext, DragEndEvent, DragOverlay, closestCorners } from "@dnd-kit/core";
```

Structure:
- `KanbanBoard` — wraps `DndContext` with 6 `KanbanColumn` components
- `KanbanColumn` — droppable area with status header, count badge, colored top border
- `KanbanCard` — draggable card showing: company/name, service, date, assignee badge, clientPrice

Status columns with colors (reuse existing status colors):
- new → blue
- in_progress → orange
- pending_payment → yellow
- review → purple
- done → green
- cancelled → red

**Step 3: Implement drag & drop handler**

```typescript
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (!over) return;

  const requestId = active.id as number;
  const newStatus = over.id as string;

  // Optimistic update
  setRequests(prev => prev.map(r =>
    r.id === requestId ? { ...r, status: newStatus } : r
  ));

  // PATCH API
  fetch(`/api/admin/${requestId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-admin-password": password },
    body: JSON.stringify({ status: newStatus })
  });
}
```

**Step 4: Add DragOverlay for visual feedback**

Show a semi-transparent copy of the card being dragged.

**Step 5: Wire into existing viewMode toggle**

The toggle between "table" and "kanban" already exists in the UI. Render `KanbanBoard` when `viewMode === "kanban"`.

**Step 6: Kanban card click → expand details**

Clicking a card (not dragging) should open the same detail panel as the table row expansion.

**Step 7: Commit**

```bash
git add package.json package-lock.json src/app/admin/page.tsx
git commit -m "feat: kanban board with drag & drop status changes"
```

---

### Task 8: Editable email templates in settings

**Files:**
- Modify: `src/app/admin/settings/page.tsx`
- Modify: `src/app/api/admin/settings/route.ts`
- Modify: `src/lib/email.ts` (or `email/index.ts`)

**Step 1: Add "templates" tab to settings page**

In `src/app/admin/settings/page.tsx`, add a new tab `templates` — "Шаблоны". UI:

For each of the 6 statuses, show:
- Status label (badge with color)
- Textarea for email body template
- Help text: "Переменные: {name}, {service}, {status}, {id}"
- Save button per status or one "Save all"

Setting keys in DB: `template_new`, `template_in_progress`, `template_pending_payment`, `template_review`, `template_done`, `template_cancelled`

**Step 2: Update GET/PUT /api/admin/settings**

Add template keys to the settings route. On GET, return template values (with defaults if not set). On PUT, upsert template values.

Default templates (used when no custom template in DB):
```
template_in_progress: "Уважаемый(ая) {name}, ваша заявка №{id} на услугу «{service}» принята в работу. Мы уведомим вас о дальнейших изменениях."
template_done: "Уважаемый(ая) {name}, работы по заявке №{id} («{service}») завершены. Вы можете забрать оборудование."
// ... etc for each status
```

**Step 3: Update sendStatusUpdateEmail**

In the email sending function, fetch template from DB:
```typescript
const templateSetting = await prisma.setting.findUnique({
  where: { key: `template_${status}` }
});
const template = templateSetting?.value || defaultTemplates[status];
const body = template
  .replace(/\{name\}/g, name)
  .replace(/\{service\}/g, service)
  .replace(/\{id\}/g, String(requestId))
  .replace(/\{status\}/g, statusLabel);
```

Use this `body` in the email HTML instead of the hardcoded text.

**Step 4: Remove hardcoded templates from page.tsx**

Replace the 5 hardcoded `responseTemplates` in admin page.tsx with templates fetched from the API. Load them on mount alongside other data.

**Step 5: Commit**

```bash
git add src/app/admin/settings/page.tsx src/app/api/admin/settings/route.ts src/lib/email.ts src/app/admin/page.tsx
git commit -m "feat: editable email templates per status in admin settings"
```

---

### Task 9: Update TODO.md and final cleanup

**Files:**
- Modify: `TODO.md`

**Step 1: Mark completed items**

Add to completed section:
- [+] Канбан-доска заявок с drag & drop
- [+] Редактируемые шаблоны email-ответов при смене статуса
- [+] Модель Staff — аккаунты сотрудников с ограниченным доступом

**Step 2: Also add new ideas to TODO**

From brainstorming, add to backlog:
- [ ] Онлайн-калькулятор стоимости услуг на главной
- [ ] Email-дайджест (ежемесячная сводка по оборудованию)
- [ ] Детальные статусы заявки (принято → получено → на поверке → оформление → выдача)
- [ ] Личный менеджер в ЛК
- [ ] Онлайн-чат (виджет)
- [ ] API для клиентов (REST с токеном)
- [ ] Кейсы / отзывы клиентов на главной

**Step 3: Commit**

```bash
git add TODO.md
git commit -m "docs: update TODO with completed admin operations and new ideas"
```

---

## Execution Order

Tasks 1-3 are sequential (schema → API → auth). Tasks 4-5 depend on 3. Tasks 6-8 can be parallelized after 5. Task 9 is final.

```
Task 1 (Schema) → Task 2 (Staff API) → Task 3 (Auth) → Task 4 (Layout) → Task 5 (Staff page)
                                                                              ↓
                                                          Task 6 (Filter/Assignee) ─┐
                                                          Task 7 (Kanban)           ├→ Task 9 (Cleanup)
                                                          Task 8 (Templates)        ─┘
```
