# Remove Personal Equipment + Realtime Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove personal equipment (all equipment belongs to organization), add Socket.IO realtime updates across all key pages.

**Architecture:** Make `organizationId` required on Equipment, remove "personal" mode from UI/API. Add `join-rooms` handling in server.js, create `useSocket` hook for client, emit events from API routes after mutations.

**Tech Stack:** Next.js 14 App Router, Prisma (SQLite), Socket.IO, React, Tailwind CSS

---

### Task 1: Prisma — make organizationId required on Equipment

**Files:**
- Modify: `prisma/schema.prisma` (line 139-140)

**Step 1: Delete personal equipment and make field required**

In `prisma/schema.prisma`, change the Equipment model:

```prisma
# Before (line 139-140):
  organizationId    Int?
  organization      Organization? @relation(...)

# After:
  organizationId    Int
  organization      Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)
```

**Step 2: Create migration with manual SQL**

Create migration manually because we need to delete data first:

```bash
mkdir -p prisma/migrations/20260307200000_require_org_equipment
```

Create `prisma/migrations/20260307200000_require_org_equipment/migration.sql`:

```sql
-- Delete personal equipment (no organization)
DELETE FROM "Equipment" WHERE "organizationId" IS NULL;

-- Delete orphaned verification records
DELETE FROM "VerificationRecord" WHERE "equipmentId" NOT IN (SELECT "id" FROM "Equipment");

-- Delete orphaned request items
DELETE FROM "RequestItem" WHERE "equipmentId" NOT NULL AND "equipmentId" NOT IN (SELECT "id" FROM "Equipment");

-- Recreate table with required organizationId
-- SQLite doesn't support ALTER COLUMN, so we use the standard rename-recreate pattern
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Equipment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "serialNumber" TEXT,
    "verificationDate" DATETIME,
    "nextVerification" DATETIME,
    "interval" INTEGER NOT NULL DEFAULT 12,
    "category" TEXT NOT NULL DEFAULT 'verification',
    "status" TEXT NOT NULL DEFAULT 'active',
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "company" TEXT,
    "contactEmail" TEXT,
    "notes" TEXT,
    "arshinValidDate" DATETIME,
    "arshinMismatch" BOOLEAN NOT NULL DEFAULT false,
    "arshinCheckedAt" DATETIME,
    "arshinUrl" TEXT,
    "arshinNotifiedDate" DATETIME,
    "mitApproved" BOOLEAN,
    "mitUrl" TEXT,
    "ignored" BOOLEAN NOT NULL DEFAULT false,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Equipment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Equipment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Equipment" SELECT * FROM "Equipment";
DROP TABLE "Equipment";
ALTER TABLE "new_Equipment" RENAME TO "Equipment";

CREATE INDEX "Equipment_userId_idx" ON "Equipment"("userId");
CREATE INDEX "Equipment_nextVerification_idx" ON "Equipment"("nextVerification");
CREATE INDEX "Equipment_status_idx" ON "Equipment"("status");

PRAGMA foreign_keys=ON;
```

**Step 3: Apply migration**

```bash
npx prisma migrate resolve --applied 20260307200000_require_org_equipment
npx prisma generate
```

Note: Since we're writing the SQL manually, apply it with `npx prisma db execute --file prisma/migrations/20260307200000_require_org_equipment/migration.sql` first, then resolve.

**Step 4: Commit**

```bash
git add prisma/
git commit -m "feat: make Equipment.organizationId required, delete personal equipment"
```

---

### Task 2: Simplify orgAccess.ts

**Files:**
- Modify: `src/lib/orgAccess.ts`

**Step 1: Simplify canAccessOrgEquipment**

Since all equipment now has an organizationId, remove the personal equipment branch:

```typescript
import { prisma } from "./prisma";

export async function canAccessOrgEquipment(userId: number, equipmentId: number): Promise<boolean> {
  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    select: { organizationId: true },
  });
  if (!equipment) return false;
  return isOrgMember(userId, equipment.organizationId);
}

export async function isOrgMember(userId: number, organizationId: number): Promise<boolean> {
  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
  return !!membership;
}
```

**Step 2: Commit**

```bash
git add src/lib/orgAccess.ts
git commit -m "refactor: simplify orgAccess — remove personal equipment branch"
```

---

### Task 3: Update equipment API — require organizationId

**Files:**
- Modify: `src/app/api/equipment/route.ts` (GET + POST)

**Step 1: Update GET — require organizationId**

Replace lines 33-47 (the orgId if/else block):

```typescript
    const orgId = searchParams.get("organizationId");
    if (!orgId) {
      return NextResponse.json({ error: "organizationId обязателен" }, { status: 400 });
    }

    const membership = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: Number(orgId) } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Нет доступа к организации" }, { status: 403 });
    }

    const where: Record<string, unknown> = { organizationId: Number(orgId), ignored: showIgnored };
```

**Step 2: Update POST — require organizationId**

Replace lines 104-111:

```typescript
    const { name, type, serialNumber, verificationDate, nextVerification, interval, category, company, contactEmail, notes, arshinUrl, organizationId } = parsed.data;

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId обязателен" }, { status: 400 });
    }

    const { isOrgMember } = await import("@/lib/orgAccess");
    if (!(await isOrgMember(userId, organizationId))) {
      return NextResponse.json({ error: "Нет доступа к организации" }, { status: 403 });
    }
```

And change `organizationId: organizationId || null` to `organizationId` in the create call (line 119).

**Step 3: Commit**

```bash
git add src/app/api/equipment/route.ts
git commit -m "feat: require organizationId in equipment API"
```

---

### Task 4: Update EquipmentList — remove personal mode

**Files:**
- Modify: `src/components/EquipmentList.tsx`

**Step 1: Change activeOrgId default**

Replace line 123:
```typescript
// Before:
const [activeOrgId, setActiveOrgId] = useState<number | null>(null);

// After:
const [activeOrgId, setActiveOrgId] = useState<number | null>(null);
const [noOrg, setNoOrg] = useState(false);
```

**Step 2: Update org fetch to auto-select**

Replace the fetch in the useEffect (lines 220-231):

```typescript
  useEffect(() => {
    fetch("/api/organizations")
      .then((r) => (r.ok ? r.json() : { organizations: [] }))
      .then((data) => {
        const orgs = (data.organizations || []).map((o: { id: number; name: string }) => ({
          id: o.id,
          name: o.name,
        }));
        setUserOrgs(orgs);
        if (orgs.length === 1) {
          setActiveOrgId(orgs[0].id);
        } else if (orgs.length === 0) {
          setNoOrg(true);
        }
      })
      .catch(() => {});
  }, []);
```

**Step 3: Add "no organization" guard**

Before the main return, after loading check, add:

```typescript
  if (noOrg) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-dark dark:text-white mb-2">Нет организации</h2>
        <p className="text-sm text-neutral dark:text-white/50 mb-4 max-w-sm mx-auto">
          Для работы с оборудованием создайте организацию или попросите администратора добавить вас.
        </p>
        <a
          href="/dashboard/organization"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Перейти к организациям
        </a>
      </div>
    );
  }
```

**Step 4: Replace org switcher (lines 882-908)**

Remove the "Личное" button. If only one org, don't show switcher. If multiple, show only org buttons:

```tsx
      {/* Organization switcher — only when multiple orgs */}
      {userOrgs.length > 1 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {userOrgs.map((org) => (
            <button
              key={org.id}
              onClick={() => setActiveOrgId(org.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeOrgId === org.id
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white dark:bg-dark-light text-dark dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              {org.name}
            </button>
          ))}
        </div>
      )}
```

**Step 5: Don't fetch equipment without activeOrgId**

In `buildEquipmentParams`, the `organizationId` is always set since `activeOrgId` is always non-null when we have orgs. But guard the fetch:

In the fetch effect, add guard:
```typescript
  // In the fetchEquipment / fetchEquipmentSilent callers:
  // Only fetch if activeOrgId is set
  useEffect(() => {
    if (!activeOrgId) return;
    // ... existing fetch logic
  }, [...deps, activeOrgId]);
```

**Step 6: Commit**

```bash
git add src/components/EquipmentList.tsx
git commit -m "feat: remove personal equipment mode from UI"
```

---

### Task 5: Socket.IO — add room support in server.js

**Files:**
- Modify: `server.js` (lines 23-29)

**Step 1: Handle join-rooms event**

Replace the socket connection handler:

```javascript
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join-rooms", (data) => {
      if (data.userId) {
        socket.join(`user:${data.userId}`);
      }
      if (data.orgIds && Array.isArray(data.orgIds)) {
        data.orgIds.forEach((orgId) => {
          socket.join(`org:${orgId}`);
        });
      }
      if (data.isAdmin) {
        socket.join("admin");
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
```

**Step 2: Commit**

```bash
git add server.js
git commit -m "feat: Socket.IO room support (user, org, admin)"
```

---

### Task 6: Create useSocket hook

**Files:**
- Create: `src/lib/useSocket.ts`

**Step 1: Create the hook**

```typescript
"use client";

import { useEffect, useRef } from "react";
import { io as ioClient, Socket } from "socket.io-client";

interface UseSocketOptions {
  userId?: number | null;
  orgIds?: number[];
  isAdmin?: boolean;
}

let globalSocket: Socket | null = null;
let refCount = 0;

function getSocket(): Socket {
  if (!globalSocket) {
    globalSocket = ioClient({ path: "/api/socketio", transports: ["websocket", "polling"] });
  }
  return globalSocket;
}

export function useSocket(options: UseSocketOptions = {}): Socket | null {
  const { userId, orgIds, isAdmin } = options;
  const socketRef = useRef<Socket | null>(null);
  const joinedRef = useRef(false);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;
    refCount++;

    if (!joinedRef.current && (userId || isAdmin)) {
      socket.emit("join-rooms", { userId, orgIds: orgIds || [], isAdmin: !!isAdmin });
      joinedRef.current = true;
    }

    return () => {
      refCount--;
      if (refCount <= 0 && globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
        refCount = 0;
      }
      joinedRef.current = false;
    };
  }, [userId, orgIds, isAdmin]);

  return socketRef.current;
}
```

**Step 2: Commit**

```bash
git add src/lib/useSocket.ts
git commit -m "feat: useSocket hook with room management"
```

---

### Task 7: Emit realtime events from equipment API

**Files:**
- Modify: `src/app/api/equipment/route.ts` (POST)
- Modify: `src/app/api/equipment/[id]/route.ts` (PATCH, DELETE)
- Modify: `src/app/api/equipment/bulk/route.ts` (POST)

**Step 1: Add emit to POST /api/equipment (after create)**

After `logActivity` call (line 135), add:

```typescript
    // Emit realtime event
    const { getIO } = await import("@/lib/socket");
    const io = getIO();
    if (io && organizationId) {
      io.to(`org:${organizationId}`).emit("equipment-changed", { action: "created", equipmentId: equipment.id });
    }
```

**Step 2: Add emit to PATCH /api/equipment/[id]**

After `logActivity` call (line 95), add:

```typescript
    const { getIO } = await import("@/lib/socket");
    const io = getIO();
    if (io && existing.organizationId) {
      io.to(`org:${existing.organizationId}`).emit("equipment-changed", { action: "updated", equipmentId });
    }
```

**Step 3: Add emit to DELETE /api/equipment/[id]**

After `logActivity` call (line 130), add:

```typescript
    const { getIO } = await import("@/lib/socket");
    const io = getIO();
    if (io && existing.organizationId) {
      io.to(`org:${existing.organizationId}`).emit("equipment-changed", { action: "deleted", equipmentId });
    }
```

**Step 4: Add emit to POST /api/equipment/bulk**

After the switch block (line 84), before the return, add:

```typescript
    // Emit realtime for affected orgs
    const { getIO } = await import("@/lib/socket");
    const io = getIO();
    if (io) {
      const affectedEquipment = await prisma.equipment.findMany({
        where: { id: { in: numericIds } },
        select: { organizationId: true },
        distinct: ["organizationId"],
      }).catch(() => []);
      for (const eq of affectedEquipment) {
        if (eq.organizationId) {
          io.to(`org:${eq.organizationId}`).emit("equipment-changed", { action, ids: numericIds });
        }
      }
    }
```

Note: For delete action, we need to get the orgIds BEFORE deleting. Move the emit block before the switch for delete, or query orgs before delete. Simplest: query org IDs at the start after access check:

Add before the switch block (after line 56):

```typescript
    // Get orgIds before mutation (for realtime)
    const affectedOrgs = await prisma.equipment.findMany({
      where: { id: { in: numericIds } },
      select: { organizationId: true },
      distinct: ["organizationId"],
    });
```

Then after the switch block:

```typescript
    const { getIO } = await import("@/lib/socket");
    const io = getIO();
    if (io) {
      for (const eq of affectedOrgs) {
        if (eq.organizationId) {
          io.to(`org:${eq.organizationId}`).emit("equipment-changed", { action, ids: numericIds });
        }
      }
    }
```

**Step 5: Commit**

```bash
git add src/app/api/equipment/
git commit -m "feat: emit equipment-changed realtime events"
```

---

### Task 8: Emit realtime events from organization members API

**Files:**
- Modify: `src/app/api/organizations/members/route.ts` (POST + DELETE)

**Step 1: Add emit to POST (add member)**

After `prisma.organizationMember.create` (line 52), before return, add:

```typescript
    const { getIO } = await import("@/lib/socket");
    const io = getIO();
    if (io) {
      io.to(`org:${organizationId}`).emit("org-member-changed", { action: "added", userId: targetUser.id, organizationId });
    }
```

**Step 2: Add emit to DELETE (remove member)**

After `prisma.organizationMember.deleteMany` (line 85), before return, add:

```typescript
    const { getIO } = await import("@/lib/socket");
    const io = getIO();
    if (io) {
      io.to(`org:${orgId}`).emit("org-member-changed", { action: "removed", userId: memberId, organizationId: orgId });
    }
```

**Step 3: Commit**

```bash
git add src/app/api/organizations/members/route.ts
git commit -m "feat: emit org-member-changed realtime events"
```

---

### Task 9: Emit request-status-changed to user room

**Files:**
- Modify: `src/app/api/admin/[id]/route.ts` (PATCH, line 97-101)

**Step 1: Emit to user room on status change**

After the existing `io.emit("request-update", updated)` (line 100), add user-specific emit:

```typescript
  if (io) {
    io.emit("request-update", updated); // existing — for admin panel
    if (updateData.status && updated.userId) {
      io.to(`user:${updated.userId}`).emit("request-status-changed", {
        requestId: updated.id,
        status: updateData.status,
        service: updated.service,
      });
    }
  }
```

**Step 2: Commit**

```bash
git add src/app/api/admin/[id]/route.ts
git commit -m "feat: emit request-status-changed to user room"
```

---

### Task 10: Emit new-user-registered to admin room

**Files:**
- Modify: `src/app/api/auth/register/route.ts` (after user creation, line 66)

**Step 1: Add emit after user creation**

After `sendWelcomeEmail` line (68), add:

```typescript
    // Notify admin panel
    try {
      const { getIO } = await import("@/lib/socket");
      const io = getIO();
      if (io) {
        io.to("admin").emit("new-user-registered", { id: user.id, name: user.name, email: user.email });
      }
    } catch {}
```

**Step 2: Commit**

```bash
git add src/app/api/auth/register/route.ts
git commit -m "feat: emit new-user-registered to admin room"
```

---

### Task 11: Add realtime to EquipmentList

**Files:**
- Modify: `src/components/EquipmentList.tsx`

**Step 1: Import and use the socket hook**

Add import at top:
```typescript
import { useSocket } from "@/lib/useSocket";
```

Inside the component, after the `activeOrgId` state, add:

```typescript
  const socket = useSocket({
    orgIds: userOrgs.map((o) => o.id),
  });
```

**Step 2: Listen for equipment-changed**

Add a useEffect:

```typescript
  useEffect(() => {
    if (!socket) return;
    const handler = () => {
      fetchEquipmentSilent();
    };
    socket.on("equipment-changed", handler);
    return () => { socket.off("equipment-changed", handler); };
  }, [socket, fetchEquipmentSilent]);
```

Note: `fetchEquipmentSilent` is defined around line 249 — verify it's in the dependency correctly (it's defined with useCallback or similar).

**Step 3: Commit**

```bash
git add src/components/EquipmentList.tsx
git commit -m "feat: realtime equipment updates via Socket.IO"
```

---

### Task 12: Add realtime to user requests page

**Files:**
- Modify: `src/app/dashboard/requests/page.tsx`

**Step 1: Import useSocket and add listener**

Add import:
```typescript
import { useSocket } from "@/lib/useSocket";
```

Inside component, get userId (from auth context or props) and connect socket. Listen for `request-status-changed` and refetch:

```typescript
  const socket = useSocket({ userId: user?.id });

  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchRequests();
    socket.on("request-status-changed", handler);
    return () => { socket.off("request-status-changed", handler); };
  }, [socket]);
```

Need to check how the current page fetches data and what state is available. The userId may need to be obtained from an auth fetch or context.

**Step 2: Commit**

```bash
git add src/app/dashboard/requests/page.tsx
git commit -m "feat: realtime request status updates"
```

---

### Task 13: Add realtime to organization page

**Files:**
- Modify: `src/app/dashboard/organization/page.tsx`

**Step 1: Import and listen for org-member-changed**

```typescript
import { useSocket } from "@/lib/useSocket";

// Inside component:
const socket = useSocket({ orgIds: organizations.map((o) => o.id) });

useEffect(() => {
  if (!socket) return;
  const handler = () => fetchOrganizations();
  socket.on("org-member-changed", handler);
  return () => { socket.off("org-member-changed", handler); };
}, [socket]);
```

**Step 2: Commit**

```bash
git add src/app/dashboard/organization/page.tsx
git commit -m "feat: realtime org member updates"
```

---

### Task 14: Add realtime to admin users page

**Files:**
- Modify: `src/app/admin/users/page.tsx`

**Step 1: Import and listen for new-user-registered**

```typescript
import { useSocket } from "@/lib/useSocket";

// Inside component:
const socket = useSocket({ isAdmin: true });

useEffect(() => {
  if (!socket) return;
  const handler = () => {
    fetchUsers();
    fetchStats();
  };
  socket.on("new-user-registered", handler);
  return () => { socket.off("new-user-registered", handler); };
}, [socket]);
```

**Step 2: Commit**

```bash
git add src/app/admin/users/page.tsx
git commit -m "feat: realtime new user notifications in admin"
```

---

### Task 15: Add realtime to notifications page

**Files:**
- Modify: `src/app/dashboard/notifications/page.tsx`

**Step 1: Import and listen for request-status-changed**

The notifications page likely shows request status changes. Add socket listener to refetch when status changes:

```typescript
import { useSocket } from "@/lib/useSocket";

// Inside component (need userId):
const socket = useSocket({ userId: user?.id });

useEffect(() => {
  if (!socket) return;
  const handler = () => fetchNotifications();
  socket.on("request-status-changed", handler);
  socket.on("new-notification", handler);
  return () => {
    socket.off("request-status-changed", handler);
    socket.off("new-notification", handler);
  };
}, [socket]);
```

**Step 2: Commit**

```bash
git add src/app/dashboard/notifications/page.tsx
git commit -m "feat: realtime notifications"
```

---

### Task 16: Build and verify

**Step 1: Run build**

```bash
npm run build
```

Fix any TypeScript errors.

**Step 2: Manual testing checklist**

- [ ] User without org sees "Нет организации" on equipment pages
- [ ] User with one org sees equipment immediately (no switcher)
- [ ] User with multiple orgs sees org switcher (no "Личное" option)
- [ ] Creating equipment requires organization
- [ ] Equipment CRUD works within organization
- [ ] Bulk operations work
- [ ] Equipment changes by one org member appear in realtime for others
- [ ] Admin sees new user registrations in realtime
- [ ] User sees request status changes in realtime
- [ ] Org member changes appear in realtime
- [ ] Socket connects/disconnects cleanly

**Step 3: Commit fixes if any**
