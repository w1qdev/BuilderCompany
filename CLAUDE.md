# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

- `npm run dev` — start development server (localhost:3000)
- `npm run build` — production build
- `npm run lint` — ESLint
- `npx prisma migrate dev --name <name>` — create and apply DB migration
- `npx prisma generate` — regenerate Prisma client after schema changes
- `npx prisma studio` — visual DB browser

## Architecture

Next.js 14 App Router site for a metrology and certification center (Russian language UI). Single-page marketing site with backend for lead capture.

### Data Flow

ContactForm (in Modal) → `POST /api/submit` → Prisma (SQLite) → async notifications (Email via Nodemailer + Telegram Bot API). Notifications fail gracefully and don't block the API response.

### API Routes

All under `src/app/api/`:
- `POST /api/submit` — save lead request to DB, trigger notifications
- `GET /api/admin?status=&page=` — list requests (protected by `x-admin-password` header)
- `PATCH /api/admin/[id]` — cycle request status (`new` → `in_progress` → `done`)

Admin auth is header-based (`x-admin-password` checked against `ADMIN_PASSWORD` env var).

### Key Directories

- `src/components/` — client components with Framer Motion animations
- `src/lib/` — server utilities: `prisma.ts` (singleton client), `email.ts` (Nodemailer), `telegram.ts` (Bot API)
- `src/app/admin/` — admin dashboard (client-side auth, request table with filters)
- `prisma/` — schema and SQLite database

### Styling

Tailwind CSS with custom warm-orange palette defined in `tailwind.config.ts`. Custom utility classes (`gradient-primary`, `gradient-dark`, `text-gradient`) in `globals.css`. Path alias: `@/*` → `./src/*`.

### Database

Single `Request` model in Prisma with SQLite. Status values: `"new"`, `"in_progress"`, `"done"`. Prisma v5 (`prisma-client-js` generator). Deployed on Render.com with persistent disk.

## Environment Variables

See `.env.example`. Required for notifications: SMTP config (email) and Telegram bot token/chat ID. `ADMIN_PASSWORD` secures the admin panel.
