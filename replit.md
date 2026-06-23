# Grace Social

A faith-based social media app (Expo/React Native + Express API) where users can share posts, stories, prayer requests, Bible verses, reels, and community groups.

## Run & Operate

- `pnpm --filter @workspace/grace-social run dev` — start Expo web app (port 5000, webview)
- `PORT=3000 pnpm --filter @workspace/api-server run dev` — start API server (port 3000, console)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: Expo 54 / React Native 0.81, Expo Router v6, React Native Web
- API: Express 5, port 3000
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT + bcryptjs, stored in AsyncStorage (mobile) / localStorage (web)
- Build: esbuild (API CJS bundle), Metro (Expo web)

## Where things live

- `artifacts/grace-social/` — Expo app (screens, components, context, constants)
- `artifacts/grace-social/app/` — Expo Router screens (tabs + modals)
- `artifacts/grace-social/context/AppContext.tsx` — all local in-memory state (posts, prayers, reels, communities, notifications)
- `artifacts/grace-social/context/AuthContext.tsx` — real auth state via API (login, register, follow)
- `artifacts/api-server/src/routes/` — auth.ts, follows.ts (Express routes)
- `artifacts/api-server/src/` — Express app entry, DB pool

## Architecture decisions

- **Two-tier data model**: Auth (real PostgreSQL via API) + Social content (in-memory AppContext). The feed, reels, prayer wall, communities, notifications and messages all use rich local seed data in AppContext — no persistence required for these features yet.
- **Follow system split**: `AuthContext.followUser/unfollowUser` hits the real API (for member-profile and search screens). `AppContext.toggleFollow` manages local state for suggested people cards (which use fake seed user handles).
- **API URL**: Uses `EXPO_PUBLIC_API_URL` env var (set to `https://3000-$REPLIT_DEV_DOMAIN/api` in dev). Falls back to `EXPO_PUBLIC_DOMAIN` then `http://localhost:3000/api`.
- **Post ownership**: New posts use `userId: 'currentUser'` so PostCard can detect own posts consistently.
- **Simulated notifications**: AppContext fires simulated notifications every 35s (starting at 18s) to demonstrate the notification system.

## Product

- **Home Feed** — posts with video/image support, double-tap heart like, story bar, suggested people, daily verse, ad cards interleaved every 3 posts, FAB to create post or story
- **Realms** — vertical video reel feed (like TikTok), full-screen swipe with like/save/share, FAB to upload
- **Prayer Wall** — category-filtered prayer requests, pray button, scripture responses, prayer comments, FAB to add prayer
- **Community** — join/leave groups, community feed/members/about, group chat with verse/prayer/image attachments
- **Bible** — 66-book browser + verse categories + search, post any verse directly to feed
- **Messages** — DM list and conversation threads
- **Notifications** — real-time-simulated, filterable by type, swipe/long-press to delete
- **Search** — user search with follow/unfollow, explore categories, trending posts
- **Profile** — posts/reels/saved/liked tabs, edit profile, dark mode, full settings

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Expo dev script uses `--port ${PORT:-5000}`: the "Grace Social" webview workflow (no $PORT) uses 5000; the `artifacts/grace-social: expo` canvas workflow has $PORT set by Replit and uses that assigned port — both can run simultaneously without conflict
- `EXPO_PUBLIC_*` vars are baked into the Metro bundle at build time — restart the workflow after changing them
- API server requires `NODE_ENV` and `PORT` set; the `dev` script sets both via `export NODE_ENV=development && PORT=3000`
- `bcrypt` (native) is excluded from API bundle — use `bcryptjs` only
- `addComment`/`addPrayerComment` accept an optional `user` param — callers should pass `currentUser` data from AuthContext

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
