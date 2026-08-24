---
name: Stripe live-mode on Replit
description: How the Replit Stripe connection exposes sandbox+live credentials and how live data reaches the synced stripe.* tables.
---

- The Replit Stripe connection API can return TWO settings items: sandbox (`sk_test_`) and live (`sk_live_`). The key field name varies per item (`secret_key` vs `secret`) — always check both.
- **Why:** item order is not an environment contract. `stripeClient.ts` now selects strictly by prefix (deployment → `sk_live_`, workspace → `sk_test_`) and throws if missing; never reintroduce an `items[0]` fallback.
- Production `syncBackfill()` at deploy startup did NOT populate `stripe.products/prices` with pre-existing live objects. **How to apply:** touch the objects (e.g. `products.update` with metadata) from a workspace temp script using the live key — the resulting webhooks make stripe-sync insert them within seconds.
- Live product: "DualyStocks Premium" ($15/mo + $120/yr). Managed live webhook points at trade-sage-stocks.replit.app/api/stripe/webhook.
