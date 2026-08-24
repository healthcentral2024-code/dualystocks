---
name: OpenAPI/orval gotchas
description: Spec pitfalls that break the generated zod client in this monorepo
---

- Use `type: number`, never `integer` — orval emits `zod.int()` which doesn't exist in zod 3.
- **Why:** codegen output fails typecheck project-wide when `integer` is used anywhere in the spec.
- **How to apply:** when editing lib/api-spec/openapi.yaml, all numeric fields use `number`; nullable numerics use `type: ["number", "null"]`.
- lightweight-charts v5: series are created with `chart.addSeries(CandlestickSeries|LineSeries|HistogramSeries, opts)` — the old `addCandlestickSeries()` methods no longer exist.
