the mobile app
 # E-GHANA – Emergency Alert System

E-GHANA is a mobile-first emergency alert system for Ghana built with **Expo**, **React Native**, **Expo Router**, and **Supabase**.  
It lets users quickly raise panic alerts, share location and media, view incident history, manage emergency contacts, and receive notifications.

> This README is written for a **team project** – it explains structure, setup, and how we should work together.

---

## Tech stack

- **App runtime**: Expo (`expo`, `react-native`, `expo-router`)
- **Language**: TypeScript / React (React 19, React Native 0.81)
- **Backend services**: Supabase (`@supabase/supabase-js`) + PostgreSQL
- **Data layer**: Drizzle ORM (`drizzle-orm`, `drizzle-kit`)
- **State / server cache**: `@tanstack/react-query`
- **Node server utilities**: `express`, `express-session`, `ws`, `multer`, `pg`

---

## Project structure (high level)

- `app/`
  - `app/_layout.tsx` – main layout (navigation shell)
  - `app/(tabs)/` – main tab screens (home, history, contacts, notifications, settings, etc.)
  - `app/auth/` – authentication-related screens (login, forgot password, face verification)
  - `app/incident/[id].tsx` – incident details screen
  - `app/panic.tsx` – panic / emergency trigger flow
  - `app/report.tsx` – create and submit incident reports
- `components/` – shared UI and helper components
- `contexts/`
  - `AuthContext.tsx` – authentication and current user state
  - `AppLockContext.tsx` – app lock / biometric logic
  - `EmergencyContext.tsx` – active emergency, panic button state, etc.
- `lib/`
  - `connectivity.ts` – network / connectivity utilities
  - `firstAid.ts` – first-aid content and helpers
  - `mediaUpload.ts` – media upload helpers (Supabase storage, etc.)
- `constants/`
  - `colors.ts` – design system colors
  - `translations.ts` – copy / translations
- `scripts/`
  - `create-supabase-buckets.js` – creates required Supabase storage buckets
- `docs/`
  - `VOICE_CALL_EMERGENCY_SPEC.md` – spec for voice call emergency handling
- `SUPABASE_STORAGE_SETUP.md` – how to configure Supabase storage for this app
- `app.json` – Expo app config (name, icons, permissions, bundle IDs)
- `package.json` – npm dependencies and scripts

---

## Getting started (for all team members)

### 1. Prerequisites

- Node.js LTS (v18+ recommended)
- npm or yarn (we currently use **npm**)
- Expo CLI (via `npx expo` – no global install required)
- A Supabase project (access to the shared team instance)

### 2. Install dependencies

From the `Ghana-Alert-System` folder:

```bash
cd Ghana-Alert-System
npm install
```

### 3. Environment variables

Create an `.env` or `expo-env.d.ts`-compatible setup (see how Supabase client is initialized in `lib/`), then add at least:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Do **not** commit secrets; use local `.env` files or the Expo / CI secrets system.

### 4. Supabase storage setup

Follow `SUPABASE_STORAGE_SETUP.md` for:

- Required buckets (e.g. evidence media, profile images, etc.)
- Public vs private bucket policies
- Any RLS (Row Level Security) policies the app depends on

You can also run the helper script:

```bash
npm run supabase:create-buckets
```

…which calls `scripts/create-supabase-buckets.js` to create the buckets with the expected names.

---

## Running the app

From the `Ghana-Alert-System` directory:

```bash
# Start Metro / Expo dev server
npm run start

# Alternatively, run directly on platforms:
npm run android
npm run ios   # requires macOS + Xcode
```

Use the Expo Dev Tools or CLI to open the app on a physical device or emulator.

---

## Available npm scripts

Defined in `package.json`:

- `npm run start` – start the Expo dev server
- `npm run android` – run on Android (build + install native binary)
- `npm run ios` – run on iOS (macOS only)
- `npm run lint` – run Expo ESLint checks
- `npm run lint:fix` – run ESLint and auto-fix issues
- `npm run supabase:create-buckets` – create required Supabase storage buckets

---

## Core features (functional overview)

- **Panic / SOS button**
  - Quickly trigger an emergency alert
  - Captures approximate location using `expo-location`
  - Optionally attaches photos, video, or audio evidence (`expo-camera`, `expo-image-picker`, `expo-av`)
- **Incident reporting**
  - Structured incident report form
  - Uploads media to Supabase storage
  - Stores metadata in PostgreSQL via Drizzle ORM
- **Incident history**
  - List of past incidents and current statuses
  - Drill down via `app/incident/[id].tsx`
- **Emergency contacts**
  - Manage contacts to notify during emergencies
- **Notifications**
  - In-app notification UI (and potentially push notifications later)
- **App lock & biometrics**
  - Optional biometric lock using `expo-local-authentication`

---

## Coding standards & conventions

- **Language / framework**
  - Use **TypeScript** for new code.
  - Use **functional React components** and React Hooks.
- **Routing**
  - Use **Expo Router** conventions (file-based routing under `app/`).
  - Group tabs under `app/(tabs)/`, and keep screen files descriptive.
- **Styling**
  - Prefer shared colors from `constants/colors.ts`.
  - Reuse components from `components/` where possible.
- **Data fetching**
  - Use **React Query** (`@tanstack/react-query`) for server data where appropriate.
  - Keep Supabase / network calls in `lib/` or dedicated hooks, not directly in components when possible.
- **Error handling**
  - Prefer central error handling UI like `components/ErrorFallback.tsx`.

Before opening a PR or pushing, please run:

```bash
npm run lint
```

Fix what you can, or leave comments in the PR for remaining issues.

---

## Git workflow (team)

- **Main branch**: `main` (protected – no direct force pushes)
- **Feature branches**: use descriptive branch names, e.g.:
  - `feature/panic-button-ui`
  - `fix/location-permission-android`
  - `chore/update-deps-2026-03`

### Typical flow

1. Pull latest changes:
   ```bash
   git pull origin main
   ```
2. Create a new branch:
   ```bash
   git checkout -b feature/my-feature-name
   ```
3. Make changes and commit:
   ```bash
   git add .
   git commit -m "Describe what you changed"
   ```
4. Push and open a PR:
   ```bash
   git push origin feature/my-feature-name
   ```
5. Request review from another teammate before merging.

---

## Contribution guidelines

- **Keep changes focused** – one feature or fix per branch.
- **Write meaningful commit messages**, e.g.:
  - `Add panic screen with map and timer`
  - `Fix Supabase upload error on slow connections`
- **Document behavior changes** in this `README.md` or in `docs/` when relevant.
- **Avoid committing secrets** (API keys, passwords, etc.).
- **Add types** and **handle errors** for all new async code.

---

## Troubleshooting

- **Metro bundler stuck / app not updating**
  - Stop the dev server and restart:
    ```bash
    npm run start -- --clear
    ```
- **Android build issues**
  - Ensure Android SDK and Java are installed and configured.
  - Try cleaning the build from Android Studio if needed.
- **Supabase errors**
  - Check environment variables (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
  - Confirm buckets and RLS policies match `SUPABASE_STORAGE_SETUP.md`.

If something is unclear, please open an issue in GitHub or add a section to this README so the whole team benefits.

