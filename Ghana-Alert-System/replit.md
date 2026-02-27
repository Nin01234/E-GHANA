# E-GHANA — Emergency Response System

## Overview
Ghana's production-ready citizen emergency reporting and panic alert mobile app built with Expo React Native (iOS + Android + Web) and an Express.js backend.

## Architecture

### Frontend (Expo React Native)
- **Framework**: Expo Router (file-based routing)
- **State**: AuthContext (sessions), EmergencyContext (incidents)
- **Server State**: TanStack React Query
- **UI**: Custom components with Rubik font, Emergency Red (#E8001C) + Ghana Gold (#FFD100) theme
- **Icons**: @expo/vector-icons (MaterialCommunityIcons, Ionicons)
- **Animation**: react-native-reanimated

### Backend (Supabase)
- **Database + Auth**: Supabase project (`https://mcvdzewqydblspcnmkrs.supabase.co`)
- **Auth**: Supabase Auth (email/password under the hood using a synthetic email from phone)
- **Data**: `users` and `incidents` tables managed directly from the mobile app via Supabase client

## App Structure

```
app/
  _layout.tsx          # Root layout with AuthGuard (redirects unauth → /auth/login)
  auth/
    login.tsx          # Phone + password login
    register.tsx       # 3-step registration (details → national ID → face selfie)
    face-verify.tsx    # Camera-based face verification
  (tabs)/
    _layout.tsx        # Tab bar (4 tabs)
    index.tsx          # Home — PANIC button + emergency numbers
    contacts.tsx       # Emergency contacts (112/191/192/193)
    history.tsx        # Incident history with swipe-to-delete
    settings.tsx       # Language, identity, privacy, about
  panic.tsx            # Fullscreen panic modal
  report.tsx           # Incident report modal
  incident/[id].tsx    # Incident detail screen

contexts/
  AuthContext.tsx      # User auth state (login/register/logout/verifyFace)
  EmergencyContext.tsx # Incidents CRUD + panic trigger

server/
  index.ts             # Express app setup, CORS
  routes.ts            # All API routes (auth + incidents)
  db.ts                # Drizzle + pg Pool

shared/
  schema.ts            # Drizzle schema (users, incidents tables)

constants/
  colors.ts            # E-GHANA theme colors (light + dark)
  translations.ts      # Multi-language strings (English, Twi, Ga, Ewe)
```

## Key Features

### Authentication (3-step registration)
1. Personal details (name, phone, email, password)
2. National ID selection: Ghana Card, NHIS, Driving Licence, Voter's ID, Passport
3. Face selfie for biometric verification

### Emergency Reporting
- One-tap PANIC button (hold 2s to activate) — Silent or Loud mode
- Real-time GPS location capture
- Incident reporting with type (Police/Fire/Medical/Other)
- Incident history with swipe-to-delete

### Compliance
- Ghana Data Protection Act (Act 843)
- NIA National ID integration
- Emergency numbers: 112 / 191 / 192 / 193

## Environment Variables
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL (defaults to `https://mcvdzewqydblspcnmkrs.supabase.co`)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon public key

## Workflows
- **Start App**: `npm start`
