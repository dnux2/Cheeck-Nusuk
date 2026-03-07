# CheckNusuk – Hajj & Pilgrim Management Platform

## Overview

CheckNusuk is a modern web application inspired by the Saudi Nusuk (nusuk.sa) platform. It provides two core capabilities:

1. **Pilgrim Services** – Hajj/Umrah permit applications, transport booking, and pilgrim registry management.
2. **Smart Crowd Management** – AI-powered real-time crowd monitoring, security alerts, emergency response, field translator, and supervisor↔pilgrim chat/messaging.

The platform targets Hajj supervisors and administrators who need a unified control center for tracking pilgrims, managing emergencies, and monitoring crowd density across sectors.

**Two portals:**
- **Admin/Supervisor portal** (`/dashboard` and all sidebar routes) — dark emerald design with full management tools
- **Pilgrim portal** (`/pilgrim/*`) — uses the shared design system CSS variables (bg-card, bg-secondary, text-primary, etc.) — same visual language as landing/admin. Desktop sidebar + mobile bottom nav:
  - `/pilgrim` — Home: greeting banner, SOS button, landing-page-style action cards, Hajj journey steps, prayer times
  - `/pilgrim/map` — Guide map: Leaflet with 24 real facility markers (hospitals, water, mosques, bathrooms, transport) + route guidance
  - `/pilgrim/wallet` — Digital wallet: permit card + health data (blood type, allergies, conditions) + editable form
  - `/pilgrim/hajj-notes` — Hajj Journal: write notes per Hajj stage (7 stages). Saved to `hajj_notes` DB table. PATCH/GET API.
  - `/pilgrim/chat` — Supervisor chat with message history
  - `/pilgrim/translator` — AI translator with voice input, 8 languages

---

## User Preferences

Preferred communication style: Simple, everyday language.

---

## System Architecture

### Frontend Architecture

- **Framework**: React (Vite + TSX), single-page application with client-side routing via `wouter`.
- **Styling**: Tailwind CSS with a custom Nusuk-inspired theme (deep emerald green `#0E4D41` as primary, gold/sand as accent). CSS variables defined in `index.css` enable light/dark mode switching.
- **UI Components**: shadcn/ui (Radix UI primitives) with "new-york" style — all components live in `client/src/components/ui/`.
- **State Management**: TanStack React Query for all server state (fetch, cache, mutations). No global Redux/Zustand store.
- **Animations**: Framer Motion for page transitions, stat card reveals, and interactive elements.
- **Charts**: Recharts for crowd density area charts on the dashboard.
- **Internationalization**: Custom i18n system in `client/src/lib/i18n.ts` supporting English and Arabic. A `LanguageContext` manages RTL layout switching (flips flex direction, font families swap to Cairo/Tajawal for Arabic).
- **Map**: CSS-grid interactive mock map (`MockMap` component) — no heavy WebGL/Leaflet dependency, uses deterministic positioning seeded from passport numbers.

**Page Structure:**
| Route | Component | Purpose |
|---|---|---|
| `/` | `LandingPage` | Public hero/marketing page |
| `/dashboard` | `Dashboard` | KPI overview, live map, crowd chart |
| `/pilgrims` | `PilgrimsPage` | Pilgrim registry with search/filter |
| `/crowd-management` | `CrowdManagementPage` | Heatmap and sector status |
| `/security` | `SecurityPage` | AI camera feed simulation, alerts |
| `/emergencies` | `EmergenciesPage` | SOS button, active emergency list |
| `/services` | `ServicesPage` | Permit application, transport booking |
| `/translator` | `TranslatorPage` | AI-powered field translation |

### Backend Architecture

- **Runtime**: Node.js with Express 5 (`server/index.ts`), served via `tsx` in development and compiled with esbuild for production.
- **API**: REST endpoints defined in `shared/routes.ts` with Zod schemas for both input validation and response typing. All routes prefixed with `/api`.
- **Storage Layer**: `DatabaseStorage` class in `server/storage.ts` implementing the `IStorage` interface — clean separation allowing future swap to in-memory or other backends.
- **AI Integration**: OpenAI client (`server/routes.ts`) via environment variables `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL`. Routes support text translation and can be extended for voice/image.
- **AI Crowd Assessment** (`POST /api/crowd/assess`): Calls `getMeccaContext()` (Aladhan API for real Hijri date, prayer times, season) then GPT-4.1-mini with full Islamic calendar context. Returns per-zone `load`, `status`, `confidence`, `reasoningAr/En`, `summaryAr/En`, and `context` (hijriDate, nextPrayer, nearPrayer). 15-min server-side cache. Frontend polls every 15 min via TanStack Query, updating sector heatmap and sidebar UI (AI banner, confidence badges, expandable reasoning).
- **Build**: Vite handles the frontend build (`dist/public`); esbuild bundles the server to `dist/index.cjs` with key dependencies inlined (see `script/build.ts` allowlist) to reduce cold start time.

**Replit Integration Modules** (`server/replit_integrations/`):
- `chat/` – Conversation and message CRUD with SSE streaming via OpenAI.
- `audio/` – Voice recording (browser MediaRecorder), PCM16 decoding, AudioWorklet playback, speech-to-text and TTS via OpenAI.
- `image/` – Image generation and editing via `gpt-image-1`.
- `batch/` – Generic batch processor with concurrency limiting (`p-limit`) and retries (`p-retry`) for bulk LLM calls.

### Data Storage

- **Database**: PostgreSQL via Drizzle ORM (`drizzle-orm/node-postgres`). Connection managed by a `pg.Pool` in `server/db.ts`.
- **Schema** (`shared/schema.ts`):
  - `pilgrims` – Core table: name, nationality, passport number, phone, campaign group, permit status (`Valid`/`Expired`/`Pending`), GPS coordinates, emergency status, plus health fields: bloodType, allergies, medicalConditions, emergencyContact, healthStatus (`Good`/`Stable`/`NeedsAttention`).
  - `emergencies` – Links to pilgrim, stores type (`Medical`/`Lost`/`Security`), status, GPS, timestamp.
  - `alerts` – System alerts: type (`Unauthorized`/`Crowd Density`/`Weather`), message, GPS, status.
  - `hajj_notes` – Pilgrim journal entries: links to pilgrim, stageKey (tarwiyah/arafat/muzdalifah/eid/tashreeq_11/tashreeq_12/farewell), note text, updatedAt. Upserted on save.
  - `conversations` + `messages` – AI chat history (defined in `shared/models/chat.ts`, used by Replit integration chat storage).
- **Migrations**: Drizzle Kit (`drizzle-kit push`) reads `shared/schema.ts` and pushes to PostgreSQL.

### Shared Code Pattern

The `shared/` directory contains code used by both client and server:
- `shared/schema.ts` – Drizzle table definitions + Zod insert schemas + TypeScript types.
- `shared/routes.ts` – API route definitions with HTTP method, path, input schema, and response schemas. Clients import these directly to ensure type-safe fetches.

This eliminates API drift between frontend hooks and backend handlers.

### Authentication

No authentication system is currently implemented. The platform is designed for internal admin use. Sessions could be added using `express-session` + `connect-pg-simple` (both already in dependencies).

---

## External Dependencies

| Dependency | Purpose |
|---|---|
| **PostgreSQL** | Primary relational database (requires `DATABASE_URL` env var) |
| **OpenAI API** | Text translation, voice chat (STT/TTS), image generation — accessed via `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` |
| **Google Fonts** | Cairo, Tajawal (Arabic), Plus Jakarta Sans, Outfit, DM Sans (English) loaded via CDN in `index.html` |
| **Drizzle ORM** | Type-safe PostgreSQL query builder and migration tool |
| **TanStack React Query** | Server state fetching, caching, and mutation management |
| **Framer Motion** | Animation library for transitions and interactive UI effects |
| **Recharts** | Chart library for crowd density visualizations |
| **Radix UI / shadcn** | Accessible headless UI primitives styled with Tailwind |
| **Wouter** | Lightweight client-side router |
| **Zod** | Schema validation shared between client and server |
| **p-limit / p-retry** | Concurrency control and retry logic for batch AI processing |
| **date-fns** | Date formatting throughout the UI |

### Environment Variables Required

```
DATABASE_URL                        # PostgreSQL connection string
AI_INTEGRATIONS_OPENAI_API_KEY      # OpenAI API key
AI_INTEGRATIONS_OPENAI_BASE_URL     # OpenAI base URL (Replit AI Integrations proxy)
```