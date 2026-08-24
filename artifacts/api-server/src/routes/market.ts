import { Router, type IRouter } from "express";
import { GetMarketPulseResponse } from "@workspace/api-zod";
import { buildMarketPulse, type MarketPulse } from "../lib/marketPulse";
import type { Lang } from "../lib/finviz";

const router: IRouter = Router();

// The pulse involves an LLM call, so cache aggressively (per language) and
// dedupe concurrent requests. Degraded (LLM-fallback) results and failures
// are cached with a shorter TTL so we retry soon but never stampede the LLM.
const CACHE_TTL_MS = 30 * 60 * 1000; // full result
const DEGRADED_TTL_MS = 5 * 60 * 1000; // fallback summary, retry sooner
const FAILURE_TTL_MS = 2 * 60 * 1000; // total failure backoff

const cache = new Map<Lang, { until: number; data: MarketPulse }>();
const failedUntil = new Map<Lang, number>();
const inFlight = new Map<Lang, Promise<MarketPulse>>();

async function loadPulse(lang: Lang): Promise<MarketPulse> {
  const now = Date.now();
  const hit = cache.get(lang);
  if (hit && now < hit.until) return hit.data;
  // During the failure backoff window, serve stale data or keep failing fast
  // instead of hammering Finviz/the LLM on every public request.
  if (now < (failedUntil.get(lang) ?? 0)) {
    if (hit) return hit.data;
    throw new Error("market pulse temporarily unavailable");
  }
  const pending = inFlight.get(lang);
  if (pending) return pending;
  const job = buildMarketPulse(lang)
    .then(({ pulse, degraded }) => {
      cache.set(lang, {
        until: Date.now() + (degraded ? DEGRADED_TTL_MS : CACHE_TTL_MS),
        data: pulse,
      });
      return pulse;
    })
    .catch((err) => {
      failedUntil.set(lang, Date.now() + FAILURE_TTL_MS);
      // Serve stale data on upstream hiccups instead of an empty section.
      if (hit) return hit.data;
      throw err;
    })
    .finally(() => {
      inFlight.delete(lang);
    });
  inFlight.set(lang, job);
  return job;
}

router.get("/market/pulse", async (req, res) => {
  const lang: Lang = req.query["lang"] === "en" ? "en" : "es";
  try {
    const pulse = await loadPulse(lang);
    res.json(GetMarketPulseResponse.parse(pulse));
  } catch {
    res.status(502).json({
      error:
        lang === "en"
          ? "Could not load today's market pulse. Try again in a minute."
          : "No se pudo cargar el pulso del mercado. Intenta de nuevo en un minuto.",
    });
  }
});

export default router;
