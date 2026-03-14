# Executor Matching by Equipment Type — Design Document

> **Date:** 2026-03-14
> **Status:** Approved

## Goal

Replace primitive substring-based executor matching with a structured system that considers both **service type** and **equipment type**. Each executor has explicit specializations, and matching requires full coverage of all request items.

## 1. Equipment Type Catalog (EquipmentType)

New Prisma model:

```prisma
model EquipmentType {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  category  String?
  createdAt DateTime @default(now())

  specializations ExecutorSpecialization[]
  requestItems    RequestItem[]
}
```

- Pre-seeded with common types: Весы, Манометры, Термометры, Мультиметры, Осциллографы, Камеры тепла/холода, etc.
- Admin manages via settings page (CRUD list)
- Users select from catalog when creating requests (autocomplete with "suggest new" option)

## 2. Executor Specializations (ExecutorSpecialization)

New join table linking executors to their capabilities:

```prisma
model ExecutorSpecialization {
  id              Int           @id @default(autoincrement())
  executorId      Int
  executor        Executor      @relation(fields: [executorId], references: [id], onDelete: Cascade)
  serviceType     String        // "Поверка СИ", "Калибровка", "Аттестация ИО"
  equipmentTypeId Int
  equipmentType   EquipmentType @relation(fields: [equipmentTypeId], references: [id], onDelete: Cascade)

  @@unique([executorId, serviceType, equipmentTypeId])
  @@index([executorId])
  @@index([equipmentTypeId])
}
```

One executor can have many specializations. Example:
```
Executor "МетроСервис":
  - Поверка СИ → Весы
  - Поверка СИ → Манометры
  - Калибровка → Мультиметры

Executor "КалибрПро":
  - Калибровка → Мультиметры
  - Калибровка → Осциллографы
  - Аттестация ИО → Камеры тепла/холода
```

## 3. Request Item ↔ Equipment Type Link

Add optional FK to `RequestItem`:

```prisma
model RequestItem {
  // ... existing fields ...
  equipmentTypeId Int?
  equipmentType   EquipmentType? @relation(fields: [equipmentTypeId], references: [id], onDelete: SetNull)
}
```

Populated via autocomplete in ContactForm. Admin can also set it manually.

## 4. Matching Algorithm

```
Input: Request with items[] where each item has (service, equipmentTypeId?)

1. Collect required pairs: [(service, equipmentTypeId)] from items
   - Skip items without equipmentTypeId (they don't constrain matching)
2. For each active executor:
   a. Load their specializations
   b. Check if executor covers ALL required pairs
   c. A pair matches if executor has a specialization with
      matching serviceType AND equipmentTypeId
3. Results:
   - One or more executors cover everything → pick first (or best by history)
   - No executor covers everything → no auto-match, goes to dispatch modal
4. Fallback: if no items have equipmentTypeId, fall back to old
   substring-based matching on Executor.services field
```

## 5. Data Flow

### Request Submission
```
User fills ContactForm
  → selects service type per item
  → selects equipment type from autocomplete (EquipmentType catalog)
  → POST /api/submit
    → creates Request + RequestItems with equipmentTypeId
    → runs matching algorithm
    → semi-auto: creates ExecutorRequest with pending_approval (or no match)
    → auto: sends email immediately (or no match → dispatch modal)
```

### Admin Executor Management
```
Admin opens /admin/executors
  → creates/edits executor
  → "Специализации" section: structured table
    → each row: select serviceType + multi-select equipmentTypes
  → saves specializations via API
```

## 6. API Changes

### New Endpoints

**`GET /api/admin/equipment-types`** — list all equipment types
**`POST /api/admin/equipment-types`** — create new type `{ name, category? }`
**`PATCH /api/admin/equipment-types/[id]`** — update type
**`DELETE /api/admin/equipment-types/[id]`** — delete type (only if not referenced)
**`GET /api/equipment-types`** — public list for ContactForm autocomplete

### Modified Endpoints

**`POST/PUT /api/admin/executors`** — accept `specializations` array:
```json
{
  "name": "МетроСервис",
  "email": "...",
  "specializations": [
    { "serviceType": "Поверка СИ", "equipmentTypeId": 1 },
    { "serviceType": "Поверка СИ", "equipmentTypeId": 2 },
    { "serviceType": "Калибровка", "equipmentTypeId": 3 }
  ]
}
```
On save: delete old specializations, insert new ones (replace strategy).

**`POST /api/submit`** — RequestItems now include `equipmentTypeId`.

## 7. UI Changes

### Executor Form (admin/executors)
Replace free-text `services` input with structured specializations editor:
- Section header "Специализации"
- Table rows: [Service Type dropdown] + [Equipment Types multi-select]
- "Добавить специализацию" button
- Each service type can have multiple equipment types (chips/tags)

### ContactForm / Request Items
- Replace free-text `object` with autocomplete from EquipmentType catalog
- Autocomplete shows matches as user types
- Option "Не нашли? Предложить новый тип" → creates suggestion (admin approves)
- Keep `object` field as free-text fallback (for description/details)

### Admin Settings
New section "Типы оборудования":
- Searchable list of equipment types
- Add/edit/delete
- Show usage count (how many specializations + request items reference it)

### Dispatch Modal
When no executor covers all items:
- Show which items are not covered and why
- Show partial matches (executors that cover some items)
- Allow admin to assign manually

## 8. Migration Strategy

- Keep `Executor.services` JSON field (don't remove)
- Matching algorithm tries new specializations first
- Falls back to old substring matching if no specializations exist
- Admin can gradually populate specializations for each executor

## 9. File Changes

### New Files
- `src/app/api/admin/equipment-types/route.ts` — CRUD for types
- `src/app/api/admin/equipment-types/[id]/route.ts` — update/delete
- `src/app/api/equipment-types/route.ts` — public list

### Modified Files
- `prisma/schema.prisma` — add EquipmentType, ExecutorSpecialization models, RequestItem.equipmentTypeId
- `src/lib/executorMatcher.ts` — new matching algorithm
- `src/app/api/admin/executors/route.ts` or page — handle specializations CRUD
- `src/app/admin/executors/page.tsx` — specializations editor UI
- `src/components/ContactForm.tsx` — equipment type autocomplete
- `src/app/admin/settings/page.tsx` — equipment types management section
- `src/app/admin/dispatch-modal.tsx` — show coverage gaps

### Seed Data
Initial equipment types (in migration or seed):
- Весы, Манометры, Термометры, Термопары, Мультиметры, Осциллографы
- Вольтметры, Амперметры, Частотомеры, Генераторы сигналов
- Камеры тепла/холода, Барокамеры, Вибростенды
- Линейки, Штангенциркули, Микрометры, Нутромеры
- Расходомеры, Уровнемеры, Счётчики газа/воды
