---
name: Language changes without remount
description: Keep localized Clerk UI and protected app routes stable across language changes.
---

Update the Clerk provider's localization prop in place. Do not key or otherwise remount the provider when the language changes.

**Why:** Remounting Clerk destroys all protected descendants, resets subscription checks, and can leave the page showing only its background even while authentication remains valid. It also discards ordinary React state.

**How to apply:** Pass the selected localization as a normal provider prop and test ES/EN switches from authenticated, subscription-protected routes. Persist only state that must survive an actual navigation or reload.