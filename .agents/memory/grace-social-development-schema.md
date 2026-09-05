---
name: Grace Social development schema
description: Durable guidance for keeping the development database aligned with Grace Social API routes.
---

The development database can lag behind the current Drizzle definitions and API route set. A missing table may first appear as an API 500, while an old bundled server can make the same route look like a 404.

**Why:** This project has accumulated auth/follow/testimony tables separately from newer posts, media, stories, and DM features, so a successful auth check does not prove the content API is ready.

**How to apply:** When validating the app, rebuild the API artifact, inspect the development `gs_*` tables, apply only additive development schema alignment when needed, restart the API workflow, and smoke-test public plus protected endpoints separately.