---
name: Grace Social Media Storage
description: Durable media upload and proxied URL behavior for social content.
---

# Grace Social Media Storage

Uploaded social media is stored as PostgreSQL `bytea` and served through authenticated upload plus public media retrieval URLs, rather than keeping device-local picker URIs.

**Why:** Device-local `file://` and browser blob URLs do not survive refreshes, device changes, or deployment boundaries.

**How to apply:** When returning absolute media URLs behind Replit’s proxy, prefer `x-forwarded-proto` and use HTTPS for non-local hosts because `req.protocol` can report the internal HTTP hop.