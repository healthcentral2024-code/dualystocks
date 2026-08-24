---
name: LLM batch item identity
description: Safe association and validation rules for batched AI enrichment of user-visible items.
---

Any batched LLM enrichment of user-visible items must round-trip a stable ID and the exact source text. Map results by ID, verify the source text, and neutral-fallback only the affected item when identity or output validation fails.

**Why:** Structurally valid model JSON can reorder items or attach a plausible classification to the wrong source. Position-only mapping can therefore show incorrect user-facing conclusions without raising an error.

**How to apply:** Include stable IDs and source text in both prompt and response schema. Reject missing, duplicate, mismatched, overlong, or clearly wrong-language results per item, while preserving valid siblings and partitioning localized caches by language.