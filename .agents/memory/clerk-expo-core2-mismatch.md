---
name: Clerk Expo Core 2 mismatch
description: Why Clerk Expo 2.x can fail at runtime in Expo SDK 54 web previews and which version line avoids it.
---

For Expo SDK 54 projects, prefer `@clerk/expo` 3.x rather than the 2.x line.

**Why:** A Core 2 install can resolve `@clerk/react` and `@clerk/shared` versions that typecheck but fail at runtime because React calls a Clerk UI script loader that the resolved shared package does not export. Upgrading to Core 3 removed the transient runtime error.

**How to apply:** If an Expo web preview reports a missing Clerk script-loader function while auth otherwise initializes, inspect the resolved Clerk package graph before changing app logic. Upgrade the direct Expo SDK package and re-run the mobile flow.