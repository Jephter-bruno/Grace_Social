---
name: Grace Social Architecture
description: Overall architecture of Grace Social - monorepo structure, key patterns, and important decisions.
---

# Grace Social Architecture

## Structure
- `artifacts/grace-social/` — Expo React Native mobile app (web + iOS + Android)
- `artifacts/api-server/` — Express API server (ESM, built with esbuild)
- `lib/db/` — Drizzle ORM + pg, DATABASE_URL env var required
- `lib/api-client-react/` — Generated API client

## Key Patterns
- Auth: JWT + AsyncStorage (token key: `gracesocial_auth_token`)
- API URL: `https://${EXPO_PUBLIC_DOMAIN}/api` (set via workflow env)
- Tab "Reels" was renamed to "Realms" (file is still reels.tsx, just title changed)
- AvatarCircle supports optional `avatarUrl` prop for profile photos
- AppContext holds mock data for posts/stories/prayers/reels/communities
- AuthContext holds real authenticated user data from API

## Feature Status (as of initial build)
- ✅ Real email/password auth with DB persistence
- ✅ AsyncStorage session restore on app reload  
- ✅ Profile edit saves to DB via PATCH /api/auth/profile
- ✅ Profile picture upload via expo-image-picker
- ✅ Reels → Realms rename in all tabs
- ✅ Comments work in Realms (CommentsModal)
- ✅ Settings panel in profile (full Instagram-style settings)
- ✅ Logout confirmation with async logout
- ✅ AvatarCircle shows profile photo when available

## Build Notes
- API server uses esbuild; bcrypt is externalized (use bcryptjs instead)
- Expo workflow: EXPO_PUBLIC_DOMAIN is set to $REPLIT_DEV_DOMAIN
