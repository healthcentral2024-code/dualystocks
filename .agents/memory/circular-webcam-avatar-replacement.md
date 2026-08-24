---
name: Circular webcam avatar replacement
description: Reliable compositing rule for replacing a person inside a decorative circular webcam overlay.
---

Replace the complete original webcam crop with a person-free clean plate before adding the new avatar. Do not rely on a smaller inner-circle mask to hide the original person.

**Why:** An inner mask can leave portions of the original person visible around or through the replacement, especially during motion.

**How to apply:** Preserve the decorative frame in the clean plate, cover the full webcam bounding box on every frame, and composite the transparent replacement avatar only after that full replacement.

Preserve the user's original voice by default when replacing the on-screen person; use a synthetic avatar voice only when explicitly requested for that specific output.