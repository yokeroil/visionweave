# VisionWeave

> AI-powered photography coaching, in your pocket.

VisionWeave helps photographers — from casual shooters to aspiring enthusiasts — capture better shots through real-time composition guidance, AI-inferred style profiles, and intelligent shoot timing based on golden hour, weather, and local photo spots.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo SDK 55), Expo Router, Zustand, TanStack Query |
| Server | Node.js 24, Express 4, TypeScript, Prisma 6, SQLite |
| AI | Anthropic Claude (style inference + guidance) |
| Data | OpenWeatherMap, Google Places, Unsplash |
| Auth | JWT (access 15m + refresh 7d), expo-secure-store |

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
│       ├── components/      # camera overlays, shared UI
│       ├── hooks/           # useSunPosition, useLocation
│       ├── services/        # api, telemetry
│       ├── stores/          # authStore, styleStore
│       └── constants/       # theme, config
├── docs/
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

Update `src/constants/config.ts` if your server runs on a different host (use your machine's LAN IP for physical device testing).

```bash
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `i` for iOS simulator.

---

## Features

### Free Tier
- Style quiz (genre → mood → photo preference rounds)
- AI-inferred style profile
- Live camera composition overlay (rule-of-thirds, corner brackets)
- Real-time sun position (azimuth, altitude) — zero API cost via suncalc
- Golden hour notifications
- Nearby photo spots (Google Places)

### Pro Tier
- Weather-based shoot alerts (fog, snow, clear nights)
- Blue hour + astronomy events
- AI composition guidance (Claude-powered, cached per scene type)
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
| GET | `/guidance/scene` | Get AI composition guidance |
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

---

## License

Private — All rights reserved.
