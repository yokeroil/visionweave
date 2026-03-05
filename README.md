# VisionWeave

> AI-powered photography coaching, in your pocket.

VisionWeave helps photographers — from casual shooters to aspiring enthusiasts — capture better shots through real-time composition guidance, AI-inferred style profiles, and intelligent shoot timing based on golden hour, weather, and local photo spots.

---

## What's New (v1.1)

### Bug Fixes
- **Camera guidance** — Fixed API parameter mismatch (`azimuth`/`altitude` → `sunAzimuth`/`sunAltitude`) that caused all guidance requests to return 400. Added missing `lat`/`lng` params. Fixed session start payload to use nested `sceneContext` object. Fixed session end payload to use `overlaysShown`/`overlaysUsed` matching DB schema.
- **Photo quiz (Step 3)** — Fixed silent blank screen caused by missing error handling, invalid React Native style props (`background` → `backgroundColor`, removed `linear-gradient`), and non-hex gradient color strings.
- **iOS bundling** — Fixed `Cannot find module 'react-native-worklets/plugin'` caused by `react-native-reanimated` v4.x splitting worklets into a separate package.

### New Features
- **Genre icons** — Custom SVG cartoon icons for all 8 genres on the onboarding genre-select screen (astro = saturn + rings, landscape = mountains + sun, portrait = head/shoulders silhouette, street = city skyline, architecture = classical arch, travel = airplane, nature = leaf + veins, macro = magnifying glass + flower). Powered by `react-native-svg`.
- **Genre selection redesign** — Replaced pill chip layout with a 2-column card grid. Active cards show gold border, tinted background, icon color change, and a checkmark badge.
- **Spots screen overhaul** — Complete rewrite:
  - Interactive `MapView` with dark custom style (230px height) and spot markers
  - Location permission denied banner with "Enable GPS" (opens system settings) and "Enter city" buttons
  - Manual city/address search via `Location.geocodeAsync()` — overrides GPS when set
  - Haversine distance calculation (client-side) — spots sorted nearest-first
  - Tapping a list card animates the map to that spot's coordinates
  - Fixed source badge casing (`GOOGLE_PLACES` / `COMMUNITY`)
  - Fixed `bestTimes[]` array vs old `bestTimeOfDay` string mismatch
- **Architecture diagram** — New `docs/architecture.html` — a self-contained dark-themed HTML document with a full SVG architecture diagram, data flow cards, design tradeoffs table, technical insights, and risk management table.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo SDK 55), Expo Router, Zustand, TanStack Query |
| Server | Node.js 24, Express 4, TypeScript, Prisma 6, SQLite |
| AI | Anthropic Claude Haiku 4.5 (style inference + guidance) |
| Data | OpenWeatherMap, Google Places, Unsplash |
| Auth | JWT (access 15m + refresh 7d), expo-secure-store |
| Maps | react-native-maps (MapView, dark style, markers) |
| Icons | react-native-svg (custom SVG cartoon genre icons) |

---

## Project Structure

```
VisionWeave/
├── server/          # Express API + Prisma + SQLite
│   ├── src/
│   │   ├── routes/          # auth, profile, quiz, guidance, spots, events, telemetry
│   │   ├── services/        # AI, weather, spots, photos, profile
│   │   ├── middleware/      # auth, validate, errorHandler
│   │   ├── lib/             # prisma, cache, logger, errors
│   │   └── jobs/            # notificationScheduler, metricsRollup
│   └── prisma/schema.prisma
├── mobile/          # Expo React Native app
│   ├── app/
│   │   ├── (auth)/          # login, register
│   │   ├── (onboarding)/    # genre-select, mood-select, photo-quiz
│   │   └── (tabs)/          # home, camera, spots, style, profile
│   └── src/
│       ├── components/
│       │   ├── camera/      # CompositionOverlay, SunDirectionIndicator, GuidanceCard, SceneContextBanner
│       │   └── GenreIcon.tsx  # SVG cartoon icons for all 8 genres
│       ├── hooks/           # useSunPosition, useLocation
│       ├── services/        # api, telemetry
│       ├── stores/          # authStore, styleStore
│       └── constants/       # theme, config
├── docs/
│   ├── PRD.md
│   ├── architecture.html                    # interactive architecture diagram
│   └── architecture-and-implementation-plan.md
└── prototypes/
    ├── prototype-1-noir-lens.html
    ├── prototype-2-technical-edge.html
    └── prototype-3-golden-drift.html
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- Expo CLI (`npm install -g expo`)
- API keys (see `.env` setup below)

### Server Setup

```bash
cd server
npm install
```

Create `server/.env`:
```env
ANTHROPIC_API_KEY=your_key
OPENWEATHER_API_KEY=your_key
GOOGLE_PLACES_API_KEY=your_key
UNSPLASH_ACCESS_KEY=your_key
UNSPLASH_SECRET_KEY=your_key
JWT_SECRET=generate_random_64_char_hex
JWT_REFRESH_SECRET=generate_random_64_char_hex
DATABASE_URL="file:./prisma/visionweave.db"
PORT=3001
```

```bash
npx prisma migrate dev --name init
npm run dev
```

Server runs at `http://localhost:3001`. Health check: `GET /health`

### Mobile Setup

```bash
cd mobile
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` is required due to a peer dependency conflict between `react-dom@19.2.4` (pulled in by expo-router) and `react-native-svg`.

Update `src/constants/config.ts` if your server runs on a different host (use your machine's LAN IP for physical device testing).

```bash
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `i` for iOS simulator.

---

## Features

### Onboarding (Style Quiz — 3 Steps)
- **Step 1 — Genre select** — 2-column card grid with SVG cartoon icons; pick all genres you shoot (landscape, portrait, street, architecture, astro, travel, nature, macro)
- **Step 2 — Mood select** — Pick your preferred shooting moods/aesthetics
- **Step 3 — Photo quiz** — 10 rounds of side-by-side photo preference selection; drives AI style inference

### Free Tier
- Style quiz + AI-inferred 14-dimensional style profile
- Live camera composition overlay (rule-of-thirds, corner brackets)
- Real-time sun position (azimuth, altitude) — zero API cost via `suncalc`
- Golden hour notifications
- Nearby photo spots map (Google Places) with distance sorting and manual city search

### Pro Tier
- Weather-based shoot alerts (fog, snow, clear nights)
- Blue hour + astronomy events
- AI composition guidance (Claude Haiku-powered, cached 15 min per scene type)
- Full weather forecast integration

---

## API Reference

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/profile` | Get current user |
| PUT | `/profile` | Update profile |
| GET | `/profile/style` | Get AI style profile |
| GET | `/profile/stats` | Get usage stats |
| GET | `/quiz/photos?round=N` | Get quiz photos for round N |
| POST | `/quiz/setup` | Save genres + moods |
| POST | `/quiz/response` | Submit photo preference |
| POST | `/quiz/complete` | Complete quiz, trigger inference |
| GET | `/guidance/scene?lat&lng&sunAzimuth&sunAltitude&sceneLabel&isGoldenHour&isBlueHour` | Get AI composition guidance |
| POST | `/guidance/session/start` | Start camera session |
| POST | `/guidance/session/:id/end` | End camera session |
| GET | `/spots/nearby?lat&lng&radius` | Get nearby photo spots |
| GET | `/events/upcoming` | Get upcoming shoot events |
| POST | `/telemetry/event` | Log analytics event |

---

## Architecture Notes

- **Sun position** computed client-side via `suncalc` — zero API cost, <1ms latency
- **AI guidance** cached by `(sceneLabel × sunQuadrant × topStyleTag)` with 15-min TTL
- **Style inference** runs as background job after quiz completion
- **Notifications** pre-computed by cron job, stored as DB rows for instant retrieval
- **SQLite** used for local development; swap `DATABASE_URL` for PostgreSQL in production
- **Spot distance** computed client-side via Haversine formula — no extra API call
- **City search** geocoded via `expo-location`'s `geocodeAsync()` — uses device's native geocoder
- Full architecture diagram: [`docs/architecture.html`](docs/architecture.html)

---

## License

Private — All rights reserved.
