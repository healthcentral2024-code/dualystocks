# DualyStocks

App en español que simplifica el análisis de acciones usando datos de Finviz: el usuario ingresa un ticker y recibe un puntaje 0-100 con veredictos en lenguaje simple para decidir dónde invertir a corto y mediano plazo.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- Frontend: `artifacts/tradesage/` (rutas: `/` búsqueda + recientes, `/analisis/:ticker`)
- Finviz client + motor de puntajes: `artifacts/api-server/src/lib/finviz.ts`
- Rutas API: `artifacts/api-server/src/routes/analysis.ts` (`GET /api/analysis/:ticker`, `GET /api/recent`)
- Contrato API: `lib/api-spec/openapi.yaml`; DB schema: `lib/db/src/schema/analyses.ts`
- Secret requerido: `FINVIZ_API_KEY` (token export de Finviz Elite)

## Architecture decisions

- Datos vía Finviz Elite CSV export (`elite.finviz.com/export.ashx`, seguir redirects 301) — no scraping HTML.
- Los análisis se cachean 15 min en la tabla `analyses` (upsert por ticker); `/api/recent` lee de ahí.
- Puntajes: 6 categorías (valoración, crecimiento, rentabilidad, salud, momentum, sentimiento) con escalas lineales y promedio ponderado orientado a corto/mediano plazo.
- Nota codegen: usar `type: number` (no `integer`) en el spec — orval genera `zod.int()` que no existe en zod 3.

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
