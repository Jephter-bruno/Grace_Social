---
name: Grace Social Workflow Setup
description: How to configure and run the two required workflows for Grace Social in Replit.
---

The Expo Metro dev script uses `--port ${PORT:-5000}`. The primary workflow falls back to port 5000, while the managed artifact workflow supplies port 18396 through its service environment.

The API server must be started as: `PORT=3000 pnpm --filter @workspace/api-server run dev` with `waitForPort: 3000, outputType: "console"`.

**Why:** The primary Replit webview needs port 5000, while the artifact service has its own configured port. A defaulted shell expression avoids the empty-port failure and prevents the two Expo processes from colliding.

**How to apply:** Keep `${PORT:-5000}` in the package.json dev script. The primary workflow uses its 5000 fallback; the artifact service should retain its configured 18396 environment. API server always runs on port 3000.

API URL for the browser: `EXPO_PUBLIC_API_URL=https://$REPLIT_DEV_DOMAIN/api` is set in the Grace Social dev script. The API is mounted at the main domain's `/api` path; the `3000-` prefix is not routed correctly.

Both the primary Grace Social workflow and the managed artifact Expo workflow may run together when they use their configured ports. The primary log should say `Web is waiting on http://localhost:5000`, and the artifact service should use 18396.

**Why:** Replit exposes both the named product workflow and the artifact service; forcing both to port 5000 creates an `EADDRINUSE` failure.

**How to apply:** Validate that the two Expo processes bind to 5000 and 18396 respectively, rather than stopping the managed artifact workflow.
