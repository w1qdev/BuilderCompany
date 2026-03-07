# Org Equipment Sharing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow organization members to share equipment — view, create, edit, delete, and submit requests from org equipment with a UI switcher.

**Architecture:** Add an `organizationId` param to equipment creation, replace `userId`-only ownership checks in PATCH/DELETE/bulk/request with a helper `canAccessOrgEquipment()`, and add a switcher UI in EquipmentList that toggles between personal and org equipment.

**Tech Stack:** Next.js 14 App Router, Prisma (SQLite), React, Tailwind CSS

---

### Task 1: Create `canAccessOrgEquipment` helper

**Files:**
- Create: `src/lib/orgAccess.ts`

**Step 1: Create the helper**

```typescript
import { prisma } from "@/lib/prisma";

/**
 * Check if user can access equipment belonging to a specific organization.
 * Returns true if user is a member of the equipment's organization.
 */
export async function canAccessOrgEquipment(userId: number, equipmentId: number): Promise<boolean> {
  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    select: { userId: true, organizationId: true },
  });
  if (!equipment) return false;
  // Personal equipment — owner only
  if (!equipment.organizationId) return equipment.userId === userId;
  // Org equipment — any member
  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: equipment.organizationId } },
  });
  return !!membership;
}

/**
 * Check if user is a member of an organization.
 */
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
git commit -m "feat(org): add canAccessOrgEquipment and isOrgMember helpers"
```

---

### Task 2: Add `organizationId` to equipment creation API

**Files:**
- Modify: `src/lib/validation.ts:19-31` — add `organizationId` to schema
- Modify: `src/app/api/equipment/route.ts:89-134` — use `organizationId` in POST

**Step 1: Add organizationId to validation schema**

In `src/lib/validation.ts`, add to `equipmentCreateSchema`:

```typescript
organizationId: z.number().int().positive().optional().nullable(),
```

**Step 2: Update POST handler to support org equipment**

In `src/app/api/equipment/route.ts` POST handler, after validation (line ~104), add org membership check and set `organizationId` on create:

```typescript
const { name, type, serialNumber, verificationDate, nextVerification, interval, category, company, contactEmail, notes, arshinUrl, organizationId } = parsed.data;

// If creating for org, verify membership
if (organizationId) {
  const { isOrgMember } = await import("@/lib/orgAccess");
  if (!(await isOrgMember(userId, organizationId))) {
    return NextResponse.json({ error: "Нет доступа к организации" }, { status: 403 });
  }
}
```

In the `prisma.equipment.create` data (line ~110), add:

```typescript
organizationId: organizationId || null,
```

**Step 3: Commit**

```bash
git add src/lib/validation.ts src/app/api/equipment/route.ts
git commit -m "feat(org): support organizationId in equipment creation"
```

---

### Task 3: Update PATCH handler for org equipment access

**Files:**
- Modify: `src/app/api/equipment/[id]/route.ts:26-31`

**Step 1: Replace ownership check**

Replace lines 26-31 (the `findFirst` with `userId` check) with:

```typescript
const { canAccessOrgEquipment } = await import("@/lib/orgAccess");
const hasAccess = await canAccessOrgEquipment(userId, equipmentId);
if (!hasAccess) {
  return NextResponse.json({ error: "Оборудование не найдено" }, { status: 404 });
}

const existing = await prisma.equipment.findUnique({
  where: { id: equipmentId },
});
```

**Step 2: Commit**

```bash
git add src/app/api/equipment/[id]/route.ts
git commit -m "feat(org): allow org members to edit org equipment"
```

---

### Task 4: Update DELETE handler for org equipment access

**Files:**
- Modify: `src/app/api/equipment/[id]/route.ts` — DELETE handler

**Step 1: Replace ownership check in DELETE**

Same pattern as PATCH — replace `where: { id: equipmentId, userId }` with `canAccessOrgEquipment` check:

```typescript
const { canAccessOrgEquipment } = await import("@/lib/orgAccess");
const hasAccess = await canAccessOrgEquipment(userId, equipmentId);
if (!hasAccess) {
  return NextResponse.json({ error: "Оборудование не найдено" }, { status: 404 });
}

await prisma.equipment.delete({ where: { id: equipmentId } });
```

**Step 2: Commit**

```bash
git add src/app/api/equipment/[id]/route.ts
git commit -m "feat(org): allow org members to delete org equipment"
```

---

### Task 5: Update bulk operations for org equipment

**Files:**
- Modify: `src/app/api/equipment/bulk/route.ts:47-57` — ownership check
- Modify: `src/app/api/equipment/bulk/route.ts:62-84` — where clauses

**Step 1: Replace ownership verification**

Replace the `ownedCount` check (lines 47-57) with org-aware check:

```typescript
// Verify all IDs are accessible by the user (owned or org member)
const equipmentList = await prisma.equipment.findMany({
  where: { id: { in: numericIds } },
  select: { id: true, userId: true, organizationId: true },
});

if (equipmentList.length !== numericIds.length) {
  return NextResponse.json({ error: "Некоторые записи не найдены" }, { status: 404 });
}

// Check access for each equipment
const { canAccessOrgEquipment } = await import("@/lib/orgAccess");
for (const eq of equipmentList) {
  if (eq.userId !== userId) {
    if (!eq.organizationId) {
      return NextResponse.json({ error: "Нет доступа к некоторым записям" }, { status: 403 });
    }
    const { isOrgMember } = await import("@/lib/orgAccess");
    if (!(await isOrgMember(userId, eq.organizationId))) {
      return NextResponse.json({ error: "Нет доступа к некоторым записям" }, { status: 403 });
    }
  }
}
```

**Step 2: Remove `userId` from bulk operation where clauses**

Replace `where: { id: { in: numericIds }, userId }` with `where: { id: { in: numericIds } }` in all three cases (delete, archive, unarchive) — access was already verified above.

**Step 3: Commit**

```bash
git add src/app/api/equipment/bulk/route.ts
git commit -m "feat(org): support bulk operations on org equipment"
```

---

### Task 6: Update equipment request creation for org equipment

**Files:**
- Modify: `src/app/api/equipment/request/route.ts:25-27`

**Step 1: Replace ownership check**

Replace `where: { id: { in: equipmentIds }, userId }` with org-aware check:

```typescript
const equipment = await prisma.equipment.findMany({
  where: { id: { in: equipmentIds } },
});

// Verify access
const { canAccessOrgEquipment } = await import("@/lib/orgAccess");
for (const eq of equipment) {
  const hasAccess = await canAccessOrgEquipment(userId, eq.id);
  if (!hasAccess) {
    return NextResponse.json({ error: "Нет доступа к оборудованию" }, { status: 403 });
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/equipment/request/route.ts
git commit -m "feat(org): allow service requests from org equipment"
```

---

### Task 7: Add org switcher to EquipmentList UI

**Files:**
- Modify: `src/components/EquipmentList.tsx`

**Step 1: Add org state and fetching**

After existing state declarations (~line 120), add:

```typescript
// Organization switcher
interface UserOrg {
  id: number;
  name: string;
  role: string;
}
const [userOrgs, setUserOrgs] = useState<UserOrg[]>([]);
const [activeOrgId, setActiveOrgId] = useState<number | null>(null); // null = personal
```

Add org fetching in a new `useEffect`:

```typescript
useEffect(() => {
  fetch("/api/organizations")
    .then((r) => r.ok ? r.json() : { organizations: [] })
    .then((data) => setUserOrgs(data.organizations.map((o: { id: number; name: string; role: string }) => ({ id: o.id, name: o.name, role: o.role }))))
    .catch(() => {});
}, []);
```

**Step 2: Update buildEquipmentParams to include orgId**

In `buildEquipmentParams` (line ~216), add:

```typescript
if (activeOrgId) params.set("organizationId", String(activeOrgId));
```

**Step 3: Reset page and refetch when org changes**

Add a `useEffect` that triggers refetch when `activeOrgId` changes:

```typescript
useEffect(() => {
  setPage(1);
  setSelected(new Set());
}, [activeOrgId]);
```

And ensure `activeOrgId` is included in the dependency array of the main `fetchEquipment` useEffect.

**Step 4: Add switcher UI before the header**

Before the header div (line ~865), insert an org switcher (only when user has orgs):

```tsx
{userOrgs.length > 0 && (
  <div className="flex items-center gap-2 mb-4 flex-wrap">
    <button
      onClick={() => setActiveOrgId(null)}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
        activeOrgId === null
          ? "bg-primary text-white"
          : "bg-white dark:bg-dark-light text-dark dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
      }`}
    >
      Личное
    </button>
    {userOrgs.map((org) => (
      <button
        key={org.id}
        onClick={() => setActiveOrgId(org.id)}
        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
          activeOrgId === org.id
            ? "bg-primary text-white"
            : "bg-white dark:bg-dark-light text-dark dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
        }`}
      >
        {org.name}
      </button>
    ))}
  </div>
)}
```

**Step 5: Pass organizationId when creating equipment**

In the save/submit handler for the equipment form, include `organizationId: activeOrgId` in the POST body when `activeOrgId` is set.

**Step 6: Commit**

```bash
git add src/components/EquipmentList.tsx
git commit -m "feat(org): add org switcher UI and org-aware equipment CRUD"
```

---

### Task 8: Verify and test

**Step 1: Run build to check for TypeScript errors**

```bash
npm run build
```

**Step 2: Manual testing checklist**

- [ ] Create an organization, add a member
- [ ] Switch to org mode in equipment page
- [ ] Create equipment in org mode — verify `organizationId` is set in DB
- [ ] Second user sees org equipment after switching
- [ ] Edit org equipment as member
- [ ] Delete org equipment as member
- [ ] Bulk archive/unarchive org equipment
- [ ] Submit service request from org equipment
- [ ] Personal equipment still works independently

**Step 3: Final commit if any fixes needed**
