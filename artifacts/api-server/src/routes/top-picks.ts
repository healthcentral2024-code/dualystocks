import { Router, type IRouter } from "express";
import { GetTopPicksResponse } from "@workspace/api-zod";
import { fetchScreenerRows, buildScreenerStock } from "../lib/finviz";
import { getScreenerEnrichment, mapWithConcurrency } from "../lib/technical";

const router: IRouter = Router();

// The picks refresh in buckets: pre-market and post-open (9:30 ET), plus a
// 30-minute TTL inside each bucket so intraday moves are reflected.
const CACHE_TTL_MS = 30 * 60 * 1000;
const STALE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; data: unknown }>();
const inFlight = new Map<string, Promise<unknown>>();

// Strategy universe: market cap over $500M with meaningful analyst upside
// (the targetprice_a30 filter already guarantees 30%+ upside for every row).
// We rank a bounded pool of the 15 largest qualifying companies — solid,
// liquid names first — because enriching each candidate costs a chart fetch
// and Finviz rate-limits under fan-out.
const FILTERS = "cap_0.5to,targetprice_a30";
const ORDER = "-marketcap";

/** Cache bucket that flips exactly at the 9:30 ET market open. */
function marketBucket(): string {
  const now = new Date();
  const et = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => et.find((p) => p.type === t)?.value ?? "00";
  const minutes = Number(get("hour")) * 60 + Number(get("minute"));
  const open = minutes >= 9 * 60 + 30 ? "open" : "pre";
  return `${get("year")}-${get("month")}-${get("day")}-${open}`;
}

async function loadTopPicks(cacheKey: string, lang: "es" | "en") {
  const rows = await fetchScreenerRows(FILTERS, ORDER, 15);
  const stocks = rows.map((r) => buildScreenerStock(r, lang));
  const extras = await mapWithConcurrency(stocks, 2, (s) =>
    getScreenerEnrichment(s.ticker),
  );
  const enriched = stocks.map((s, i) => ({
    ...s,
    buyScore: extras[i]?.buyScore ?? null,
    strategySignal: extras[i]?.strategySignal ?? null,
  }));
  // Rank: strategy signal first, then technical buy score, then analyst upside.
  enriched.sort((a, b) => {
    const sig = Number(b.strategySignal === true) - Number(a.strategySignal === true);
    if (sig !== 0) return sig;
    const score = (b.buyScore ?? -1) - (a.buyScore ?? -1);
    if (score !== 0) return score;
    return (b.targetUpsidePercent ?? -1) - (a.targetUpsidePercent ?? -1);
  });
  const data = GetTopPicksResponse.parse({
    picks: enriched.slice(0, 3),
    updatedAt: new Date().toISOString(),
  });
  if (enriched.length > 0) {
    cache.set(cacheKey, { at: Date.now(), data });
  }
  return data;
}

router.get("/top-picks", async (req, res) => {
  const lang = req.query["lang"] === "en" ? "en" : "es";
  const cacheKey = `${marketBucket()}-${lang}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    res.json(hit.data);
    return;
  }
  try {
    let pending = inFlight.get(cacheKey);
    if (!pending) {
      pending = loadTopPicks(cacheKey, lang).finally(() =>
        inFlight.delete(cacheKey),
      );
      inFlight.set(cacheKey, pending);
    }
    res.json(await pending);
  } catch (err) {
    req.log.error({ err }, "Top picks fetch failed");
    if (hit && Date.now() - hit.at < STALE_TTL_MS) {
      res.json(hit.data);
      return;
    }
    // Any same-language cached bucket beats an outright failure.
    for (const [key, entry] of cache) {
      if (key.endsWith(`-${lang}`) && Date.now() - entry.at < STALE_TTL_MS) {
        res.json(entry.data);
        return;
      }
    }
    res.status(502).json({
      error:
        lang === "en"
          ? "We couldn't compute today's picks, please try again"
          : "No pudimos calcular las elegidas de hoy, intenta de nuevo",
    });
  }
});

export default router;
