# Структура проекта ЦСМ (csm-center.ru)

Next.js 15 App Router + Socket.IO + Prisma (SQLite). Сайт центра стандартизации и метрологии. Русскоязычный UI.

## Стек

- **Frontend:** Next.js 15, React, Tailwind CSS, Framer Motion, shadcn/ui
- **Backend:** Next.js API Routes, Socket.IO (real-time), Prisma ORM
- **БД:** SQLite (`prisma/dev.db`, продакшен `/data/prod.db`)
- **Авторизация:** JWT (httpOnly cookie `auth-token`), bcrypt
- **Уведомления:** Nodemailer (SMTP), Telegram Bot API, Max (VK Teams)
- **Деплой:** Docker на VPS, nginx + SSL, `deploy.sh`

## Кастомный сервер

`server.js` — оборачивает Next.js в HTTP-сервер с Socket.IO (`/api/socketio`). Экземпляр `io` хранится в `globalThis.io`. Используется и в dev, и в production.

---

## База данных (Prisma)

| Модель | Назначение |
|---|---|
| **User** | Пользователи (email, password, name, phone?, company?) → has many Request, Equipment |
| **Request** | Заявки (контакты, услуга, статус `new/in_progress/done`, ценообразование) |
| **RequestFile** | Файлы заявки (fileName, filePath) → belongs to Request, cascade delete |
| **RequestItem** | Позиции заявки (услуга, поверка, объект, зав.номер, реестр) → belongs to Request |
| **Service** | Услуги (title, description, price, category, isActive) — управляются из админки |
| **Equipment** | Оборудование пользователя (СИ/ИО, сроки поверки, интервал, статус) |
| **Setting** | Key-value хранилище (контакты, настройки уведомлений, хеш пароля админа) |
| **PasswordReset** | Токены сброса пароля (token, expiresAt, used) |
| **PageView** | Аналитика просмотров (url, userAgent, ip, userId?) |

---

## API-маршруты (`src/app/api/`)

### Авторизация (`/api/auth/`)
| Маршрут | Метод | Описание |
|---|---|---|
| `/auth/register` | POST | Регистрация (rate-limit 3/15мин) |
| `/auth/login` | POST | Вход, выдаёт cookie (rate-limit 5/15мин) |
| `/auth/logout` | POST | Очистка cookie |
| `/auth/me` | GET | Текущий пользователь по JWT |
| `/auth/change-password` | POST | Смена пароля (из ЛК) |
| `/auth/forgot-password` | POST | Запрос сброса пароля → email |
| `/auth/reset-password` | POST | Установка нового пароля по токену |

### Заявки
| Маршрут | Метод | Описание |
|---|---|---|
| `/submit` | POST | Создание заявки + Socket.IO event + уведомления (email, Telegram, Max) |
| `/upload` | POST | Загрузка файла (PDF/Word/JPEG/PNG/WebP, макс 10МБ) → `uploads/` |
| `/uploads/[...path]` | GET | Отдача загруженных файлов |
| `/user/requests` | GET | Заявки текущего пользователя (пагинация) |

### Админка (`/api/admin/`, заголовок `x-admin-password`)
| Маршрут | Метод | Описание |
|---|---|---|
| `/admin` | GET | Список заявок (фильтр, поиск, сортировка, пагинация, экспорт) |
| `/admin/[id]` | PATCH/DELETE | Смена статуса / ценообразование / удаление заявки |
| `/admin/stats` | GET | Статистика (кол-во по статусам) |
| `/admin/settings` | GET/PUT | Настройки уведомлений и контактов |
| `/admin/password` | POST | Смена пароля админа |
| `/admin/services` | GET/POST | CRUD услуг |
| `/admin/services/[id]` | PUT/DELETE | Редактирование/удаление услуги |
| `/admin/analytics` | GET | Данные аналитики |
| `/admin/export/[id]` | GET | Экспорт заявки в Excel |

### Оборудование (`/api/equipment/`)
| Маршрут | Метод | Описание |
|---|---|---|
| `/equipment` | GET/POST | Список / добавление оборудования пользователя |
| `/equipment/[id]` | PUT/DELETE | Редактирование / удаление |
| `/equipment/export` | GET | Экспорт в Excel |
| `/equipment/export-word` | GET | Экспорт графика в Word |
| `/equipment/import` | POST | Импорт из Excel |
| `/equipment/request` | POST | Создание заявки из оборудования |

### Прочее
| Маршрут | Метод | Описание |
|---|---|---|
| `/services` | GET | Публичный список активных услуг |
| `/settings/public` | GET | Публичные настройки сайта (телефон, email, адрес) |
| `/analytics/track` | POST | Трекинг просмотров страниц |
| `/cron/notifications` | GET | Крон: рассылка напоминаний о поверке (за 14 дней) |

---

## Страницы

### Публичные
| Путь | Описание |
|---|---|
| `/` | Главная (Hero, Services, About, Process, Portfolio, FAQ, Contacts) |
| `/contacts` | Контакты + Яндекс.Карта |
| `/portfolio` | Портфолио работ |
| `/privacy` | Политика конфиденциальности |
| `/sitemap` | HTML-карта сайта |
| `/login` | Вход |
| `/register` | Регистрация |
| `/forgot-password` | Запрос сброса пароля |
| `/reset-password` | Установка нового пароля |

### Личный кабинет (`/dashboard/`)
| Путь | Описание |
|---|---|
| `/dashboard` | Главная ЛК (быстрые действия, статистика) |
| `/dashboard/requests` | Мои заявки (список, детали, создание новой) |
| `/dashboard/equipment/si` | Оборудование: Средства измерений |
| `/dashboard/equipment/io` | Оборудование: Испытательное оборудование |
| `/dashboard/schedule/si` | График поверки СИ (таблица + экспорт Word) |
| `/dashboard/schedule/io` | График аттестации ИО (таблица + экспорт Word) |
| `/dashboard/profile` | Профиль + смена пароля |
| `/dashboard/companies` | Справочник организаций |
| `/dashboard/calculator` | Калькулятор погрешностей |
| `/dashboard/converter` | Конвертер единиц измерения |
| `/dashboard/accuracy` | Классы точности |
| `/dashboard/uncertainty` | Расчёт неопределённости |
| `/dashboard/protocol` | Генератор протоколов |
| `/dashboard/gosts` | Справочник ГОСТов |

### Админ-панель (`/admin/`)
| Путь | Описание |
|---|---|
| `/admin` | Заявки (таблица, фильтры, поиск, ценообразование, экспорт CSV/Excel) |
| `/admin/analytics` | Аналитика (графики, метрики посещаемости) |
| `/admin/services` | Управление услугами (CRUD) |
| `/admin/settings` | Настройки (уведомления, контакты, пароль) |

---

## Компоненты (`src/components/`)

### Маркетинговые секции (главная страница)
`Hero`, `Services`, `About`, `Process`, `Portfolio`, `Certificates`, `FAQ`, `Testimonials`, `Partners`, `Payment`, `Delivery`, `Science`, `EquipmentShowcase`

### Интерактивные
- `ContactForm` — форма заявки (множественные позиции, загрузка файлов, валидация)
- `Modal` — обёртка для ContactForm в модальном окне
- `Calculator` — калькулятор погрешностей
- `EquipmentList` — таблица оборудования с CRUD
- `ScheduleView` — вид графика поверки/аттестации
- `YandexMap` — Яндекс.Карта на странице контактов

### UI / Layout
- `Header`, `Footer` — шапка и подвал сайта
- `Logo` — логотип
- `ThemeProvider`, `ThemeToggle` — тёмная тема (class strategy)
- `BackToTop`, `ScrollProgress` — UX-элементы
- `CookieConsent` — баннер cookies
- `AnimatedCounter`, `RotatingText`, `Atom3D` — анимации
- `PageViewTracker` — трекинг просмотров

### shadcn/ui (`ui/`)
`badge`, `checkbox`, `input`, `label`, `select`, `table`, `textarea`, `tooltip`

---

## Утилиты (`src/lib/`)

| Файл | Назначение |
|---|---|
| `prisma.ts` | Singleton Prisma-клиента |
| `jwt.ts` | Экспорт `JWT_SECRET` |
| `adminAuth.ts` | Проверка пароля админа (bcrypt + DB/env fallback) |
| `email.ts` | Nodemailer: уведомления админу (с Excel-вложением), подтверждение клиенту, напоминание о поверке, сброс пароля |
| `telegram.ts` | Telegram Bot API уведомления |
| `max.ts` | Max (VK Teams) уведомления |
| `rateLimit.ts` | IP rate limiter (in-memory) |
| `socket.ts` | Геттер `globalThis.io` |
| `SiteSettingsContext.tsx` | React-контекст: публичные настройки сайта (телефон, email, адрес) |
| `AdminAuthContext.tsx` | React-контекст: авторизация админа (пароль в sessionStorage) |
| `usePageView.ts` | Хук трекинга просмотров |
| `utils.ts` | Утилиты (cn — clsx + tailwind-merge) |

---

## Ключевые потоки данных

### Создание заявки
```
ContactForm → POST /api/upload (каждый файл) → POST /api/submit
  → валидация → сохранение Request + RequestItem[] + RequestFile[]
  → Socket.IO "new-request" → админка обновляется в реальном времени
  → async: Email (админу с Excel + файлами) + Email (подтверждение клиенту) + Telegram + Max
```

### Авторизация пользователя
```
POST /api/auth/login → bcrypt verify → JWT в httpOnly cookie "auth-token"
GET /api/auth/me → проверка JWT → данные пользователя
```

### Авторизация админа
```
Пароль → sessionStorage → заголовок "x-admin-password" в каждом запросе
→ verifyAdminPassword() → bcrypt compare с хешем из Setting / fallback ADMIN_PASSWORD env
```

---

## Файловая структура верхнего уровня

```
├── prisma/              # Схема, миграции, dev.db
├── public/images/       # Статические изображения (hero/, portfolio/)
├── uploads/             # Загруженные пользователями файлы
├── src/
│   ├── app/             # Next.js App Router (страницы + API)
│   ├── components/      # React-компоненты
│   └── lib/             # Серверные утилиты и React-контексты
├── server.js            # Кастомный сервер (Next.js + Socket.IO)
├── tailwind.config.ts   # Tailwind: warm-orange палитра
├── Dockerfile           # Docker-образ для деплоя
├── deploy.sh            # Скрипт деплоя (build + swap)
├── nginx.conf           # Nginx: SSL, проксирование, HTTPS redirect
└── .env                 # Переменные окружения
```
