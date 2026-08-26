---
name: Grace Social Workflow Setup
description: How to configure and run the two required workflows for Grace Social in Replit.
---

The Expo Metro dev script uses `--port 5000` hardcoded (not `$PORT`, which is unset in Replit workflow runner). Workflow must use `waitForPort: 5000, outputType: "webview"`.

The API server must be started as: `PORT=3000 pnpm --filter @workspace/api-server run dev` with `waitForPort: 3000, outputType: "console"`.

**Why:** Replit workflow runner does not expand `$PORT` in pnpm script env vars; using `$PORT` causes Expo start to fail with "option requires argument: --port". Port 5000 is the Replit webview port.

**How to apply:** Any time the Grace Social workflow is re-created, always hardcode `--port 5000` in the package.json dev script (not $PORT). API server always runs on port 3000.

API URL for the browser: `EXPO_PUBLIC_API_URL=https://$REPLIT_DEV_DOMAIN/api` is set in the Grace Social dev script. The API is mounted at the main domain's `/api` path; the `3000-` prefix is not routed correctly.
