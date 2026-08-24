import { Router, type IRouter } from "express";
import {
  GetChartAnalysisResponse,
  GetTrendAnalysisResponse,
  GetAnalysisQueryParams,
  GetChartAnalysisQueryParams,
  GetTrendAnalysisQueryParams,
} from "@workspace/api-zod";
import { fetchHistory, buildTechnicalReading, buildTrendAnalysis, computeSwingStats, computeMacd, type MacdReading } from "../lib/technical";
import { eq, desc } from "drizzle-orm";
import { db, analysesTable } from "@workspace/db";
import {
  GetAnalysisResponse,
  GetRecentAnalysesResponse,
} from "@workspace/api-zod";
import {
  fetchFinvizRow,
  buildAnalysis,
  parseNextEarningsDate,
  type Lang,
} from "../lib/finviz";
import { getRecentStockNews } from "../lib/news";
import { resolveStockTicker } from "../lib/stock-resolver";
import { getLastEarningsDate } from "../lib/sec-earnings";

const router: IRouter = Router();

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Localized user-facing error messages (routes replace internal errors).
function stockNotFoundError(lang: Lang): string {
  return lang === "en"
    ? "We couldn't find that stock. Try its ticker or company name."
    : "No encontramos esa acción. Prueba con su ticker o el nombre de la empresa.";
}

async function resolveRequestTicker(rawValue: unknown): Promise<string | null> {
  const raw = String(rawValue ?? "").trim();
  return resolveStockTicker(raw);
}

router.get("/analysis/:ticker", async (req, res) => {
  const lang: Lang = GetAnalysisQueryParams.parse(req.query).lang ?? "es";

  try {
    const ticker = await resolveRequestTicker(req.params["ticker"]);
    if (!ticker) {
      res.status(404).json({ error: stockNotFoundError(lang) });
      return;
    }
    // The Postgres cache stores only Spanish payloads (keyed by ticker).
    // For English we always build fresh so we never mix languages in one row.
    if (lang === "es") {
      const cached = await db
        .select()
        .from(analysesTable)
        .where(eq(analysesTable.ticker, ticker))
        .limit(1);
      const hit = cached[0];
      if (hit && Date.now() - hit.analyzedAt.getTime() < CACHE_TTL_MS) {
        const cachedPayload = GetAnalysisResponse.safeParse(hit.payload);
        if (cachedPayload.success) {
          const cachedData = cachedPayload.data;
          const recentNewsPromise = getRecentStockNews(ticker, lang);
          const lastEarningsDatePromise = cachedData.lastEarningsDate
            ? Promise.resolve(cachedData.lastEarningsDate)
            : getLastEarningsDate(ticker).catch((err: unknown) => {
                req.log.warn({ err, ticker }, "Could not refresh cached last earnings date");
                return null;
              });
          const nextEarningsDatePromise = cachedData.nextEarningsDate
            ? Promise.resolve(cachedData.nextEarningsDate)
            : fetchFinvizRow(ticker)
                .then((row) => parseNextEarningsDate(row?.["Earnings Date"] ?? null))
                .catch((err: unknown) => {
                  req.log.warn({ err, ticker }, "Could not refresh cached next earnings date");
                  return null;
                });

          const [recentNews, lastEarningsDate, nextEarningsDate] = await Promise.all([
            recentNewsPromise,
            lastEarningsDatePromise,
            nextEarningsDatePromise,
          ]);
          const refreshedPayload = GetAnalysisResponse.parse({
            ...cachedData,
            recentNews,
            lastEarningsDate,
            nextEarningsDate,
          });

          if (
            cachedData.lastEarningsDate !== lastEarningsDate ||
            cachedData.nextEarningsDate !== nextEarningsDate ||
            JSON.stringify(cachedData.recentNews) !== JSON.stringify(recentNews)
          ) {
            await db
              .update(analysesTable)
              .set({ payload: refreshedPayload })
              .where(eq(analysesTable.ticker, ticker));
          }

          res.json(refreshedPayload);
          return;
        }
      }
    }

    const row = await fetchFinvizRow(ticker);
    if (!row) {
      res.status(404).json({
        error:
          lang === "en"
            ? `We couldn't find the ticker "${ticker}" on Finviz`
            : `No encontramos el ticker "${ticker}" en Finviz`,
      });
      return;
    }

    // MACD needs price history; if it fails we still deliver the analysis.
    // Recent stock news runs in parallel and fails softly with an empty list.
    const newsPromise = getRecentStockNews(ticker, lang);
    const lastEarningsDatePromise = getLastEarningsDate(ticker).catch((err: unknown) => {
      req.log.warn({ err, ticker }, "Could not fetch last earnings date");
      return null;
    });
    let macd: MacdReading | null = null;
    try {
      const candles = await fetchHistory(ticker);
      macd = computeMacd(candles.map((c) => c.close));
    } catch (err) {
      req.log.warn({ err, ticker }, "Could not compute MACD for analysis");
    }
    const [recentNews, lastEarningsDate] = await Promise.all([
      newsPromise,
      lastEarningsDatePromise,
    ]);

    const analysis = {
      ...buildAnalysis(row, lang, macd, lastEarningsDate),
      recentNews,
    };
    const payload = GetAnalysisResponse.parse(analysis);

    // Only persist Spanish payloads; English is always fresh.
    if (lang === "es") {
      await db
        .insert(analysesTable)
        .values({
          ticker,
          companyName: analysis.companyName,
          overallScore: analysis.overallScore,
          overallVerdict: analysis.overallVerdict,
          price: analysis.price,
          changePercent: analysis.changePercent,
          payload,
          analyzedAt: new Date(analysis.analyzedAt),
        })
        .onConflictDoUpdate({
          target: analysesTable.ticker,
          set: {
            companyName: analysis.companyName,
            overallScore: analysis.overallScore,
            overallVerdict: analysis.overallVerdict,
            price: analysis.price,
            changePercent: analysis.changePercent,
            payload,
            analyzedAt: new Date(analysis.analyzedAt),
          },
        });
    }

    res.json(payload);
  } catch (err) {
    req.log.error({ err }, "Failed to analyze stock");
    res.status(500).json({
      error:
        lang === "en"
          ? "We couldn't fetch the data, please try again"
          : "No pudimos obtener los datos, intenta de nuevo",
    });
  }
});

router.get("/analysis/:ticker/chart", async (req, res) => {
  const lang: Lang = GetChartAnalysisQueryParams.parse(req.query).lang ?? "es";

  try {
    const ticker = await resolveRequestTicker(req.params["ticker"]);
    if (!ticker) {
      res.status(404).json({ error: stockNotFoundError(lang) });
      return;
    }
    const candles = await fetchHistory(ticker);
    if (candles.length < 30) {
      res.status(404).json({
        error:
          lang === "en"
            ? `Not enough price history for "${ticker}"`
            : `No hay historial de precios suficiente para "${ticker}"`,
      });
      return;
    }
    // Cap to last ~5 years of daily candles
    const trimmed = candles.slice(-1260);
    const technical = buildTechnicalReading(candles, lang);
    const swing = computeSwingStats(candles);
    res.json(
      GetChartAnalysisResponse.parse({
        ticker,
        candles: trimmed,
        technical,
        ...(swing ? { swing } : {}),
      }),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to build stock chart analysis");
    res.status(500).json({
      error:
        lang === "en"
          ? "We couldn't fetch the chart, please try again"
          : "No pudimos obtener el gráfico, intenta de nuevo",
    });
  }
});

router.get("/analysis/:ticker/trend", async (req, res) => {
  const lang: Lang = GetTrendAnalysisQueryParams.parse(req.query).lang ?? "es";
  try {
    const ticker = await resolveRequestTicker(req.params["ticker"]);
    if (!ticker) {
      res.status(404).json({ error: stockNotFoundError(lang) });
      return;
    }
    const analysis = await buildTrendAnalysis(ticker, lang);
    if (!analysis.price) {
      res.status(404).json({
        error:
          lang === "en"
            ? `Not enough price history for "${ticker}"`
            : `No hay historial de precios suficiente para "${ticker}"`,
      });
      return;
    }
    res.json(GetTrendAnalysisResponse.parse(analysis));
  } catch (err) {
    req.log.error({ err }, "Failed to build stock trend analysis");
    res.status(500).json({
      error:
        lang === "en"
          ? "We couldn't analyze the trend, please try again"
          : "No pudimos analizar la tendencia, intenta de nuevo",
    });
  }
});

router.get("/recent", async (req, res) => {
  try {
    const rows = await db
      .select({
        ticker: analysesTable.ticker,
        companyName: analysesTable.companyName,
        overallScore: analysesTable.overallScore,
        overallVerdict: analysesTable.overallVerdict,
        price: analysesTable.price,
        changePercent: analysesTable.changePercent,
        analyzedAt: analysesTable.analyzedAt,
      })
      .from(analysesTable)
      .orderBy(desc(analysesTable.analyzedAt))
      .limit(12);

    res.json(
      GetRecentAnalysesResponse.parse(
        rows.map((r) => ({ ...r, analyzedAt: r.analyzedAt.toISOString() })),
      ),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list recent analyses");
    res.status(500).json({ error: "Error al cargar los análisis recientes" });
  }
});

export default router;
