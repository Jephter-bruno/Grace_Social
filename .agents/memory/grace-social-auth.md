---
name: Grace Social Auth Setup
description: Real JWT authentication system for Grace Social app - tables, packages, and patterns used.
---

# Grace Social Auth Setup

## Database Tables
- `gs_users` — id, name, username, email, password_hash, bio, avatar_url, display_name, color, is_verified, followers_count, following_count, posts_count, created_at, updated_at
- `gs_sessions` — id, user_id (FK), token, expires_at, created_at

## API Routes (in artifacts/api-server/src/routes/auth.ts)
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- PATCH /api/auth/profile

## Key Decisions
- Uses `bcryptjs` (NOT `bcrypt`) because bcrypt is a native module and is externalized in build.mjs
- JWT secret falls back to hardcoded string; must set JWT_SECRET env var in production
- Sessions stored in DB (not stateless JWT) for revocation support
- Token persisted in AsyncStorage under key `gracesocial_auth_token`

**Why:** bcrypt is listed in external[] in build.mjs as a native module. bcryptjs is pure JS and bundles fine.

**How to apply:** Always use bcryptjs when adding password hashing. Never use bcrypt directly.

## AuthContext Shape (artifacts/grace-social/context/AuthContext.tsx)
- isLoggedIn, isLoading, currentUser (AuthUser), authToken
- login, signup, updateProfile, logout (async)
- AuthUser includes: id, name, displayName, username, handle, email, bio, avatarUrl, initials, color, followersCount, followingCount, postsCount
