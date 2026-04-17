# VisionWeave — Product Requirements Document

**Version 1.0 | March 2026**

---

## 1. Problem Statement

Photography has never been more accessible — yet the gap between "taking a photo" and "taking a great photo" remains frustratingly wide for the 18–35 demographic. Amateur photographers face three compounding problems:

1. **Knowledge gap at the moment of capture.** They know their photos could be better but don't know why they're falling short while standing in front of a scene. Photography education is abundant online but entirely disconnected from the real world, real time, real light.

2. **No awareness of opportunity.** The best photographic moments — golden hour, fog, a clearing storm — pass unnoticed because users don't know to look for them, or don't know that the park 10 minutes away is perfect for the aesthetic they love.

3. **Style without vocabulary.** Most amateurs know what photos they like but can't articulate their own style, making it impossible to seek consistent guidance or develop a coherent photographic voice.

### Why Existing Solutions Fall Short

| Solution | Gap |
|---|---|
| YouTube / tutorials | Passive, generic, disconnected from the user's location, time, and taste |
| Camera apps (Halide, ProCam) | Technical tools, not coaches — no personalization, no guidance |
| Lightroom / VSCO | Post-processing only, no in-the-moment intelligence |
| Photography communities (500px, Flickr) | Inspiration without instruction |

### The Opportunity

VisionWeave sits at the intersection of location intelligence, personal taste, and real-time AI guidance — acting as a 24/7 AI photography coach that knows where you are, understands what you love, and tells you exactly how to capture it.

---

## 2. Business Success Metrics

### Primary KPIs — 6-Month Post-Launch Targets

| Metric | Target | Benchmark Basis |
|---|---|---|
| Total downloads | 100,000 across 6 launch markets | Freemium utility app, focused ASO + organic |
| D7 retention | 35% | Strong lifestyle app benchmark |
| D30 retention | 20% | Industry average 10–15%; targeting above average |
| D90 retention | 12% | Indicates habitual use forming |
| Organic / word-of-mouth installs | 25% of new installs | Referral loop from "share your shot" |
| Weekly notification open rate | 30% | Users acting on shoot opportunity alerts |
| Free → Pro conversion | 4–6% | Freemium utility app industry benchmark |
| Style quiz completion rate | 80% of registered users | Measures onboarding funnel health |

### Secondary KPIs

- Average sessions per active user per week: ≥ 3
- Camera overlay feature engagement: 60% of sessions use it
- Photo spot views per session: ≥ 2
- App Store rating: ≥ 4.5 stars within 90 days of launch

---

## 3. Personas & Key User Journeys

### Persona 1 — "The Casual Shooter" *(Primary, Phase 1 focus)*

**Profile:** Maya, 22, university student, Toronto. Shoots on iPhone 15. Posts to Instagram 3×/week. Has no formal photography training. Frustrated that her photos look flat compared to people she follows. Has tried Lightroom presets but doesn't understand why the results are inconsistent.

**Goals:** Take photos she's proud of without studying photography. Discover cool spots near her. Feel like she has a "photographer's eye."

**Frustrations:** Technical jargon, inconsistent results, missing the right light, not knowing where to go.

**Tier:** Free → likely converts to Pro once she sees notification value.

#### Maya's Key User Journey

**Discovery & Onboarding**
1. Sees VisionWeave ad/referral on Instagram Reels
2. Downloads from App Store (iOS)
3. Registers with email or Apple ID
4. Greeted with a short value statement: *"Let's find your style"*
5. Style quiz begins:
   - Step 1: Selects photography genres she's drawn to (landscape, portrait, street, architecture, astro — pick multiple)
   - Step 2: Selects mood/aesthetic preferences (moody & dark, bright & airy, film grain, minimalist, vibrant, golden tones — pick multiple)
   - Step 3: Shown grids of 4 photos at a time — taps to select the ones she loves (~20 grids)
6. Profile created: *"Your style: Golden-hour portraits, warm tones, soft light"*
7. Lands on home screen

**Daily Active Use (Free Tier)**
1. Opens app on a weekend morning
2. Home screen shows: local photo spots near her + today's light conditions
3. Taps a nearby park marked as a good spot for her style
4. Switches to camera view
5. Sees real-time composition overlay: rule of thirds grid, horizon line, a directional arrow showing optimal sunlight direction
6. Scene context banner: *"Soft diffused light — good for portraits. Sun at 45° left"*
7. Takes her shot, feels guided
8. Downloads photo to camera roll, shares directly to Instagram

**Upgrade Trigger**
1. Receives a locked notification preview: *"Pro: Fog rolling into your area at 7am tomorrow — perfect for your moody style"*
2. Taps → paywall screen explaining Pro features
3. Converts to Pro

---

### Persona 2 — "The Aspiring Enthusiast" *(Primary, Phase 1–2)*

**Profile:** James, 29, marketing professional, London. Shoots on Sony mirrorless on weekends. Watches YouTube photography channels. Understands basics (exposure triangle) but struggles with consistency and finding inspiration. Wants to build a portfolio.

**Goals:** Improve compositional instincts, plan shoots around good conditions, develop a recognizable style.

**Tier:** Pro from early on — values the weather/timing/astronomy features.

#### James's Key User Journey

**First Week**
1. Downloads app after a photographer friend recommends it
2. Completes style quiz — selects: landscape, architecture, blue-hour, moody, minimalist
3. Style profile: *"Architectural minimalism, cool blue tones, dusk light"*
4. Explores nearby spots — sees community-tagged locations with style tags matching his profile
5. Plans a weekend shoot at a tagged bridge location

**Planning a Shoot (Pro)**
1. Opens app Thursday evening
2. Notification received: *"Sunday 6:12am — blue hour + clear skies in London. Matches your style."*
3. Taps notification → sees detailed shoot plan: location suggestion, expected light direction, composition tips for his style
4. Sets a reminder
5. Sunday morning: opens camera view at location, overlays guide his framing
6. Leaves satisfied with consistent, intentional results

**Style Evolution**
1. After 3 months, app nudges: *"Your style seems to be shifting — more urban street shots lately. Want to update your profile?"*
2. Taps → quick re-quiz (10 grids, not the full onboarding flow)
3. Profile updated, guidance recalibrates

---

### Persona 3 — "The Semi-Pro" *(Secondary, Phase 2)*

**Profile:** Sophie, 33, freelance content creator, Sydney. Shoots for brand clients on weekends, personal projects on weekdays. Needs to find locations fast, plan around client shoot days, and maintain a consistent visual style for her portfolio.

**Goals:** Efficient shoot planning, location scouting, consistent aesthetic across work.

**Tier:** Pro, early candidate for Studio tier.

#### Sophie's Key User Journey

**Location Scouting**
1. Has a client shoot in 5 days in an unfamiliar Melbourne suburb
2. Opens VisionWeave, browses photo spots in that suburb
3. Filters by style tags matching client brief (bright, airy, urban)
4. Saves 3 candidate locations
5. Checks each for best time-of-day based on light direction + weather forecast

**Day of Shoot**
1. Opens camera at location
2. Real-time overlay shows optimal framing for the scene
3. Scene context: *"Overcast — flat, even light. Ideal for product shots and skin tones."*
4. Shoots confidently, meets client brief

---

## 4. Technical Success Metrics

| Metric | Target |
|---|---|
| Camera overlay render latency | < 100ms from scene change to overlay update |
| App cold start time | < 2 seconds on iPhone 12 or newer |
| Style quiz completion time | < 3 minutes end-to-end |
| Notification delivery accuracy (timing) | ± 5 minutes of predicted golden hour / weather event |
| AI style profile generation time | < 3 seconds after quiz completion |
| Photo spot map load time | < 1.5 seconds for 20 nearby results |
| Crash-free session rate | ≥ 99.5% |
| API uptime | 99.9% SLA |
| Offline capability | Camera overlay + last-loaded spots usable without connection |
| Battery impact | < 5% battery drain per 30-min camera session |

---

## 5. Scope of MVP

### In Scope

**Onboarding & Style Profile**
- Email + Apple ID registration
- Genre selection (landscape, portrait, street, architecture, astro, travel)
- Mood/aesthetic tag selection (moody, bright & airy, film grain, minimalist, vibrant, golden tones)
- 4-card photo grid style quiz (~20 rounds, single or multi-select)
- Style profile generation and display
- Style profile passive refinement + periodic active re-quiz nudges

**Camera View (Free + Pro)**
- Real-time composition overlays: rule of thirds, horizon line, leading lines
- Sunlight direction indicator
- Scene context banner (light quality, time-of-day descriptor)
- Style-aware overlay adjustments for Pro users

**Photo Spots & Local Ideas (Free + Pro)**
- Google Places API integration for nearby photography-relevant locations
- Community-tagged spots (submit a spot, view community spots)
- Spot detail: best time of day, style tags, community photos
- Map view + list view

**Shoot Opportunity Notifications (Pro only)**
- Golden hour & blue hour alerts
- Sunrise/sunset alerts
- Weather-triggered alerts: overcast, fog, snow, clear night (astro)
- Astronomy events: meteor showers, full moon, Milky Way visibility window
- Notifications personalized by user's style profile

**Style Learning & Personalization (Pro)**
- Full style profile depth (more quiz rounds, finer preference resolution)
- Style-aware camera guidance
- Passive behavior tracking (which overlays are used, which notifications are acted on)
- Periodic style check-in prompt

**Progress Tracking (Light, Free + Pro)**
- Shoots this month counter
- Spots visited count
- Styles explored badge

**Localization**
- English, Chinese (Simplified), French, Spanish
- Available in: US, Canada, UK, Australia, France, China
  - *Note: China distribution requires separate compliance review*

**Sharing**
- Download to camera roll
- Share to Instagram, WeChat, other native share sheet targets

### Out of Scope for MVP

- Android app
- AI-generated location ideas *(post-MVP, cached pre-generation)*
- Social feed / user profiles / follow system
- In-app photo editing
- Studio tier features
- Camera settings suggestions (ISO, aperture, shutter speed)
- Web app

---

## 6. Technical Considerations

### AI Stack (Recommended)

| Function | Provider | Rationale |
|---|---|---|
| Style profile reasoning, personalization logic, conversational guidance | Claude (Anthropic) | Superior at nuanced creative reasoning; long context for style memory |
| Real-time camera scene analysis | OpenAI GPT-4o Vision or Google Gemini Vision | Low-latency vision inference for live camera feed |
| Location intelligence | Google Places API + Maps SDK | Native iOS Maps integration, rich POI data |
| Weather & astronomy data | OpenWeatherMap + AstronomyAPI.com | Reliable, affordable, globally accurate |

### Architecture Considerations

- **Style profile storage:** User style vectors stored server-side, synced on login — enables cross-device continuity
- **Photo repository:** CDN-hosted (Cloudflare or AWS CloudFront), licensed stock (Unsplash/Pexels API) + community-contributed assets moderated before display
- **Notification engine:** Server-side cron jobs evaluating weather + astronomy + time conditions per user location, push via APNs (iOS)
- **Offline mode:** Cache last-known spot data and camera overlay logic locally — core camera features must work without connectivity
- **Location handling:** Request always-on location permission for proactive notifications; foreground-only for camera view users who decline background location
- **China market:** Requires separate compliance review — Google APIs not available, need Baidu Maps + local weather API fallback; WeChat login as auth option
- **Token cost management:** AI calls for style inference batched and cached — avoid per-frame AI calls on camera view; scene analysis runs on keyframe intervals (every 2–3 seconds)
- **Privacy:** Location data never sold; style profile opt-out available; GDPR compliance for UK/France; PIPEDA for Canada

### Platform

- iOS 16+ (iPhone only at launch, iPad stretch goal)
- Swift / SwiftUI preferred for native camera performance
- Consider React Native only if Android timeline accelerates — otherwise native iOS first for camera quality

---

## 7. UI Style Preference

### Design Direction

Given the 18–35 creative demographic and photography context:

- **Dark mode first** — photographers expect dark UI for accurate color perception; reduces eye strain during dawn/dusk shoots
- **Minimal chrome** — UI should disappear when the camera is active; overlays are subtle, non-obstructive
- **Warm accent palette** — echoing golden hour; amber/gold primary accent on dark backgrounds
- **Typography:** Clean, modern sans-serif (SF Pro on iOS); generous whitespace
- **Photo-forward layouts** — photo spots, style quiz, and home screen are image-dominant; let photography speak
- **Micro-animations** — subtle transitions for overlay appearance, notification cards sliding in; nothing that feels "gamified" or cheap
- **Tone of voice:** Encouraging, expert, personal — like a talented photographer friend, not a corporate app. Short, confident copy. *"Perfect light in 22 mins"* not *"A notification has been generated for your viewing area"*

### Key Screens

| Screen | Design Notes |
|---|---|
| Home | Dark card-based layout, today's light summary, 2–3 nearby spot cards, a "shoot now" CTA if conditions are good |
| Camera view | Nearly full-screen viewfinder, minimal HUD, overlay lines in soft amber, scene context as a pill-shaped banner at top |
| Style quiz | Full-bleed photo cards, minimal UI, satisfying selection animation |
| Spots map | Dark map tile (Mapbox dark style or Google Maps night mode), amber pins, slide-up spot detail card |

---

## 8. Corner Cases

### Onboarding

- **User skips style quiz:** Allow skip → show generic overlays, prompt to complete quiz after first camera session with *"Get personalized guidance — finish your style profile"*
- **User selects conflicting styles** (e.g. moody + bright & airy): Treat as broad taste profile, surface both in photo grids, let behavior over time resolve ambiguity
- **Poor internet during quiz:** Cache photo assets locally before quiz begins; if connection drops mid-quiz, save progress and resume

### Camera View

- **No location permission granted:** Disable sunlight direction and scene context; show prompt explaining why location improves the experience; composition overlays still work
- **Indoor use:** Scene context should detect low/artificial light and adjust messaging — don't show "sunlight direction" indoors; show *"Artificial light detected — look for window light"*
- **Night shooting:** Overlays should switch to lower-opacity mode; composition logic still applies
- **Moving subjects / video mode:** Overlays should either lock or gracefully disable — avoid flicker on fast scene changes

### Notifications

- **User in multiple time zones (travel):** Recalculate golden hour based on current GPS location at time of notification scheduling, not home location
- **User has notifications disabled:** Passive in-app banner on home screen showing upcoming shoot windows instead
- **Extreme weather** (storms, smoke, wildfire haze): Suppress "great shooting conditions" notifications; optionally surface as a specific condition (*"Heavy overcast today — try moody long exposures"*)
- **Astronomy event with heavy cloud cover:** Cross-reference weather before sending astronomy notification; suppress if cloud cover > 70%

### Style Profile

- **New user with no shoot history:** Cold start handled entirely by quiz — no behavioral data yet; overlays default to universal best practices
- **User whose taste changes rapidly:** Passive tracking detects divergence within 30 days; triggers early re-quiz nudge rather than waiting for 90-day cycle
- **User deletes account:** Full style data deletion within 30 days per GDPR/PIPEDA

### Photo Repository & Community Spots

- **Inappropriate community-submitted content:** Moderation queue before public display; user reporting mechanism on every spot
- **Community spot becomes inaccessible** (private property, demolished): Users can flag spots as closed; auto-deprioritize spots with multiple flags
- **Unsplash/Pexels API rate limits hit:** Fallback to cached photo sets for quiz; queue API calls and retry silently

### China Market

- **Google APIs unavailable:** Full fallback to Baidu Maps, local weather API, and WeChat login must be implemented before China App Store submission — this is a parallel engineering workstream, not a patch
- **Content moderation requirements:** Photo repository and community spots require compliance review for China market — budget time for this in release planning

### Localization

- **RTL languages (future):** Architecture should not assume LTR from day one
- **Chinese user with French phone locale:** Language follows app language selection, not device locale — user can set independently
- **Translation gaps:** Any untranslated strings fall back to English, never show raw key strings to user

---

## Open Questions for Next Phase

1. **Pricing:** What is the Pro tier monthly/annual price point? *(Recommend: $7.99/month or $49.99/year based on comparable apps)*
2. **China distribution:** Direct App Store or a local partner/reseller? WeChat Mini Program alternative?
3. **Photo repository licensing:** Budget for Unsplash/Pexels API commercial tier + legal review of community-contributed content ownership
4. **Studio tier definition:** Begin scoping professional studio features for Phase 3 roadmap
5. **Android timeline:** At what download/revenue milestone does Android development begin?
