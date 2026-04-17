# VisionWeave — Architecture Design & Implementation Plan
**Version 1.0 | March 2026**
**Scope: Local-only, fully functional, live AI API connections**

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Components](#3-system-components)
4. [Data Modeling](#4-data-modeling)
5. [API Design](#5-api-design)
6. [AI Integration Architecture](#6-ai-integration-architecture)
7. [Performance Design](#7-performance-design)
8. [Security Design](#8-security-design)
9. [Scalability Design](#9-scalability-design)
10. [Observability & Telemetry](#10-observability--telemetry)
11. [Implementation Plan](#11-implementation-plan)

---

## 1. Architecture Overview

### 1.1 System Topology (Local)

```
┌─────────────────────────────────────────────────────────────────────┐
│  iOS Device / Simulator                                             │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  React Native (Expo) — Mobile App                           │   │
│  │                                                             │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │   │
│  │  │  Camera  │ │  Style   │ │  Spots   │ │     Home     │  │   │
│  │  │  Screen  │ │  Quiz    │ │   Map    │ │  Dashboard   │  │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘  │   │
│  │       └────────────┴────────────┴───────────────┘          │   │
│  │                          │ HTTP (localhost)                 │   │
│  └──────────────────────────┼──────────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
              ┌───────────────▼──────────────────┐
              │  Node.js / Express API Server     │
              │  (localhost:3001)                 │
              │                                  │
              │  ┌──────────┐  ┌───────────────┐ │
              │  │  REST    │  │  Background   │ │
              │  │  Routes  │  │  Jobs (cron)  │ │
              │  └──────┬───┘  └───────┬───────┘ │
              │         │              │          │
              │  ┌──────▼──────────────▼──────┐  │
              │  │   Service Layer            │  │
              │  │  (AI · Weather · Spots ·   │  │
              │  │   Notifications · Profile) │  │
              │  └──────┬─────────────────────┘  │
              │         │                         │
              │  ┌──────▼──────┐  ┌────────────┐ │
              │  │   Prisma    │  │  In-Memory │ │
              │  │   ORM       │  │  Cache     │ │
              │  └──────┬──────┘  └────────────┘ │
              │         │                         │
              │  ┌──────▼──────┐                  │
              │  │  SQLite DB  │                  │
              │  │  (local     │                  │
              │  │  file)      │                  │
              │  └─────────────┘                  │
              └───────────┬──────────────────────┘
                          │ HTTPS (live API keys)
        ┌─────────────────┼─────────────────────────┐
        │                 │                          │
┌───────▼──────┐  ┌───────▼───────┐  ┌─────────────▼────┐
│  Anthropic   │  │  OpenWeather  │  │  Google Places   │
│  Claude API  │  │  API          │  │  API             │
│              │  │               │  │                  │
│  Style AI    │  │  Weather +    │  │  Photo Spots +   │
│  Guidance    │  │  Astronomy    │  │  POI Data        │
└──────────────┘  └───────────────┘  └──────────────────┘
                          │
                  ┌───────▼───────┐
                  │  Unsplash     │
                  │  API          │
                  │  Photo Repo   │
                  └───────────────┘
```

### 1.2 Architectural Principles

| Principle | Decision |
|-----------|----------|
| **Simplicity first** | Monolithic backend — no microservices overhead for local scope |
| **Future-proof seams** | Repository pattern everywhere — DB layer fully abstracted |
| **AI cost control** | Cache-first AI calls, never make the same inference twice |
| **Offline resilience** | Camera overlay and cached spots must work with no network |
| **Schema discipline** | Write SQL/Prisma that would port to PostgreSQL without rewrites |
| **Observability-first** | Every meaningful action emits a telemetry event at write time |

---

## 2. Technology Stack

### 2.1 Frontend

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | **React Native (Expo SDK 52+)** | Cross-platform base; iOS first; Expo Camera for native camera access |
| Navigation | **Expo Router** | File-based routing, deep links, native stack transitions |
| State | **Zustand** | Lightweight, minimal boilerplate, avoids Redux complexity |
| Server state | **TanStack Query (React Query)** | Cache, loading, error states for API data |
| Camera | **expo-camera** | Native camera access, permissions, preview |
| Location | **expo-location** | Foreground + background location; geofencing |
| Maps | **react-native-maps** | Apple Maps on iOS, dark tile support |
| Notifications | **expo-notifications** | Local push notifications; no APNs server needed for local scope |
| Styling | **StyleSheet + custom theme** | No CSS-in-JS overhead; direct RN StyleSheet |
| Animations | **React Native Reanimated 3** | 60fps camera overlay transitions |

### 2.2 Backend

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Runtime | **Node.js 22 LTS** | Stable, fast, excellent async I/O for API fan-out |
| Framework | **Express 5 + TypeScript** | Lightweight, well-known, easy to debug locally |
| ORM | **Prisma 6** | Type-safe queries, excellent SQLite support, migration tooling |
| Database | **SQLite** (via Prisma) | Zero-config local database; single file; ACID-compliant |
| Cache | **node-cache** | In-memory TTL cache for weather, Places, AI responses |
| Auth | **JWT (jsonwebtoken) + bcrypt** | Stateless auth, secure even locally |
| Validation | **Zod** | Runtime schema validation shared between API and client |
| Jobs | **node-cron** | Notification scheduling, weather polling, profile refresh |
| HTTP client | **axios** | External API calls with interceptors for retry + logging |
| Logging | **Pino** | Structured JSON logging, high performance |

### 2.3 AI & External Services

| Service | Provider | Usage |
|---------|----------|-------|
| Style reasoning & guidance | **Claude claude-sonnet-4-6 (Anthropic)** | Style profile inference, personalized composition guidance text |
| Camera scene classification | **Claude claude-sonnet-4-6 with Vision** | Scene type detection if image frame uploaded |
| Sun position calculation | **suncalc (npm library)** | Client-side: azimuth, altitude, golden hour times — zero API cost |
| Weather & astronomy | **OpenWeatherMap API** | Current conditions, 7-day forecast, astronomy events |
| Photo spots | **Google Places API (Nearby Search)** | POI discovery filtered by photography-relevant types |
| Photo repository | **Unsplash API** | Style quiz photo content, licensed, free tier generous |

> **Cost note:** suncalc runs entirely on device — no API call needed for sun direction, golden hour time, or blue hour. This covers the primary camera overlay feature with zero marginal cost.

### 2.4 Developer Tooling

| Tool | Purpose |
|------|---------|
| `tsx` / `ts-node` | Run TypeScript directly without compile step in dev |
| `prisma studio` | Local DB browser for inspection |
| `mkcert` | Locally-trusted HTTPS certificate (required for camera permissions on some Expo setups) |
| `.env` + `dotenv` | API key management, never committed |
| `zod-to-ts` | Shared type generation from Zod schemas |

---

## 3. System Components

### 3.1 Mobile App — Component Map

```
app/
├── (auth)/
│   ├── register.tsx          # Registration screen
│   └── login.tsx             # Login screen
├── (onboarding)/
│   ├── genre-select.tsx      # Step 1: Genre selection
│   ├── mood-select.tsx       # Step 2: Mood/aesthetic tags
│   └── photo-quiz.tsx        # Step 3+: 4-card photo grid loops
├── (tabs)/
│   ├── index.tsx             # Home dashboard
│   ├── camera.tsx            # Camera + overlay screen
│   ├── spots.tsx             # Spots map + list
│   ├── style.tsx             # Style profile + re-quiz entry
│   └── profile.tsx           # User settings, tier, progress
└── _layout.tsx               # Root layout, auth guard, theme

src/
├── components/
│   ├── camera/
│   │   ├── CompositionOverlay.tsx    # Rule-of-thirds grid lines
│   │   ├── SunDirectionIndicator.tsx # Animated sun bearing
│   │   ├── SceneContextBanner.tsx    # Light quality pill
│   │   └── GuidanceCard.tsx         # AI composition tip
│   ├── quiz/
│   │   ├── PhotoCard.tsx            # Single selectable card
│   │   └── PhotoGrid.tsx            # 2x2 grid with selection state
│   ├── home/
│   │   ├── LightHeroCard.tsx        # Primary light condition card
│   │   ├── SpotScrollRow.tsx        # Horizontal spot cards
│   │   └── EventTimeline.tsx        # Upcoming shoot events
│   └── shared/
│       ├── ProPaywall.tsx           # Locked feature CTA
│       └── StyleTag.tsx             # Genre/mood chip
├── stores/
│   ├── authStore.ts                 # JWT, user object
│   ├── styleStore.ts                # Style profile + quiz state
│   ├── locationStore.ts             # GPS, permissions
│   └── notificationStore.ts        # Local notification queue
├── hooks/
│   ├── useSunPosition.ts            # suncalc wrapper, real-time azimuth
│   ├── useSceneContext.ts           # Derives light label from sun position
│   ├── useStyleGuidance.ts          # Fetches AI guidance for scene
│   └── useNearbySpots.ts            # Spots query with location
└── services/
    ├── api.ts                       # Axios instance, JWT interceptor
    └── telemetry.ts                 # Client-side event emission
```

### 3.2 Backend — Module Map

```
server/
├── src/
│   ├── routes/
│   │   ├── auth.ts           # POST /auth/register, /auth/login, /auth/refresh
│   │   ├── profile.ts        # GET/PUT /profile, GET /profile/style
│   │   ├── quiz.ts           # GET /quiz/photos, POST /quiz/response, POST /quiz/complete
│   │   ├── guidance.ts       # POST /guidance/scene   (AI inference)
│   │   ├── spots.ts          # GET /spots/nearby, GET /spots/:id
│   │   ├── events.ts         # GET /events/upcoming   (notifications preview)
│   │   ├── notifications.ts  # POST /notifications/schedule
│   │   └── telemetry.ts      # POST /telemetry/event  (observability)
│   ├── services/
│   │   ├── ai/
│   │   │   ├── styleInference.ts    # Claude: build style profile from quiz
│   │   │   ├── guidanceGen.ts       # Claude: generate composition guidance
│   │   │   └── sceneAnalysis.ts     # Claude Vision: classify camera scene
│   │   ├── weather/
│   │   │   ├── weatherService.ts    # OpenWeatherMap fetch + parse
│   │   │   ├── astronomyService.ts  # Moon, Milky Way window calc
│   │   │   └── notificationEngine.ts # Evaluate conditions → schedule notifs
│   │   ├── spots/
│   │   │   ├── placesService.ts     # Google Places nearby search
│   │   │   └── spotsRepository.ts   # Cache layer on top of Places
│   │   ├── photos/
│   │   │   └── unsplashService.ts   # Quiz photo fetch + local cache
│   │   └── profile/
│   │       ├── styleProfileService.ts  # Build/update profile
│   │       └── behaviorTracker.ts      # Passive event → profile signal
│   ├── jobs/
│   │   ├── weatherPoller.ts         # Every 30 min: fetch weather for active users
│   │   ├── notificationScheduler.ts # Every hour: compute + schedule notifs
│   │   └── styleRefresher.ts        # Daily: re-evaluate profiles with new behavior
│   ├── middleware/
│   │   ├── auth.ts                  # JWT verification
│   │   ├── rateLimit.ts             # Protect AI endpoints from cost explosion
│   │   ├── validate.ts              # Zod request validation
│   │   └── telemetry.ts             # Auto-emit latency events per route
│   ├── lib/
│   │   ├── cache.ts                 # node-cache wrapper with TTL presets
│   │   ├── logger.ts                # Pino instance, structured context
│   │   ├── prisma.ts                # Prisma client singleton
│   │   └── errors.ts                # Typed API error classes
│   └── index.ts                     # Server bootstrap, job startup
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── .env                             # API keys (gitignored)
```

---

## 4. Data Modeling

### 4.1 Core Entities and Relationships

```
┌──────────────┐        ┌──────────────────┐        ┌───────────────────┐
│    User      │───1:1──│   StyleProfile   │───1:N──│  PhotoPreference  │
│              │        │                  │        │  (quiz responses) │
│ id           │        │ id               │        │                   │
│ email        │        │ user_id          │        │ id                │
│ name         │        │ genres[]         │        │ user_id           │
│ locale       │        │ moods[]          │        │ style_profile_id  │
│ tier         │        │ style_vector     │        │ photo_id          │
│ lat / lng    │        │ confidence       │        │ photo_tags[]      │
│ created_at   │        │ version          │        │ selected          │
│ last_active  │        │ updated_at       │        │ round             │
└──────┬───────┘        └──────────────────┘        └───────────────────┘
       │
       ├───1:N──────────────────┐
       │                        │
       ▼                        ▼
┌─────────────────┐    ┌────────────────────┐
│  CameraSession  │    │   BehaviorEvent    │
│                 │    │                    │
│ id              │    │ id                 │
│ user_id         │    │ user_id            │
│ started_at      │    │ event_type         │
│ ended_at        │    │ metadata (JSON)    │
│ lat / lng       │    │ created_at         │
│ scene_context   │    └────────────────────┘
│ overlays_shown  │
│ overlays_used   │
└─────────────────┘

┌──────────────┐        ┌──────────────────┐        ┌───────────────────┐
│   Spot       │───M:N──│  UserSpotView    │        │  Notification     │
│  (cached)    │        │  (join table)    │        │                   │
│              │        │                  │        │ id                │
│ id           │        │ user_id          │        │ user_id           │
│ external_id  │        │ spot_id          │        │ type              │
│ source       │        │ viewed_at        │        │ title / body      │
│ name         │        │ saved            │        │ metadata (JSON)   │
│ lat / lng    │        └──────────────────┘        │ scheduled_for     │
│ style_tags[] │                                     │ sent_at           │
│ best_times[] │        ┌──────────────────┐        │ opened_at         │
│ rating       │        │  WeatherCache    │        └───────────────────┘
│ expires_at   │        │                  │
└──────────────┘        │ id               │        ┌───────────────────┐
                        │ location_key     │        │  TelemetryEvent   │
                        │ data (JSON)      │        │                   │
                        │ fetched_at       │        │ id                │
                        │ expires_at       │        │ event_type        │
                        └──────────────────┘        │ user_id (null ok) │
                                                     │ properties (JSON) │
                        ┌──────────────────┐        │ latency_ms        │
                        │  APICallLog      │        │ created_at        │
                        │                  │        └───────────────────┘
                        │ id               │
                        │ service          │
                        │ endpoint         │
                        │ latency_ms       │
                        │ status_code      │
                        │ tokens_used      │
                        │ cost_estimate    │
                        │ created_at       │
                        └──────────────────┘
```

### 4.2 Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./visionweave.db"
}

model User {
  id             String    @id @default(uuid())
  email          String    @unique
  passwordHash   String
  name           String
  locale         String    @default("en")
  tier           Tier      @default(FREE)
  locationLat    Float?
  locationLng    Float?
  createdAt      DateTime  @default(now())
  lastActiveAt   DateTime  @default(now())

  styleProfile   StyleProfile?
  sessions       CameraSession[]
  behaviors      BehaviorEvent[]
  notifications  Notification[]
  spotViews      UserSpotView[]
  telemetry      TelemetryEvent[]
}

enum Tier {
  FREE
  PRO
  STUDIO
}

model StyleProfile {
  id           String    @id @default(uuid())
  userId       String    @unique
  user         User      @relation(fields: [userId], references: [id])

  // Onboarding selections
  genres       String    // JSON array: ["landscape","portrait","street"]
  moods        String    // JSON array: ["moody","golden_tones","minimal"]

  // AI-computed vector: scored weights per tag (0.0–1.0)
  // e.g. {"golden_hour":0.9,"blue_hour":0.4,"portrait":0.8}
  styleVector  String    // JSON object
  confidence   Float     @default(0.0)
  version      Int       @default(1)

  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  preferences  PhotoPreference[]
}

model PhotoPreference {
  id             String    @id @default(uuid())
  userId         String
  styleProfileId String
  profile        StyleProfile @relation(fields: [styleProfileId], references: [id])

  photoId        String    // Unsplash photo ID
  photoUrl       String
  photoTags      String    // JSON array of style tags
  selected       Boolean
  quizRound      Int

  createdAt      DateTime  @default(now())
}

model CameraSession {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])

  startedAt       DateTime  @default(now())
  endedAt         DateTime?
  locationLat     Float?
  locationLng     Float?

  // JSON: { lightQuality, sunAzimuth, sunAltitude, isGoldenHour, weatherCondition }
  sceneContext    String?
  overlaysShown   Int       @default(0)
  overlaysUsed    Int       @default(0)   // times user moved to suggested framing
}

model BehaviorEvent {
  id         String    @id @default(uuid())
  userId     String
  user       User      @relation(fields: [userId], references: [id])

  // Values: notification_opened | overlay_accepted | overlay_dismissed |
  //         spot_viewed | spot_saved | quiz_round_completed | session_start
  eventType  String
  // Flexible: { spotId, notifType, sceneType, overlayType, ... }
  metadata   String    // JSON

  createdAt  DateTime  @default(now())
}

model Spot {
  id          String    @id @default(uuid())
  externalId  String    @unique  // Google Place ID or "community-{uuid}"
  source      SpotSource

  name        String
  description String?
  latitude    Float
  longitude   Float
  styleTags   String    // JSON: ["landscape","golden_hour","portrait"]
  bestTimes   String    // JSON: ["sunset","sunrise","blue_hour"]
  photoUrl    String?
  rating      Float?    @default(0.0)
  ratingCount Int       @default(0)

  createdAt   DateTime  @default(now())
  expiresAt   DateTime  // Cache TTL: 24h for Places, null for community

  viewers     UserSpotView[]
}

enum SpotSource {
  GOOGLE_PLACES
  COMMUNITY
}

model UserSpotView {
  id       String   @id @default(uuid())
  userId   String
  spotId   String
  user     User     @relation(fields: [userId], references: [id])
  spot     Spot     @relation(fields: [spotId], references: [id])
  saved    Boolean  @default(false)
  viewedAt DateTime @default(now())

  @@unique([userId, spotId])
}

model Notification {
  id            String    @id @default(uuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])

  // Values: golden_hour | blue_hour | fog | overcast | clear_night |
  //         milky_way | meteor_shower | full_moon | snow
  type          String
  title         String
  body          String
  // JSON: { weatherCode, cloudCover, windSpeed, matchedStyleTags }
  metadata      String

  scheduledFor  DateTime
  sentAt        DateTime?
  openedAt      DateTime?

  createdAt     DateTime  @default(now())
}

model WeatherCache {
  id           String   @id @default(uuid())
  locationKey  String   @unique  // "${lat.toFixed(2)},${lng.toFixed(2)}"
  data         String   // Full JSON response from OpenWeatherMap
  fetchedAt    DateTime @default(now())
  expiresAt    DateTime
}

model APICallLog {
  id            String   @id @default(uuid())
  service       String   // anthropic | openweather | google_places | unsplash
  endpoint      String
  latencyMs     Int
  statusCode    Int
  tokensUsed    Int?
  costEstimate  Float?   // USD, computed at log time
  createdAt     DateTime @default(now())
}

model TelemetryEvent {
  id         String   @id @default(uuid())
  eventType  String
  userId     String?
  user       User?    @relation(fields: [userId], references: [id])
  properties String   // JSON
  latencyMs  Int?
  createdAt  DateTime @default(now())
}

model DailyMetricRollup {
  id        String   @id @default(uuid())
  date      String   // ISO date: "2026-03-03"
  metric    String   // e.g. "dau" | "new_users" | "notif_open_rate" | "quiz_completion"
  value     Float
  breakdown String?  // JSON: { tier, locale, ... }
  createdAt DateTime @default(now())

  @@unique([date, metric])
}
```

### 4.3 Data Lifecycle

| Entity | Created | Updated | Archived/Deleted |
|--------|---------|---------|-----------------|
| User | Registration | Profile changes, `lastActiveAt` on every request | Soft delete on account removal |
| StyleProfile | Quiz completion | After each quiz re-run; passive confidence updates | Never deleted — versioned |
| PhotoPreference | Each quiz card swipe | Never — immutable append | Never |
| BehaviorEvent | Each user action | Never — immutable append | Aggregate + purge raw events after 90 days |
| CameraSession | Camera screen open | Updated on close with stats | Keep 180 days |
| Spot | First nearby search (cached from Places) | On community contribution | Re-fetch when `expiresAt` passes |
| Notification | Notification engine run | On send, on open | Purge after 30 days |
| WeatherCache | First fetch for a location | On TTL expiry + re-fetch | Auto-replaced on expiry |
| TelemetryEvent | Every instrumented action | Never — immutable | Aggregate into `DailyMetricRollup`, purge raw after 30 days |
| APICallLog | Every external API call | Never | Purge after 14 days |

### 4.4 Style Vector Design

The style vector is the core AI output — a JSON object mapping style tags to relevance scores:

```json
{
  "golden_hour": 0.92,
  "blue_hour": 0.35,
  "portrait": 0.88,
  "landscape": 0.40,
  "street": 0.20,
  "architecture": 0.15,
  "moody": 0.70,
  "bright_airy": 0.10,
  "film_grain": 0.55,
  "minimal": 0.30,
  "warm_tones": 0.90,
  "cool_tones": 0.25
}
```

**How it's built:**
1. Quiz responses (weighted: selected photos carry their tags at full weight, skipped photos carry inverse weight at 0.3)
2. Passed to Claude with the prompt: `"Given these photo preferences and their tags, infer a style vector..."`
3. Claude returns a reasoned vector + a one-line style summary string (e.g. `"Warm golden-hour portraits with soft, intimate framing"`)
4. Vector stored in `StyleProfile.styleVector`

**How passive behavior updates it:**
- `notification_opened` on a golden_hour notif → boost `golden_hour` weight by 0.02
- `overlay_accepted` for a portrait composition → boost `portrait` by 0.02
- Capped at 0.15 drift per 30 days from AI re-inference to prevent thrash
- `styleRefresher` job re-runs Claude inference with accumulated behavior signals every 7 days

---

## 5. API Design

### 5.1 Route Summary

```
POST   /auth/register              Create account
POST   /auth/login                 Return JWT
POST   /auth/refresh               Refresh JWT

GET    /profile                    Get user + style summary
PUT    /profile                    Update name, locale, location
GET    /profile/progress           Shoots, spots, styles explored stats

GET    /quiz/photos?round=N        Fetch 4 Unsplash photos for quiz round
POST   /quiz/response              Log single card selection
POST   /quiz/complete              Trigger AI style inference

GET    /guidance/scene             AI guidance for current scene context
                                   Query: lat, lng, styleVersion
                                   (cached by scene+styleVersion key)

GET    /spots/nearby               Google Places + community spots
                                   Query: lat, lng, radius, limit
POST   /spots                      Submit community spot
GET    /spots/:id                  Get spot detail

GET    /events/upcoming            Upcoming shoot windows for user
                                   Computed from weather + user location

POST   /telemetry/event            Client-side event batch submission
GET    /telemetry/metrics          Metrics dashboard data (local dev only)
```

### 5.2 Key Response Shapes (Zod schemas)

```typescript
// Scene guidance response
const GuidanceResponse = z.object({
  compositionTip: z.string(),           // "Position subject at left intersection…"
  sceneLabel: z.string(),               // "Golden Hour"
  lightQuality: z.enum(['optimal','good','flat','harsh','low']),
  sunAzimuth: z.number(),               // degrees
  sunAltitude: z.number(),              // degrees above horizon
  isGoldenHour: z.boolean(),
  isBlueHour: z.boolean(),
  styleMatchScore: z.number().min(0).max(1), // how well scene matches user style
  cachedAt: z.string().optional(),
});

// Style profile response
const StyleProfileResponse = z.object({
  summary: z.string(),                  // "Warm golden-hour portraits…"
  genres: z.array(z.string()),
  moods: z.array(z.string()),
  topTags: z.array(z.object({
    tag: z.string(),
    weight: z.number(),
  })),
  confidence: z.number(),
  version: z.number(),
});

// Upcoming event
const ShootEvent = z.object({
  id: z.string(),
  type: z.string(),                     // "golden_hour" | "fog" | etc.
  title: z.string(),
  description: z.string(),
  scheduledFor: z.string(),             // ISO datetime
  weatherData: z.object({
    cloudCover: z.number(),
    condition: z.string(),
  }),
  styleMatchTags: z.array(z.string()),  // why this matches user's style
  requiresPro: z.boolean(),
});
```

---

## 6. AI Integration Architecture

### 6.1 Claude Usage Patterns

#### Pattern A — Style Inference (On quiz complete)

```
Trigger: POST /quiz/complete
Input:   All PhotoPreference rows for user (tags + selected bool)
         User's genre/mood selections from onboarding

Prompt structure:
  SYSTEM: "You are a photography style analyst…"
  USER:   "Selected photos and their style tags: [...]
           Rejected photos and their tags: [...]
           Stated preferences: genres=[...], moods=[...]
           Return a JSON style_vector and a one-sentence style_summary."

Output:  { style_vector: {...}, style_summary: "..." }
Model:   claude-sonnet-4-6
Cache:   By (userId + styleProfileVersion) — never re-run until new quiz data
Tokens:  ~800 input / ~200 output ≈ $0.003 per call
```

#### Pattern B — Scene Guidance (On camera screen, per scene change)

```
Trigger: GET /guidance/scene?lat=&lng=&styleVersion=
Input:   sceneContext (computed locally by suncalc — no API needed)
         user styleVector

Prompt structure:
  SYSTEM: "You are a composition coach for photography…"
  USER:   "Scene: golden hour, sun azimuth 225°, altitude 8°, soft warm light.
           User style vector: {golden_hour:0.92, portrait:0.88, warm_tones:0.90}
           Return a JSON with compositionTip (max 12 words) and styleMatchScore."

Output:  { compositionTip: "...", styleMatchScore: 0.94 }
Model:   claude-haiku-4-5 (fast + cheap for real-time guidance)
Cache:   By (sceneType + sunQuadrant + topStyleTag) — same scene = same tip
Tokens:  ~300 input / ~80 output ≈ $0.0003 per call
TTL:     15 minutes (scene changes slowly)
```

#### Pattern C — Style Profile Re-inference (Weekly background job)

```
Trigger: styleRefresher cron job
Input:   All BehaviorEvents since last inference
         Current style vector

Prompt structure:
  SYSTEM: "Incrementally update a photography style profile…"
  USER:   "Current profile: {...}
           Behavior signals (last 7 days): [notification_opened:golden_hour x3, ...]
           Adjust vector weights within ±0.15 cap."

Output:  { updated_vector: {...}, change_summary: "..." }
Model:   claude-sonnet-4-6
Cache:   N/A — always fresh run
```

### 6.2 AI Cost Controls

```typescript
// middleware/rateLimit.ts
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,      // 1 minute
  max: 10,                   // max 10 AI calls/min per user
  message: 'AI rate limit reached',
});

// lib/cache.ts — cache hierarchy
const CACHE_TTL = {
  guidance:       15 * 60,        // 15 min: scene guidance
  styleInference: 7 * 24 * 3600, // 7 days: style profile
  weatherData:    30 * 60,        // 30 min: weather
  placesNearby:   24 * 3600,      // 24 hrs: nearby spots
  quizPhotos:     7 * 24 * 3600,  // 7 days: quiz photos
};

// Before ANY AI call:
const cacheKey = buildGuidanceCacheKey(sceneType, sunQuadrant, topStyleTag);
const cached = cache.get(cacheKey);
if (cached) return cached;  // Never pay twice for the same scene
```

### 6.3 suncalc — Zero-cost Sun Position

```typescript
// hooks/useSunPosition.ts (runs on device, no API)
import SunCalc from 'suncalc';

export function useSunPosition(lat: number, lng: number) {
  const now = new Date();
  const pos = SunCalc.getPosition(now, lat, lng);
  const times = SunCalc.getTimes(now, lat, lng);

  return {
    azimuth: pos.azimuth * (180 / Math.PI) + 180,  // 0-360°
    altitude: pos.altitude * (180 / Math.PI),        // degrees above horizon
    isGoldenHour: now >= times.goldenHour && now <= times.goldenHourEnd,
    isBlueHour: now >= times.blueHour && now <= times.blueHourEnd,
    goldenHourStart: times.goldenHour,
    sunriseEnd: times.sunriseEnd,
    sunsetStart: times.sunsetStart,
  };
}
```

---

## 7. Performance Design

### 7.1 Camera Overlay — <100ms Target

The camera screen is the most latency-sensitive surface. All computation must happen client-side:

| Computation | Method | Latency |
|-------------|--------|---------|
| Sun azimuth & altitude | suncalc (device, synchronous) | <1ms |
| Golden/blue hour detection | suncalc (device, synchronous) | <1ms |
| Composition grid lines | Static SVG overlay on viewfinder | 0ms |
| Scene label | Derived from sun altitude thresholds (no API) | <1ms |
| Composition tip (text) | Fetched once per scene type, cached in Zustand | ~200ms first, 0ms cached |

```typescript
// Altitude thresholds for scene labels (no AI needed)
function getSceneLabel(altitude: number, isGoldenHour: boolean, isBlueHour: boolean): string {
  if (isGoldenHour) return 'Golden Hour';
  if (isBlueHour) return 'Blue Hour';
  if (altitude < 0) return 'Night';
  if (altitude < 6) return 'Twilight';
  if (altitude < 20) return 'Low Sun';
  if (altitude > 60) return 'Harsh Overhead';
  return 'Soft Daylight';
}
```

The AI guidance tip (`guidanceService`) is fetched **once per (sceneType × styleVersion)** combination — not per frame. The camera overlay renders instantly from local state. The tip updates only when the scene type changes (e.g. soft daylight → golden hour).

### 7.2 App Cold Start — <2s Target

| Phase | Action | Target |
|-------|--------|--------|
| JS bundle parse | Hermes engine (Expo default) | 200ms |
| Auth check | Read JWT from SecureStore | 50ms |
| Home screen render | Render skeleton, then load data | 300ms |
| First data fetch | Parallel: weather + nearby spots (both cached) | 400ms |
| Total | | <1s warm, <2s cold |

Strategy: Use TanStack Query's `staleWhileRevalidate` — render stale cached data immediately, fetch fresh in background. User sees instant content.

### 7.3 API Response Targets

| Endpoint | P50 Target | P95 Target | Strategy |
|----------|-----------|-----------|----------|
| `GET /spots/nearby` | 80ms | 150ms | 24h SQLite cache; Places API only on miss |
| `GET /guidance/scene` | 50ms | 100ms | In-memory cache; Claude only on cache miss |
| `GET /events/upcoming` | 100ms | 200ms | Pre-computed by cron, read from DB |
| `POST /quiz/complete` | 1500ms | 3000ms | Claude inference; show skeleton in UI |
| `POST /auth/login` | 80ms | 150ms | bcrypt rounds set to 10 (local) |

### 7.4 SQLite Indexes

```sql
-- Critical performance indexes
CREATE INDEX idx_behavior_user_created ON BehaviorEvent(userId, createdAt DESC);
CREATE INDEX idx_notification_user_sched ON Notification(userId, scheduledFor);
CREATE INDEX idx_spot_location ON Spot(latitude, longitude);
CREATE INDEX idx_telemetry_type_created ON TelemetryEvent(eventType, createdAt DESC);
CREATE INDEX idx_api_log_service ON APICallLog(service, createdAt DESC);
CREATE INDEX idx_metric_rollup_date ON DailyMetricRollup(date, metric);
```

### 7.5 Notification Pre-computation

Notifications are **never computed on request**. The `notificationScheduler` cron job:
1. Runs every hour
2. Fetches weather for all users with notifications enabled
3. Evaluates conditions against each user's style profile
4. Inserts `Notification` rows scheduled for future delivery
5. Expo local notification API schedules device-level delivery

This means `GET /events/upcoming` is a simple DB read — no real-time computation.

---

## 8. Security Design

### 8.1 API Key Management

```bash
# .env — never committed to git
ANTHROPIC_API_KEY=sk-ant-...
OPENWEATHER_API_KEY=...
GOOGLE_PLACES_API_KEY=...
UNSPLASH_ACCESS_KEY=...
JWT_SECRET=<64-char random hex>
JWT_REFRESH_SECRET=<64-char random hex>
```

```gitignore
# .gitignore
.env
*.db
*.db-journal
```

The mobile app **never holds API keys**. All external API calls go through the local Express server. The app only holds a JWT.

### 8.2 Authentication

```
Registration → bcrypt(password, rounds=10) → store hash
Login        → compare → issue { accessToken (15min), refreshToken (7d) }
Every request → verify accessToken → attach userId to req
Refresh flow → POST /auth/refresh with refreshToken → new accessToken
```

JWTs are stored in `expo-secure-store` (iOS Keychain wrapper) — not AsyncStorage.

### 8.3 Input Validation

All request bodies validated with Zod before reaching service layer:

```typescript
// routes/quiz.ts
const QuizResponseSchema = z.object({
  photoId: z.string().min(1).max(100),
  selected: z.boolean(),
  quizRound: z.number().int().min(1).max(50),
});

router.post('/quiz/response', validate(QuizResponseSchema), async (req, res) => {
  // req.body is now typed and validated
});
```

### 8.4 AI Prompt Injection Protection

User-controlled inputs (name, locale) must never be interpolated into AI prompts raw:

```typescript
// WRONG — injection risk
const prompt = `User ${user.name} prefers these styles...`;

// RIGHT — only inject data, not free-text user input
const prompt = `Style vector: ${JSON.stringify(profile.styleVector)}
                Genres: ${profile.genres}`;
// user.name never appears in AI prompts
```

### 8.5 Rate Limiting

```typescript
// Protect AI endpoints from cost runaway
app.use('/guidance', aiLimiter);          // 10 req/min/user
app.use('/quiz/complete', strictLimiter); // 3 req/hour/user (style re-runs)
app.use('/auth/login', authLimiter);      // 10 req/15min (brute force)
```

---

## 9. Scalability Design

The local constraint means single-user SQLite today. However, every design decision prepares for a PostgreSQL + cloud migration without rewrites:

### 9.1 Repository Pattern

All DB access goes through repository classes — never raw Prisma calls in routes:

```typescript
// repositories/spotRepository.ts
export class SpotRepository {
  async findNearby(lat: number, lng: number, radiusKm: number): Promise<Spot[]> {
    // Haversine in SQLite today, PostGIS ST_DWithin in future
    return prisma.$queryRaw`
      SELECT *, (
        6371 * acos(cos(radians(${lat})) * cos(radians(latitude))
        * cos(radians(longitude) - radians(${lng}))
        + sin(radians(${lat})) * sin(radians(latitude)))
      ) AS distance
      FROM Spot
      WHERE expiresAt > datetime('now')
      HAVING distance < ${radiusKm}
      ORDER BY distance LIMIT 20
    `;
  }
}
```

Switching to PostgreSQL with PostGIS later only requires changing this one method.

### 9.2 Cache Layer Abstraction

```typescript
// lib/cache.ts — interface ready for Redis replacement
interface CacheAdapter {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T, ttlSeconds: number): void;
  del(key: string): void;
}
```

Today: `node-cache`. Tomorrow: Redis with same interface, zero consumer changes.

### 9.3 Job Queue Abstraction

Background jobs use an interface that maps to BullMQ when running in cloud:

```typescript
// lib/queue.ts
interface JobQueue {
  enqueue(jobName: string, data: Record<string, unknown>, options?: { delay?: number }): Promise<void>;
}
// Local: direct function call with setTimeout
// Cloud: BullMQ backed by Redis
```

---

## 10. Observability & Telemetry

### 10.1 Telemetry Event Taxonomy

Every meaningful user action emits a structured event to `TelemetryEvent`. This is the foundation for all PRD success metrics.

```
ACQUISITION
  user.registered               { locale, source }
  user.onboarding_started       { }

ONBOARDING FUNNEL
  quiz.genre_selected           { genres[] }
  quiz.mood_selected            { moods[] }
  quiz.round_completed          { round, selectedCount, totalShown }
  quiz.completed                { totalRounds, durationMs }
  style.profile_generated       { confidence, topTag, durationMs }

ENGAGEMENT — CAMERA
  camera.session_started        { hasLocation, sceneType }
  camera.session_ended          { durationMs, overlaysShown, overlaysUsed }
  camera.overlay_interaction    { overlayType, accepted }
  guidance.tip_shown            { sceneType, styleMatchScore }
  guidance.tip_cache_hit        { cacheKey }

ENGAGEMENT — SPOTS
  spot.map_opened               { nearbyCount }
  spot.viewed                   { spotId, source, distanceKm }
  spot.saved                    { spotId }
  spot.submitted                { }

NOTIFICATIONS
  notification.scheduled        { type, leadTimeHours }
  notification.sent             { type }
  notification.opened           { type, lagMinutes }
  notification.dismissed        { type }

MONETIZATION
  paywall.shown                 { feature, tier }
  paywall.dismissed             { feature }
  subscription.started          { tier, price }

SESSION
  session.start                 { tier, locale }
  session.end                   { durationMs, screensVisited[] }
```

### 10.2 Metrics → PRD Success Metrics Mapping

Each PRD business metric maps directly to telemetry queries:

```sql
-- D7 Retention
-- "Users who had a session.start event on day N and also on day N+7"
SELECT
  COUNT(DISTINCT w1.userId) AS retained,
  COUNT(DISTINCT w0.userId) AS cohort,
  ROUND(100.0 * COUNT(DISTINCT w1.userId) / COUNT(DISTINCT w0.userId), 1) AS d7_pct
FROM TelemetryEvent w0
LEFT JOIN TelemetryEvent w1
  ON w1.userId = w0.userId
  AND w1.eventType = 'session.start'
  AND date(w1.createdAt) = date(w0.createdAt, '+7 days')
WHERE w0.eventType = 'session.start'
  AND date(w0.createdAt) = '2026-03-03';  -- cohort date

-- Style quiz completion rate
SELECT
  ROUND(100.0 * completed / started, 1) AS completion_rate
FROM (
  SELECT
    COUNT(CASE WHEN eventType = 'quiz.completed' THEN 1 END) AS completed,
    COUNT(CASE WHEN eventType = 'quiz.genre_selected' THEN 1 END) AS started
  FROM TelemetryEvent
  WHERE date(createdAt) >= date('now', '-30 days')
) t;

-- Weekly notification action rate
SELECT
  ROUND(100.0 * opened / sent, 1) AS open_rate
FROM (
  SELECT
    COUNT(CASE WHEN eventType = 'notification.opened' THEN 1 END) AS opened,
    COUNT(CASE WHEN eventType = 'notification.sent' THEN 1 END) AS sent
  FROM TelemetryEvent
  WHERE date(createdAt) >= date('now', '-7 days')
) t;

-- Camera overlay engagement (% sessions with at least 1 overlay interaction)
SELECT
  ROUND(100.0 * engaged / total, 1) AS engagement_rate
FROM (
  SELECT
    COUNT(DISTINCT CASE WHEN e2.id IS NOT NULL THEN e1.userId END) AS engaged,
    COUNT(DISTINCT e1.userId) AS total
  FROM TelemetryEvent e1
  LEFT JOIN TelemetryEvent e2
    ON e2.userId = e1.userId
    AND e2.eventType = 'camera.overlay_interaction'
    AND date(e2.createdAt) = date(e1.createdAt)
  WHERE e1.eventType = 'camera.session_started'
    AND date(e1.createdAt) >= date('now', '-7 days')
) t;

-- Average sessions per active user per week
SELECT ROUND(AVG(weekly_sessions), 1) AS avg_sessions_per_user
FROM (
  SELECT userId, COUNT(*) AS weekly_sessions
  FROM TelemetryEvent
  WHERE eventType = 'session.start'
    AND createdAt >= date('now', '-7 days')
  GROUP BY userId
) t;
```

### 10.3 Daily Metric Rollup Job

The `metricsRollup` cron runs nightly at midnight local time:

```typescript
// jobs/metricsRollup.ts
const metrics = [
  { name: 'dau',                  query: countDailyActiveUsers },
  { name: 'new_users',            query: countNewRegistrations },
  { name: 'd7_retention',         query: computeD7Retention },
  { name: 'quiz_completion_rate', query: computeQuizCompletion },
  { name: 'notif_open_rate',      query: computeNotifOpenRate },
  { name: 'overlay_engagement',   query: computeOverlayEngagement },
  { name: 'ai_cost_usd',          query: sumAPICallCosts },
];

for (const m of metrics) {
  const value = await m.query(yesterday);
  await prisma.dailyMetricRollup.upsert({
    where: { date_metric: { date: yesterday, metric: m.name } },
    update: { value },
    create: { date: yesterday, metric: m.name, value },
  });
}
```

### 10.4 Local Metrics Dashboard

A lightweight HTML dashboard served at `http://localhost:3001/dashboard` (local dev only) reads from `DailyMetricRollup` and renders key trends as charts. Built with vanilla HTML + Chart.js — no additional dependencies.

### 10.5 API Cost Observability

Every external API call is logged to `APICallLog` with estimated cost:

```typescript
// lib/apiLogger.ts
export async function logAPICall(params: {
  service: string;
  endpoint: string;
  latencyMs: number;
  statusCode: number;
  tokensUsed?: number;
}) {
  const costEstimate = computeCost(params.service, params.tokensUsed);
  await prisma.aPICallLog.create({ data: { ...params, costEstimate } });
}

function computeCost(service: string, tokens?: number): number {
  if (service === 'anthropic' && tokens) {
    return (tokens / 1_000_000) * 3.0;  // claude-sonnet-4-6 input rate
  }
  // OpenWeather, Places — flat per-call estimates
  return service === 'openweather' ? 0.00015 : 0.0017;
}
```

Dashboard includes a "Cost this week" panel so API spend is always visible during development.

### 10.6 Structured Logging

```typescript
// All logs are structured JSON for easy grepping
logger.info({
  event: 'guidance.generated',
  userId,
  sceneType,
  styleMatchScore,
  cacheHit: false,
  latencyMs: 1240,
  model: 'claude-haiku-4-5-20251001',
  tokensUsed: 380,
}, 'Scene guidance generated');
```

---

## 11. Implementation Plan

### 11.1 Phase Overview

```
Phase 0 — Setup & Foundation          Week 1        (4 days)
Phase 1 — Auth & Onboarding           Weeks 2–3     (8 days)
Phase 2 — Camera & Core AI            Weeks 4–5     (8 days)
Phase 3 — Spots & Notifications       Weeks 6–7     (8 days)
Phase 4 — Pro Features & Paywall      Week 8        (4 days)
Phase 5 — Observability & Polish      Week 9        (4 days)
Buffer                                Week 10       (5 days)
                                      ─────────────────────
Total                                 ~9 working weeks
```

---

### Phase 0 — Setup & Foundation (Week 1)

**Goal:** Running skeleton with DB connected and all API keys verified.

| Task | Detail |
|------|--------|
| Expo project init | `npx create-expo-app visionweave --template blank-typescript` |
| Express server init | `ts-node`, Prisma, Zod, Pino, dotenv configured |
| Prisma schema + first migration | All tables from Section 4.2 |
| `.env` setup | All 5 API keys, JWT secrets |
| API key smoke tests | One call each to Claude, OpenWeather, Google Places, Unsplash |
| suncalc integration | Verify azimuth/golden hour calculation with known lat/lng |
| Git repo + `.gitignore` | Ensure `.env` and `.db` files excluded |
| Pino logger | Structured JSON logs to console + file |

**Exit criteria:** `GET /health` returns 200; Prisma migrations run cleanly; one Claude call succeeds from the server.

---

### Phase 1 — Auth & Onboarding (Weeks 2–3)

**Goal:** User can register, complete the full style quiz, and have a style profile generated by Claude.

| Task | Detail |
|------|--------|
| Auth routes + JWT | `POST /auth/register`, `/login`, `/refresh` |
| Auth store (Zustand) | JWT persistence via expo-secure-store |
| Registration screen | Email, password, name, locale selector |
| Login screen | With error handling |
| Auth guard in Expo Router | Redirect unauthenticated to login |
| Genre selection screen | Multi-select chips with animation |
| Mood/aesthetic selection | Multi-select chips |
| Photo quiz screen | 4-card grid, single/multi-select, progress bar |
| `GET /quiz/photos` route | Unsplash fetch → local SQLite cache |
| `POST /quiz/response` route | Log each swipe to PhotoPreference |
| `POST /quiz/complete` route | Trigger Claude style inference |
| Style inference service | Claude prompt → styleVector + summary |
| Style profile display | "Your style: Warm golden-hour portraits…" |
| Onboarding completion flow | Transition to home screen |

**Exit criteria:** Full onboarding flow end-to-end; Claude returns a valid style vector; profile stored in DB.

---

### Phase 2 — Camera & Core AI (Weeks 4–5)

**Goal:** Camera screen with live overlays, sun direction, scene context, and AI-generated composition tip.

| Task | Detail |
|------|--------|
| Location permissions | expo-location; foreground + background request flow |
| `useSunPosition` hook | suncalc real-time azimuth/altitude |
| `useSceneContext` hook | Derive scene label from sun position thresholds |
| Camera screen layout | expo-camera viewfinder, bottom controls |
| CompositionOverlay component | Rule-of-thirds SVG lines, animated fade in/out |
| SunDirectionIndicator component | Compass rose with sun bearing arrow |
| SceneContextBanner component | Scene label pill at top of viewfinder |
| `GET /guidance/scene` route | Claude haiku inference + cache logic |
| GuidanceCard component | Composition tip card, 12-word max |
| Camera session tracking | Start/end events, overlays_shown counter |
| Home screen skeleton | LightHeroCard, SpotScrollRow, EventTimeline |
| Home screen data | Wire up weather + location for hero card |
| Telemetry instrumentation | Camera events per Section 10.1 |

**Exit criteria:** Camera opens; overlays visible; sun direction correct; AI tip appears within 2s on first load, instantly on subsequent same-scene loads.

---

### Phase 3 — Spots & Notifications (Weeks 6–7)

**Goal:** Nearby spots on a map, shoot opportunity notifications for free tier (golden/blue hour timing).

| Task | Detail |
|------|--------|
| `GET /spots/nearby` route | Google Places nearby + cache |
| Spots repository + cache | 24h TTL, haversine SQL |
| Spots map screen | react-native-maps dark mode, amber pins |
| Spots list view | Scrollable list below map |
| Spot detail sheet | Slide-up: name, style tags, best time, distance |
| `POST /spots` route | Community spot submission |
| Weather service | OpenWeatherMap fetch + parsing |
| Notification engine | Evaluate conditions per PRD (golden hour, blue hour) |
| `notificationScheduler` cron | Hourly job, insert Notification rows |
| `weatherPoller` cron | 30-min job, update WeatherCache |
| Expo local notifications | Schedule device-level alerts |
| `GET /events/upcoming` route | Read pre-computed notifications from DB |
| EventTimeline on home screen | Wire up real data |
| Notification open tracking | Link tap → telemetry event |

**Exit criteria:** Golden hour notification appears 15 min before sunset; spots visible on map; community spot submittable.

---

### Phase 4 — Pro Features & Paywall (Week 8)

**Goal:** Pro tier gates working; weather/astronomy notifications active for Pro users; passive style learning wired up.

| Task | Detail |
|------|--------|
| ProPaywall component | Feature-locked overlay with upgrade CTA |
| Tier check middleware | Verify tier before serving Pro endpoints |
| Astronomy service | Moon phase, Milky Way window computation |
| Pro notification types | Fog, snow, overcast, clear night, astro events |
| Style-aware notification filtering | Only send if event matches user style vector |
| BehaviorEvent emitters | Wire existing events to DB writes |
| `styleRefresher` cron | Weekly Claude re-inference with behavior signals |
| Progress stats | Shoots count, spots visited, styles explored |
| Profile screen | Style summary, progress stats, re-quiz entry |
| Re-quiz flow | 10-round refresh (not full 20) |

**Exit criteria:** Pro-locked events appear locked for FREE users; Pro user receives fog/astronomy notifications; behavior events writing to DB.

---

### Phase 5 — Observability & Polish (Week 9)

**Goal:** All telemetry events firing; metrics dashboard readable; performance targets met.

| Task | Detail |
|------|--------|
| Full telemetry audit | Verify every event in Section 10.1 fires |
| `metricsRollup` cron | Nightly aggregation job |
| Local metrics dashboard | `/dashboard` endpoint with Chart.js |
| API cost panel | Daily/weekly API spend visible |
| Performance profiling | Measure cold start, API P95s |
| SQLite indexes | Add all indexes from Section 7.4 |
| Cache hit rate logging | Log cache hits in guidance + spots |
| Error boundary screens | Graceful fallback for all failure states |
| Offline mode | Camera overlay works with no network |
| UI polish pass | Animations, loading skeletons, empty states |

**Exit criteria:** All PRD success metric queries return valid data; camera overlay works airplane mode; API dashboard shows cost; P95 guidance response <200ms.

---

### 11.2 Critical Path

```
Register → Quiz → StyleProfile → CameraOverlay → SceneGuidance

Each step is a hard dependency. If Claude style inference is broken,
camera guidance has no style vector to work with.

Parallel tracks that can run independently after Phase 0:
  Track A: Auth → Quiz → Style AI (Phases 1–2 camera)
  Track B: Spots → Notifications → Weather (Phase 3)
  Track C: Telemetry schema → events → rollup (can instrument any time)
```

### 11.3 Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Claude API latency >3s for quiz completion | Medium | Medium | Show progress skeleton; acceptable for one-time flow |
| Google Places API quota exhausted in development | Low | High | Aggressive 24h cache; mock data fallback for dev |
| expo-camera permissions rejected on simulator | Medium | High | Test on real device early; document setup steps |
| suncalc inaccuracy at extreme latitudes | Low | Low | Validate against known times for target markets |
| SQLite file corruption | Very Low | High | Daily `VACUUM` job; keep last 3 DB snapshots |
| Style vector drift (passive learning too aggressive) | Medium | Medium | Hard cap of ±0.15 drift per 30 days |
| AI prompt injection via user-controlled data | Low | High | Never interpolate user freetext into prompts (Section 8.4) |

### 11.4 Environment Setup Checklist

```bash
# 1. Install dependencies
node -v          # Must be 22+
npm install -g expo-cli

# 2. Clone and install
cd visionweave
npm install           # mobile app
cd server && npm install

# 3. Configure environment
cp .env.example .env
# Fill in: ANTHROPIC_API_KEY, OPENWEATHER_API_KEY,
#          GOOGLE_PLACES_API_KEY, UNSPLASH_ACCESS_KEY,
#          JWT_SECRET, JWT_REFRESH_SECRET

# 4. Initialize database
cd server
npx prisma migrate dev --name init
npx prisma generate

# 5. Start development
# Terminal 1: API server
cd server && npm run dev     # localhost:3001

# Terminal 2: Expo
cd mobile && npx expo start  # Opens on iOS simulator

# 6. Verify
curl http://localhost:3001/health
# → { status: "ok", db: "connected", aiKey: "present" }
```

---

*Architecture authored for VisionWeave MVP — local scope, production-grade design.*
*Ready for engineering sprint planning.*
