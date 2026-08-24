import { Router, type IRouter } from "express";
import { GetScreenerQueryParams, GetScreenerResponse } from "@workspace/api-zod";
import {
  SCREENER_PRESETS,
  fetchScreenerRows,
  buildScreenerStock,
  localizePreset,
} from "../lib/finviz";
import { getScreenerEnrichment, mapWithConcurrency } from "../lib/technical";

const router: IRouter = Router();

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const STALE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; data: unknown }>();
const inFlight = new Map<string, Promise<unknown>>();

// Maps of optional query params to Finviz filter codes (all verified against the export endpoint)
const INDEX_FILTERS: Record<string, string> = {
  sp500: "idx_sp500",
  nasdaq100: "idx_ndx",
  dowjones: "idx_dji",
};
const EXCHANGE_FILTERS: Record<string, string> = {
  nyse: "exch_nyse",
  nasdaq: "exch_nasd",
  amex: "exch_amex",
};
const CAP_FILTERS: Record<string, string> = {
  under500: "cap_0to0.5",
  from500to1000: "cap_0.5to1",
  // Elite custom-range codes; cap_o0.5/cap_o1 are silently ignored by export.ashx
  over500: "cap_0.5to",
  over1000: "cap_1to",
};
const RECOM_FILTERS: Record<string, string> = {
  strongbuy: "an_recom_strongbuy",
  buybetter: "an_recom_buybetter",
  holdbetter: "an_recom_holdbetter",
  holdworse: "an_recom_holdworse",
};
const INSIDER_FILTERS: Record<string, string> = {
  compras: "sh_insidertrans_pos",
  ventas: "sh_insidertrans_neg",
};
// Verified live: sh_insiderown_o30 narrows cap_o0.5 from ~11.5k to ~1.5k rows.
const INSIDER_OWN_FILTERS: Record<string, string> = {
  over30: "sh_insiderown_o30",
};
const PRICE_FILTERS: Record<string, string> = {
  o50: "sh_price_o50",
  o100: "sh_price_o100",
  // Finviz has no built-in "over $150" code; use the Elite custom-range syntax
  o150: "sh_price_150to",
};
const COUNTRY_FILTERS: Record<string, string> = {
  usa: "geo_usa",
  notusa: "geo_notusa",
  europe: "geo_europe",
  china: "geo_china",
  canada: "geo_canada",
  japan: "geo_japan",
};
const TARGET_FILTERS: Record<string, string> = {
  a5: "targetprice_a5",
  a10: "targetprice_a10",
  a20: "targetprice_a20",
  a30: "targetprice_a30",
  a50: "targetprice_a50",
};

type Params = ReturnType<typeof GetScreenerQueryParams.parse>;

export function buildFilters(params: Params): string {
  const preset = SCREENER_PRESETS[params.preset]!;
  const parts = [preset.filters];
  // Query params override the preset's built-in filter of the same family,
  // so presets that bundle cap/geo/target filters stay fully editable.
  // The explicit value "all" removes the family constraint without a replacement.
  const override = (prefix: string, code: string | undefined) => {
    parts[0] = parts[0]!
      .split(",")
      .filter((f) => !f.startsWith(prefix))
      .join(",");
    if (code) parts.push(code);
  };
  if (params.index) parts.push(INDEX_FILTERS[params.index]!);
  if (params.exchange) parts.push(EXCHANGE_FILTERS[params.exchange]!);
  if (params.cap) override("cap_", CAP_FILTERS[params.cap]);
  if (params.price) parts.push(PRICE_FILTERS[params.price]!);
  if (params.country) override("geo_", COUNTRY_FILTERS[params.country]);
  if (params.recom) parts.push(RECOM_FILTERS[params.recom]!);
  if (params.insider) parts.push(INSIDER_FILTERS[params.insider]!);
  if (params.insiderOwn) parts.push(INSIDER_OWN_FILTERS[params.insiderOwn]!);
  if (params.targetUpside)
    override("targetprice_", TARGET_FILTERS[params.targetUpside]);
  // Optionable = the stock has listed options contracts (Finviz sh_opt_option)
  if (params.optionable === "yes") parts.push("sh_opt_option");
  return parts.filter(Boolean).join(",");
}

async function loadScreener(cacheKey: string, params: Params): Promise<unknown> {
  const lang = params.lang ?? "es";
  const preset = SCREENER_PRESETS[params.preset]!;
  const localized = localizePreset(preset, lang);
  const rows = await fetchScreenerRows(buildFilters(params), preset.order, 15);
  const stocks = rows.map((r) => buildScreenerStock(r, lang));
  // Enrich with a technical buy score from each stock's chart (best-effort),
  // then rank the list by it so the strongest technical setups come first.
  const extras = await mapWithConcurrency(stocks, 2, (s) =>
    getScreenerEnrichment(s.ticker),
  );
  const enriched = stocks
    .map((s, i) => ({
      ...s,
      buyScore: extras[i]?.buyScore ?? null,
      strategySignal: extras[i]?.strategySignal ?? null,
    }))
    .sort((a, b) => (b.buyScore ?? -1) - (a.buyScore ?? -1));
  const data = GetScreenerResponse.parse({
    preset: localized.preset,
    label: localized.label,
    description: localized.description,
    criteria: localized.criteria,
    stocks: enriched,
  });
  // Only cache non-empty results: an empty list can be caused by a transient
  // Finviz failure (rate limit / hiccup), and caching it would show the user
  // "no results" for 30 minutes even though the filter combination has matches.
  if (enriched.length > 0) {
    cache.set(cacheKey, { at: Date.now(), data });
  }
  return data;
}

router.get("/screener", async (req, res) => {
  // Best-effort read of lang even when the rest of the params fail validation.
  const langHint = req.query["lang"] === "en" ? "en" : "es";
  const parsed = GetScreenerQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(404).json({
      error: langHint === "en" ? "Invalid filters" : "Filtros inválidos",
    });
    return;
  }
  const params = parsed.data;
  const lang = params.lang ?? "es";
  const cacheKey = JSON.stringify(params);

  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    res.json(hit.data);
    return;
  }

  try {
    let pending = inFlight.get(cacheKey);
    if (!pending) {
      pending = loadScreener(cacheKey, params).finally(() =>
        inFlight.delete(cacheKey),
      );
      inFlight.set(cacheKey, pending);
    }
    res.json(await pending);
  } catch (err) {
    req.log.error({ err, params }, "Screener fetch failed");
    // Serve stale cache rather than failing outright
    if (hit && Date.now() - hit.at < STALE_TTL_MS) {
      res.json(hit.data);
      return;
    }
    res.status(500).json({
      error:
        lang === "en"
          ? "We couldn't fetch the ideas, please try again"
          : "No pudimos obtener las ideas, intenta de nuevo",
    });
  }
});

export default router;
