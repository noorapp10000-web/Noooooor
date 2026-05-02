# Noor App (نور)

A cross-platform Islamic companion app built with React, Vite, and Express.

## Features (v2.2+)
- **القرآن الكريم** — Quran reader with tafsir, word-by-word audio, bookmarks, and Moshaf PDF downloader (8 types)
  - **بحث في القرآن** — Full-text search across all 6236 ayahs using local JSON (quran-search.json, quran-simple edition), Arabic normalization for user input, tap result to navigate
  - **سبب النزول (تفسير ميسر)** — Tafsir Muyassar per ayah from local JSON (tafsir-muyassar.json, alquran.cloud data), fallback to API
- **الأحاديث الشريفة** — Paginated reader across 6 hadith books with cross-book search using a public Arabic hadith dataset with in-memory caching, Arabic normalization, and search results that navigate to exact page+highlight
- **التاريخ الإسلامي** — 4975 Islamic history events across 5 eras (Seerah → Ottoman), lazy-loaded per era with pagination
- **الاختبارات الإسلامية** — 5820 MCQ questions across 6 Islamic science categories, 3 levels each
- **سنن النبي ﷺ** — Prophetic Sunnah browser across 5 categories with hadith sources
- **الأذكار** — Morning/evening and daily adhkar with progress tracking
- **التسبيح** — Digital tasbih counter
- **القبلة** — Smart Qibla compass
- **الصحبة** — Community leaderboard and global dhikr tracker
- **الإذاعات الإسلامية** — Live Islamic radio (Quran + Sunnah channels)
- **القنوات الإسلامية** — Live Islamic TV channels (HLS streams) with hls.js support

## Static Data Strategy
All large content is in `public/data/` and lazy-fetched on page visit:
- `public/data/history-*.json` — Islamic history events (seerah/rashidun/umayyad/abbasid/ottoman), lazy-loaded per era
- `public/data/quizzes.json` — 4.4MB, full quiz data
- `public/data/sunnah.json` — 40KB, prophetic sunnah
- `public/data/moshaf.json` — 3.3KB, moshaf PDF links
- `public/data/quran-search.json` — 1.4MB, 6236 ayahs in quran-simple (for text search, no tashkeel)
- `public/data/tafsir-muyassar.json` — 2.5MB, Tafsir Muyassar keyed by "surah:ayah"

## Project Structure

This is a pnpm monorepo workspace.

### `artifacts/noor/`
- **React + Vite frontend** — the main web application
- Entry: `artifacts/noor/src/main.tsx`
- Built to `artifacts/noor/dist/public/`

### `artifacts/api-server/`
- **Express backend** — handles `/api/*` routes (also `/api-server/api/*` for artifact routing)
- Uses Drizzle ORM with PostgreSQL
- Built to `artifacts/api-server/dist/index.cjs` for production

### `artifacts/mockup-sandbox/`
- Isolated Vite dev environment for UI component prototyping

### `lib/`
- `lib/db` — Drizzle ORM schema and database client
- `lib/api-spec` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react` — Generated React Query hooks from OpenAPI spec
- `lib/api-zod` — Generated Zod schemas from OpenAPI spec

### `scripts/`
- `replit-dev.sh` — Main workflow script: starts Vite on port 5000, API server on port 19382, and a proxy on port 8080 → 5000 for the artifact router
- `dev-artifact.sh` — Legacy artifact dev script
- `proxy.js` — HTTP reverse proxy (forwards PROXY_PORT → TARGET_PORT)

## Development on Replit

### How It Works
The app uses Replit's artifact routing system:

1. **pid1** reads `[[artifacts]]` in `.replit` and starts its own artifact router on port 18080
2. The artifact router reads each artifact's `.replit-artifact/artifact.toml`:
   - `artifacts/noor` → routes `/` → port 8080 (proxy.js forwards to Vite on port 5000)
   - `artifacts/api-server` → routes `/api-server/` → port 19382
3. The **"Start application"** workflow (`scripts/replit-dev.sh`) starts:
   - API server on port 19382 (tsx live-reload)
   - Proxy on port 8080 → Vite port 5000
   - Vite dev server on port 5000 (waitForPort target)

### Port Architecture
- External traffic → pid1 (port 80) → artifact router (port 18080)
- `/` → artifact router → port 8080 (proxy) → port 5000 (Vite)
- `/api-server/` → artifact router → port 19382 (Express API)
- Port 5000 also mapped to external port 80 via `[[ports]]` (used as waitForPort signal)

### API Routes
The Express server handles both path prefixes:
- `/api/...` — direct access (from Vite proxy in dev)
- `/api-server/api/...` — via artifact router (from external traffic)

### Running in Development
The primary workflow is **"Start application"** which uses `scripts/replit-dev.sh`.

## Firebase

Single Firebase project: **noooooor-app** (projectId: `noooooor-app`)
- Config stored in `.replit` as `VITE_FIREBASE_*` environment variables
- Used for: Firebase Auth (Google sign-in), Firestore (global counter, leaderboard, sessions)

### Firestore Collections
- `globalCounter/main` — total tasbeeh count
- `activeSessions/{sessionId}` — tracks users actively pressing tasbeeh (TTL: 3 min)
- `sohbaLeaderboard/{userId}` — per-user leaderboard entries

## Key Configuration

- **Vite proxy**: `/api` → `http://localhost:${API_SERVER_PORT:-3001}`
- **Vite host**: `true` (binds to all interfaces)
- **Firebase**: Configured via `VITE_FIREBASE_*` environment variables

## Database

- PostgreSQL via Replit's built-in database (`DATABASE_URL` secret)
- Schema managed with Drizzle ORM in `lib/db/src/schema/`
- Tables auto-created on server startup via `artifacts/api-server/src/db-init.ts`
  - `global_counter` — global tasbeeh count
  - `sohba_leaderboard` — community leaderboard

## Production Build

```bash
bash build.sh
```

Builds the web artifact, bundles api-server to `artifacts/api-server/dist/index.cjs`.

## UI Design System

- **Primary color**: `#C19A6B` / `hsl(var(--primary))` — gold/amber
- **Fonts**: `"Tajawal"` for UI text, `"Amiri"/"Scheherazade New"` for Arabic calligraphy
- **NoorIcons**: Custom 3D-style SVG icon library at `src/components/NoorIcons.tsx`
