---
name: Grace Social SDK 57 compatibility
description: Notes about the Expo SDK 57 and React Native 0.86 upgrade boundary.
---

Expo SDK 57 uses the nested `NativeTabs.Trigger.Icon` and `NativeTabs.Trigger.Label` APIs, and React Native 0.86 types `StyleSheet.absoluteFill` instead of the removed `absoluteFillObject` alias.

**Why:** The upgrade can appear installed in the manifest and lockfile while the workspace still has the previous SDK linked, and the version change exposes these API/type differences.

**How to apply:** Reinstall the locked workspace dependencies after an upgrade, run the app typecheck, and update native-tab and fill-style call sites before diagnosing unrelated runtime warnings.