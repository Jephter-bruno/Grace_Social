---
name: Grace Social dependency alignment
description: Environment-specific guidance for missing Expo modules in the multi-artifact workspace.
---

When Metro cannot resolve an Expo module that is already declared by Grace Social, the workspace install may be stale rather than the import being wrong. Reconcile the artifact's filtered workspace install before changing the feature implementation.

**Why:** The workspace can retain a different Expo module set from the artifact's current SDK declarations, producing misleading "Unable to resolve" errors during otherwise unrelated frontend work.

**How to apply:** Compare the artifact package declarations with its installed module links, then run the filtered workspace install for `@workspace/grace-social` and restart the managed Expo workflow before further debugging.