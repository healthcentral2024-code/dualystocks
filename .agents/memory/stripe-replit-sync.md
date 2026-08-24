---
name: stripe-replit-sync quirks
description: Non-obvious pitfalls when integrating Stripe via stripe-replit-sync in this monorepo
---

- **Never bundle stripe-replit-sync.** `runMigrations()` resolves `./migrations` SQL files relative to its own `__dirname`; when esbuild bundles it into the api-server dist, migrations silently create only the empty `stripe` schema and later calls fail with `relation "stripe.accounts" does not exist`. Fix: list `stripe-replit-sync` in `external` in `artifacts/api-server/build.mjs`.
- **Replit Stripe connector settings keys are `secret` and `publishable`**, not `secret_key`/`publishable_key` as in the skill template. Read `settings.secret_key ?? settings.secret`.
- **`syncBackfill()` without params can sync nothing** (returned `{}`); calling `syncProducts()` / `syncPrices()` explicitly did sync. Ongoing changes arrive via the managed webhook, so this mainly matters right after seeding products.
