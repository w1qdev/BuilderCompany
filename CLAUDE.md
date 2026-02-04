# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

- `npm run dev` — start dev server via custom `server.js` (Socket.IO + Next.js, localhost:3000)
- `npm run build` — production build (`next build`)
- `npm run start` — production start (`cross-env NODE_ENV=production node server.js`)
- `npm run lint` — ESLint (`next lint`)
- `npx prisma migrate dev --name <name>` — create and apply DB migration
- `npx prisma generate` — regenerate Prisma client (also runs automatically via `postinstall`)
- `npx prisma studio` — visual DB browser

## Architecture

Next.js 14 App Router site for a metrology and certification center (Russian language UI). Marketing site with lead capture, user auth, admin dashboard with real-time updates, and a user-facing dashboard with tools.

### Custom Server

`server.js` wraps Next.js in a plain Node.js HTTP server to layer **Socket.IO** on top (`/api/socketio`). The `io` instance is stored on `globalThis.io` so API routes can emit events. Both `dev` and `start` scripts go through this file.

### Data Flow

```
ContactForm (in Modal)
  → POST /api/submit
    → validate input
    → optionally link to logged-in User (via JWT)
    → save Request to SQLite
    → emit Socket.IO "new-request" event (real-time admin update)
    → async (non-blocking): Email notification + Confirmation email + Telegram notification
  ← { success, id }
```

File uploads go through a separate `POST /api/upload` before form submission; the resulting `filePath` is attached to the Request.

### API Routes

All under `src/app/api/`:

**Auth (JWT cookie-based)**
- `POST /api/auth/register` — register user (bcrypt password, rate-limited: 3/15 min)
- `POST /api/auth/login` — login, returns `auth-token` httpOnly cookie (rate-limited: 5/15 min)
- `POST /api/auth/logout` — clears `auth-token` cookie
- `GET  /api/auth/me` — returns current user info (verifies JWT)

**Leads / Requests**
- `POST /api/submit` — save lead request, trigger notifications + Socket.IO event
- `GET  /api/user/requests?page=` — current user's requests (requires JWT auth, paginated)

**File Uploads**
- `POST /api/upload` — upload file (PDF, Word, JPEG, PNG, WebP; 10 MB max) → saved to `uploads/`
- `GET  /api/uploads/[...path]` — serve uploaded files

**Admin (header-based: `x-admin-password`)**
- `GET    /api/admin?status=&page=&search=&sort=&order=` — list requests with filtering, search, sorting, pagination (20/page)
- `PATCH  /api/admin/[id]` — cycle status: `new` → `in_progress` → `done`
- `DELETE /api/admin/[id]` — remove a request
- `GET    /api/admin/stats` — dashboard stats (counts by status)
- `GET/PUT /api/admin/settings` — read/update notification & contact settings (persisted in `Setting` model)
- `POST  /api/admin/password` — change admin password (rate-limited, bcrypt-hashed, stored in DB)

**Public Settings**
- `GET /api/settings/public` — returns site-wide settings for the frontend (read from `Setting` model)

Admin auth: `verifyAdminPassword()` in `src/lib/adminAuth.ts` checks the provided password against a bcrypt hash stored in the `Setting` model; falls back to `ADMIN_PASSWORD` env var if no DB hash exists.

### Key Directories

- `src/components/` — client components with Framer Motion animations; includes marketing sections (Hero, Services, About, etc.), interactive tools (Calculator, ContactForm, Atom3D), and shadcn/ui primitives under `ui/`
- `src/lib/` — server utilities:
  - `prisma.ts` — singleton Prisma client
  - `jwt.ts` — exports `JWT_SECRET` (throws if missing)
  - `adminAuth.ts` — admin password verification (bcrypt + DB/env fallback)
  - `email.ts` — Nodemailer: `sendEmailNotification()`, `sendConfirmationEmail()`
  - `telegram.ts` — Telegram Bot API: `sendTelegramNotification()`
  - `rateLimit.ts` — IP-based in-memory rate limiter (`createRateLimiter()`)
  - `socket.ts` — returns `globalThis.io` Socket.IO instance
  - `SiteSettingsContext.tsx` — React context that provides public site settings app-wide
- `src/app/admin/` — admin dashboard (`page.tsx`) + settings page (`settings/page.tsx`); session-based client auth (password in sessionStorage)
- `src/app/dashboard/` — user dashboard after login; sub-pages: `calculator/`, `converter/`, `accuracy/`, `gosts/`
- `src/app/login/`, `src/app/register/` — auth pages
- `src/app/contacts/`, `src/app/portfolio/`, `src/app/privacy/`, `src/app/sitemap/` — static/informational pages
- `prisma/` — schema and SQLite database
- `uploads/` — user-uploaded files (served via `/api/uploads/`)

### Styling

Tailwind CSS with custom warm-orange palette defined in `tailwind.config.ts`. Custom utility classes (`gradient-primary`, `gradient-dark`, `text-gradient`) in `globals.css`. Dark mode via `class` strategy. Path alias: `@/*` → `./src/*`.

### Database

SQLite via Prisma v5. Three models:

- **User** — `id`, `email` (unique), `password` (bcrypt), `name`, `phone?`, `company?`, `createdAt`, has many `Request`s
- **Request** — `id`, `name`, `phone`, `email`, `service`, `message?`, `fileName?`, `filePath?`, `status` (`new` | `in_progress` | `done`), `createdAt`, optional `userId` FK → `User`
- **Setting** — key/value store (`key` PK, `value` string); used for notification toggles, contact info, hashed admin password

Dev DB: `prisma/dev.db`. Production (Render.com): `/data/prod.db` on persistent disk.

## Environment Variables

See `.env.example`. Key variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Prisma connection string |
| `SMTP_HOST/PORT/USER/PASS` | Nodemailer SMTP config |
| `NOTIFY_EMAIL` | Admin notification recipient |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API token |
| `TELEGRAM_CHAT_ID` | Telegram chat to post in |
| `ADMIN_PASSWORD` | Fallback admin password (plain-text; bypassed once a bcrypt hash is saved in DB via `/api/admin/password`) |
| `JWT_SECRET` | Secret for signing user auth tokens (required) |
