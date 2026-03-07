# Убираем личное оборудование + Realtime — дизайн-документ

**Дата:** 2026-03-07

## Цель

1. Убрать разделение на личное/организационное оборудование. Всё оборудование принадлежит организации. Без организации — нет доступа к оборудованию.
2. Добавить realtime обновления на все ключевые страницы (кроме корневой).

---

## 1. Оборудование — убираем личное

### Модель (Prisma)
- `organizationId` становится обязательным (Int, не nullable)
- Миграция: удалить все записи с `organizationId IS NULL`, затем сделать поле required

### API
- **GET /api/equipment** — всегда требует `organizationId` в query params, проверяет членство
- **POST /api/equipment** — `organizationId` обязателен, без него 400
- **PATCH/DELETE** — `canAccessOrgEquipment` остаётся, упрощается (всегда через org)
- **Bulk, import, export, request** — аналогично

### UI (EquipmentList.tsx)
- Убрать переключатель "Личное / Организация"
- 1 организация → сразу показываем оборудование
- Несколько организаций → выбор (без варианта "Личное")
- Нет организации → заглушка "Создайте или вступите в организацию"

### orgAccess.ts
- `canAccessOrgEquipment` — упростить: проверять только org membership (убрать ветку personal)

---

## 2. Realtime — Socket.IO

### Комнаты
- `org:{orgId}` — оборудование + членство
- `user:{userId}` — заявки + уведомления
- `admin` — новые пользователи

### События

| Событие | Комната | Триггер (API route) |
|---------|---------|---------------------|
| `equipment-changed` | `org:{orgId}` | POST/PATCH/DELETE /api/equipment |
| `org-member-changed` | `org:{orgId}` | POST/DELETE /api/organizations/members |
| `request-status-changed` | `user:{userId}` | PATCH /api/admin/[id] (смена статуса) |
| `new-notification` | `user:{userId}` | Любое уведомление |
| `new-user-registered` | `admin` | POST /api/auth/register |

### Клиент
- Хук `useSocket` (`src/lib/useSocket.ts`): подключение, join-rooms, подписка
- Страницы слушают события и вызывают refetch данных
- Админка (`admin/users`) слушает `new-user-registered`

### Серверная часть (server.js)
- Обработка `join-rooms` — добавление в комнаты по userId + orgIds
- Валидация: клиент передаёт userId, сервер может проверять

---

## Что НЕ меняется
- Разделение СИ/ИО (средства измерений / испытательное оборудование)
- Структура страниц оборудования и графиков
- Логика статусов (active/pending/expired)
- Arshin интеграция
- Страница организации (управление членами)
