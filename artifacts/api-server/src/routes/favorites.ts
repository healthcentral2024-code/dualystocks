import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { and, eq } from "drizzle-orm";
import { db, favoritesTable } from "@workspace/db";
import { fetchFinvizRows, buildScreenerStock, type Lang } from "../lib/finviz";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const TICKER_RE = /^[A-Z][A-Z0-9.\-]{0,9}$/;
const MAX_FAVORITES = 30;

// The user's watchlist, enriched with one Finviz batch request (price,
// daily change, score) so they can decide at a glance every day.
router.get("/favorites", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "No autenticado" });
  const lang: Lang = req.query["lang"] === "en" ? "en" : "es";
  try {
    const rows = await db
      .select()
      .from(favoritesTable)
      .where(eq(favoritesTable.userId, userId));
    const tickers = rows.map((r) => r.ticker);
    if (tickers.length === 0) return res.json({ favorites: [] });

    let stocks: ReturnType<typeof buildScreenerStock>[] = [];
    try {
      const finviz = await fetchFinvizRows(tickers);
      stocks = finviz.map((r) => buildScreenerStock(r, lang));
    } catch (err) {
      // Quotes are best-effort: still return the saved list without data.
      logger.error({ err }, "Failed to fetch quotes for favorites");
    }
    const byTicker = new Map(stocks.map((s) => [s.ticker.toUpperCase(), s]));
    return res.json({
      favorites: tickers.map((t) => ({
        ticker: t,
        stock: byTicker.get(t) ?? null,
      })),
    });
  } catch (err) {
    logger.error({ err }, "Failed to list favorites");
    return res.status(500).json({ error: "No se pudieron cargar las favoritas" });
  }
});

router.post("/favorites", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "No autenticado" });
  const ticker = String(req.body?.ticker ?? "").trim().toUpperCase();
  if (!TICKER_RE.test(ticker)) {
    return res.status(400).json({ error: "Ticker inválido" });
  }
  try {
    const existing = await db
      .select()
      .from(favoritesTable)
      .where(eq(favoritesTable.userId, userId));
    if (existing.length >= MAX_FAVORITES && !existing.some((f) => f.ticker === ticker)) {
      return res.status(400).json({ error: `Máximo ${MAX_FAVORITES} favoritas` });
    }
    await db
      .insert(favoritesTable)
      .values({ userId, ticker })
      .onConflictDoNothing();
    return res.json({ ok: true, ticker });
  } catch (err) {
    logger.error({ err }, "Failed to add favorite");
    return res.status(500).json({ error: "No se pudo guardar la favorita" });
  }
});

router.delete("/favorites/:ticker", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "No autenticado" });
  const ticker = String(req.params.ticker ?? "").trim().toUpperCase();
  try {
    await db
      .delete(favoritesTable)
      .where(and(eq(favoritesTable.userId, userId), eq(favoritesTable.ticker, ticker)));
    return res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Failed to remove favorite");
    return res.status(500).json({ error: "No se pudo quitar la favorita" });
  }
});

export default router;
