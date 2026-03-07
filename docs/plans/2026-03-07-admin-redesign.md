# Admin Panel Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring admin panel to the same quality level as the user dashboard — dark mode, animations, collapsible sidebar, user management, extended analytics.

**Architecture:** Rewrite admin layout-client.tsx to match dashboard/layout.tsx patterns (collapsible sidebar, Framer Motion, dark mode). Add new /admin/users page with full CRUD. Extend analytics with user metrics. Remove services page. Add `banned` field to User model.

**Tech Stack:** Next.js 14 App Router, Prisma (SQLite), React, Tailwind CSS, Framer Motion, Recharts, Socket.IO

---

### Task 1: Prisma — add `banned` field to User

**Files:**
- Modify: `prisma/schema.prisma` — User model (line ~11)

**Step 1: Add banned field**

In the User model, after the `coverImage` field (line ~22), add:

```prisma
banned         Boolean                @default(false)
```

**Step 2: Create and apply migration**

```bash
npx prisma migrate dev --name add-user-banned
```

**Step 3: Commit**

```bash
git add prisma/
git commit -m "feat(admin): add banned field to User model"
```

---

### Task 2: Block banned users from logging in

**Files:**
- Modify: `src/app/api/auth/login/route.ts` — add banned check after password verify

**Step 1: Add banned check**

After the password verification succeeds (bcrypt.compare), before generating JWT, add:

```typescript
if (user.banned) {
  return NextResponse.json({ error: "Ваш аккаунт заблокирован. Обратитесь к администратору." }, { status: 403 });
}
```

**Step 2: Commit**

```bash
git add src/app/api/auth/login/route.ts
git commit -m "feat(admin): block banned users from login"
```

---

### Task 3: Admin Users API — list, update, ban, delete, impersonate

**Files:**
- Create: `src/app/api/admin/users/route.ts` — GET (list) + PATCH (update user)
- Create: `src/app/api/admin/users/[id]/route.ts` — DELETE (delete user)
- Create: `src/app/api/admin/users/[id]/ban/route.ts` — POST (toggle ban)
- Create: `src/app/api/admin/users/[id]/impersonate/route.ts` — POST (login as user)
- Create: `src/app/api/admin/users/[id]/reset-password/route.ts` — POST (reset password)

**Step 1: GET /api/admin/users — list users**

```typescript
// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminPassword } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await verifyAdminPassword(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status"); // "active" | "banned" | null
  const page = Number(searchParams.get("page")) || 1;
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
      { company: { contains: search } },
    ];
  }
  if (status === "banned") where.banned = true;
  if (status === "active") where.banned = false;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        banned: true,
        createdAt: true,
        _count: { select: { requests: true, equipment: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, pages: Math.ceil(total / limit) });
}

export async function PATCH(request: NextRequest) {
  if (!(await verifyAdminPassword(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, name, email, phone, company } = body;

  const user = await prisma.user.update({
    where: { id },
    data: { name, email, phone: phone || null, company: company || null },
    select: { id: true, name: true, email: true, phone: true, company: true },
  });

  return NextResponse.json({ user });
}
```

**Step 2: DELETE /api/admin/users/[id]**

```typescript
// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminPassword } from "@/lib/adminAuth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await verifyAdminPassword(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.user.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
```

**Step 3: POST /api/admin/users/[id]/ban**

```typescript
// src/app/api/admin/users/[id]/ban/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminPassword } from "@/lib/adminAuth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await verifyAdminPassword(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id: Number(id) } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.user.update({
    where: { id: Number(id) },
    data: { banned: !user.banned },
  });

  // Revoke all sessions when banning
  if (updated.banned) {
    await prisma.userSession.updateMany({
      where: { userId: Number(id) },
      data: { revoked: true },
    });
  }

  return NextResponse.json({ user: updated });
}
```

**Step 4: POST /api/admin/users/[id]/impersonate**

```typescript
// src/app/api/admin/users/[id]/impersonate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminPassword } from "@/lib/adminAuth";
import { SignJWT } from "jose";
import { JWT_SECRET } from "@/lib/jwt";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await verifyAdminPassword(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id: Number(id) } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const token = await new SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(JWT_SECRET);

  const response = NextResponse.json({ success: true });
  response.cookies.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 3600,
    path: "/",
  });
  return response;
}
```

**Step 5: POST /api/admin/users/[id]/reset-password**

```typescript
// src/app/api/admin/users/[id]/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminPassword } from "@/lib/adminAuth";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await verifyAdminPassword(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const newPassword = crypto.randomBytes(6).toString("hex"); // 12-char random
  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: Number(id) },
    data: { password: hashed },
  });

  // Revoke all sessions
  await prisma.userSession.updateMany({
    where: { userId: Number(id) },
    data: { revoked: true },
  });

  return NextResponse.json({ newPassword });
}
```

**Step 6: Commit**

```bash
git add src/app/api/admin/users/
git commit -m "feat(admin): users API — list, update, ban, delete, impersonate, reset-password"
```

---

### Task 4: Remove services page and API

**Files:**
- Delete: `src/app/admin/services/page.tsx`
- Delete: `src/app/api/admin/services/` (if exists)

**Step 1: Delete files**

```bash
rm -rf src/app/admin/services/
rm -rf src/app/api/admin/services/
```

**Step 2: Commit**

```bash
git add -A src/app/admin/services/ src/app/api/admin/services/
git commit -m "chore(admin): remove unused services page and API"
```

---

### Task 5: Remove AdminThemeForcer — enable dark mode

**Files:**
- Modify: `src/app/admin/layout.tsx` — remove AdminThemeForcer import and usage
- Delete: `src/app/admin/theme-forcer.tsx`

**Step 1: Edit layout.tsx**

Remove the `<AdminThemeForcer />` component and its import. The layout should just render `<AdminLayoutClient>`.

**Step 2: Delete theme-forcer.tsx**

```bash
rm src/app/admin/theme-forcer.tsx
```

**Step 3: Commit**

```bash
git add src/app/admin/layout.tsx src/app/admin/theme-forcer.tsx
git commit -m "feat(admin): remove theme forcer, enable dark mode"
```

---

### Task 6: Redesign admin layout — collapsible sidebar, dark mode, animations

**Files:**
- Modify: `src/app/admin/layout-client.tsx` — full rewrite based on dashboard/layout.tsx patterns

**Step 1: Rewrite layout-client.tsx**

Reference `src/app/dashboard/layout.tsx` for patterns. The new layout must include:

1. **Dark mode classes** on all elements (`dark:bg-dark`, `dark:bg-dark-light`, `dark:text-white`, `dark:border-white/10`)
2. **Collapsible sidebar** with localStorage persistence (`admin-sidebar-collapsed`) and toggle button at `-right-3.5` with `lg:overflow-visible`
3. **Framer Motion** — AnimatePresence for mobile overlay, motion.div for page transitions
4. **Updated nav items:**
   - Заявки (href: `/admin`, exact: true)
   - Пользователи (href: `/admin/users`)
   - Аналитика (href: `/admin/analytics`)
   - Настройки (href: `/admin/settings`)
5. **Breadcrumbs** with breadcrumbMap for sub-pages
6. **Tooltips** on collapsed sidebar items (same pattern as dashboard)
7. **Profile section** at bottom — show "Администратор" with logout dropdown

Key classes to change:
- Sidebar: `bg-white dark:bg-dark-light border-r border-gray-200 dark:border-white/10`
- Background: `bg-warm-bg dark:bg-dark`
- Nav active: `bg-primary text-white shadow-md shadow-primary/20`
- Nav hover: `hover:bg-gray-100 dark:hover:bg-white/5`

**Step 2: Commit**

```bash
git add src/app/admin/layout-client.tsx
git commit -m "feat(admin): redesign layout — collapsible sidebar, dark mode, animations"
```

---

### Task 7: Add dark mode to AdminAuthContext login page

**Files:**
- Modify: `src/lib/AdminAuthContext.tsx` — add dark: classes to login form

**Step 1: Add dark mode classes**

Update the login page styling:
- Background: `bg-warm-bg dark:bg-dark`
- Card: `bg-white dark:bg-dark-light`
- Input: `dark:bg-dark dark:border-white/10 dark:text-white`
- Text: `dark:text-white`, `dark:text-white/50`
- Error text: keep as red

**Step 2: Commit**

```bash
git add src/lib/AdminAuthContext.tsx
git commit -m "feat(admin): dark mode for login page"
```

---

### Task 8: Redesign main admin page — dark mode + stat card styling

**Files:**
- Modify: `src/app/admin/page.tsx`

**Step 1: Add dark mode classes throughout**

This is a large file (~1300 lines). Add `dark:` variants to all background, text, and border classes:

- All `bg-white` → add `dark:bg-dark-light`
- All `bg-gray-50/100` → add `dark:bg-white/5`
- All `text-gray-*` → add `dark:text-white/70` or `dark:text-white/50`
- All `border-gray-*` → add `dark:border-white/10`
- Table headers: `dark:bg-dark`
- Table rows hover: `dark:hover:bg-white/5`
- Inputs: `dark:bg-dark dark:border-white/10 dark:text-white`
- Badges: keep colored, add dark variants

**Step 2: Upgrade stat cards**

Replace basic `bg-*-50` cards with gradient style matching dashboard:
- Use `rounded-2xl shadow-sm` with hover shadow animation
- Add `transition-shadow hover:shadow-md`
- Gradient backgrounds: e.g. `bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-500/10 dark:to-blue-600/10`
- Larger icons with colored background circles
- Animated counters optional

**Step 3: Add Framer Motion imports and animate stat cards**

```typescript
import { motion } from "framer-motion";
```

Wrap stat cards grid items in `motion.div` with staggered entrance:
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.05 }}
>
```

**Step 4: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat(admin): dark mode + modern stat cards + animations on requests page"
```

---

### Task 9: Redesign analytics page — visual polish + user metrics

**Files:**
- Modify: `src/app/admin/analytics/page.tsx`

**Step 1: Add new API data**

Extend the analytics API or add a new fetch for user metrics. The analytics page should fetch additional data:

```typescript
// Additional fetch for user stats
const userStatsRes = await fetch("/api/admin/users/stats", { headers });
```

Create `src/app/api/admin/users/stats/route.ts`:
```typescript
// Returns: registrationsByMonth (last 6 months), loginsByPeriod, topUsers
```

**Step 2: Visual polish on existing cards**

- Upgrade KPI cards: add gradient backgrounds, shadows, hover effects
- Add `motion.div` wrappers with stagger animation
- Ensure all charts work well in dark mode (tick colors, grid colors)

**Step 3: Add new charts section**

After existing charts, add "Пользователи" section:
- **Registration trend** — AreaChart showing new registrations per month (last 6 months)
- **Top users** — table with name, email, equipment count, requests count, last login

**Step 4: Commit**

```bash
git add src/app/admin/analytics/page.tsx src/app/api/admin/users/stats/
git commit -m "feat(admin): analytics polish + user metrics (registrations, top users)"
```

---

### Task 10: Redesign settings page — dark mode + animations

**Files:**
- Modify: `src/app/admin/settings/page.tsx`

**Step 1: Add dark mode classes**

- Outer card: `bg-white dark:bg-dark-light`
- Tab sidebar: `bg-warm-bg dark:bg-dark`
- Active tab: keep `bg-primary` pattern
- Inactive tab: `dark:text-white/70 dark:hover:bg-white/5`
- Inputs: `dark:bg-dark dark:border-white/10 dark:text-white`
- Toggle switches: add dark variant styling
- Labels: `dark:text-white`
- Info boxes: adjust amber/blue background for dark mode

**Step 2: Add tab switch animation**

Wrap tab content in AnimatePresence + motion.div:
```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={activeTab}
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -10 }}
    transition={{ duration: 0.15 }}
  >
    {renderContent()}
  </motion.div>
</AnimatePresence>
```

**Step 3: Commit**

```bash
git add src/app/admin/settings/page.tsx
git commit -m "feat(admin): settings dark mode + tab animations"
```

---

### Task 11: Create admin users page UI

**Files:**
- Create: `src/app/admin/users/page.tsx`

**Step 1: Build the users page**

Full page with:

1. **Header** — title "Пользователи" + search input + status filter (Все / Активные / Забаненные)
2. **Stats bar** — total users, active, banned (small colored badges)
3. **Table** — responsive, dark mode, columns:
   - Имя, Email, Телефон, Компания, Оборудование (count), Заявки (count), Дата регистрации, Статус
   - Row click → expand details
4. **Expanded row** — actions:
   - Редактировать (inline form)
   - Сбросить пароль (with confirmation, shows generated password)
   - Бан/Разбан (toggle button, red/green)
   - Войти как пользователь (opens /dashboard in new tab)
   - Удалить (with confirmation)
   - View: equipment count link, requests count link
5. **Pagination** — same pattern as admin requests page
6. **Animations** — motion.div on table rows, stagger on load

Style: match the admin requests page patterns but with dark mode from the start.

**Step 2: Commit**

```bash
git add src/app/admin/users/
git commit -m "feat(admin): users management page with full CRUD"
```

---

### Task 12: Update error.tsx and loading.tsx for dark mode

**Files:**
- Modify: `src/app/admin/error.tsx`
- Modify: `src/app/admin/loading.tsx`

**Step 1: Add dark mode to error page**

- Background: `dark:bg-dark`
- Card: `dark:bg-dark-light`
- Text: `dark:text-white`

**Step 2: Add dark mode to loading skeleton**

- Background: `dark:bg-dark`
- Skeleton blocks: `dark:bg-white/10` instead of `bg-gray-100`

**Step 3: Commit**

```bash
git add src/app/admin/error.tsx src/app/admin/loading.tsx
git commit -m "feat(admin): dark mode for error and loading pages"
```

---

### Task 13: Build and verify

**Step 1: Run build**

```bash
npm run build
```

Fix any TypeScript errors.

**Step 2: Manual testing checklist**

- [ ] Admin login page — dark mode works
- [ ] Sidebar — collapses/expands, persists in localStorage, tooltips show
- [ ] Sidebar — mobile hamburger works with animation
- [ ] Dark mode toggle — works across all admin pages
- [ ] Breadcrumbs — show on sub-pages
- [ ] Page transitions — animated
- [ ] Requests page — stat cards have gradients, dark mode, animations
- [ ] Requests page — table/kanban dark mode
- [ ] Users page — list, search, filter works
- [ ] Users page — ban/unban, delete, edit, reset password, impersonate
- [ ] Analytics — KPI cards polished, user metrics show
- [ ] Settings — dark mode, tab animations
- [ ] Services page removed — /admin/services returns 404

**Step 3: Commit fixes if any**
