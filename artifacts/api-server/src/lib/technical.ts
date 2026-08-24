// Technical (chart) analysis from Finviz Elite historical data.

import type { Lang } from "./finviz";

// Pick the string for the requested language (Spanish default).
function t(lang: Lang, es: string, en: string): string {
  return lang === "en" ? en : es;
}

export interface Candle {
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalReading {
  buyScore: number;
  verdict: string;
  bullets: string[];
  trend: "alcista" | "bajista" | "lateral";
  rsi: number | null;
  supportLevel: number | null;
  resistanceLevel: number | null;
  sma50: number | null;
  sma200: number | null;
}

const HISTORY_URL = "https://elite.finviz.com/quote_export.ashx";
const HISTORY_TTL_MS = 60 * 60 * 1000; // 1 hour

const HISTORY_CACHE_MAX = 500;
const FAILURE_TTL_MS = 10 * 60 * 1000; // negative cache: don't re-hit Finviz on failures

const historyCache = new Map<string, { at: number; candles: Candle[] }>();
const historyInFlight = new Map<string, Promise<Candle[]>>();
const historyFailures = new Map<string, number>();

export type Timeframe = "m" | "w" | "d" | "h";

async function fetchHistoryRaw(ticker: string, frame: Timeframe = "d"): Promise<Candle[]> {
  const auth = process.env["FINVIZ_API_KEY"];
  if (!auth) throw new Error("FINVIZ_API_KEY is not configured");
  const url = `${HISTORY_URL}?t=${encodeURIComponent(ticker)}&p=${frame}&auth=${encodeURIComponent(auth)}`;
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
  if (res.status === 429) {
    const err = new Error("Finviz history respondió 429 (límite de peticiones)");
    (err as { rateLimited?: boolean }).rateLimited = true;
    throw err;
  }
  if (!res.ok) throw new Error(`Finviz history respondió ${res.status}`);
  const text = (await res.text()).replace(/^\uFEFF/, "").trim();
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2 || !lines[0]!.startsWith("Date")) {
    throw new Error(
      `Finviz history devolvió una respuesta inesperada: ${text.slice(0, 120)}`,
    );
  }
  const candles: Candle[] = [];
  for (const line of lines.slice(1)) {
    const [date, open, high, low, close, volume] = line.split(",");
    if (!date) continue;
    // Hourly rows look like "10/24/2025 09:30 AM" — keep the time for ordering
    const [datePart, ...timeParts] = date.split(" ");
    const [mm, dd, yyyy] = datePart!.split("/");
    if (!mm || !dd || !yyyy) continue;
    let suffix = "";
    if (timeParts.length >= 2) {
      const [hhmm, ampm] = timeParts;
      const [hh, min] = hhmm!.split(":");
      if (hh && min) {
        let h24 = Number(hh) % 12;
        if (ampm === "PM") h24 += 12;
        suffix = ` ${String(h24).padStart(2, "0")}:${min}`;
      }
    }
    const o = Number(open);
    const h = Number(high);
    const l = Number(low);
    const c = Number(close);
    const v = Number(volume);
    if ([o, h, l, c, v].some((n) => !Number.isFinite(n))) continue;
    candles.push({
      date: `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}${suffix}`,
      open: o,
      high: h,
      low: l,
      close: c,
      volume: v,
    });
  }
  candles.sort((a, b) => (a.date < b.date ? -1 : 1));
  return candles;
}

export async function fetchHistory(ticker: string, frame: Timeframe = "d"): Promise<Candle[]> {
  const key = `${ticker.toUpperCase()}:${frame}`;
  const hit = historyCache.get(key);
  if (hit && Date.now() - hit.at < HISTORY_TTL_MS) return hit.candles;
  const failedAt = historyFailures.get(key);
  if (failedAt && Date.now() - failedAt < FAILURE_TTL_MS) {
    throw new Error(`Historial de "${key}" no disponible (reintento en pausa)`);
  }
  let pending = historyInFlight.get(key);
  if (!pending) {
    pending = fetchHistoryRaw(ticker.toUpperCase(), frame)
      .then((candles) => {
        historyFailures.delete(key);
        // Bounded cache: evict oldest entries beyond the cap
        if (historyCache.size >= HISTORY_CACHE_MAX) {
          const oldest = historyCache.keys().next().value;
          if (oldest !== undefined) historyCache.delete(oldest);
        }
        historyCache.set(key, { at: Date.now(), candles });
        return candles;
      })
      .catch((err: { rateLimited?: boolean }) => {
        // Rate limits are transient: retry sooner than hard failures.
        const penalty = err?.rateLimited
          ? FAILURE_TTL_MS - 60 * 1000 // effective 1-minute backoff
          : 0;
        historyFailures.set(key, Date.now() - penalty);
        throw err;
      })
      .finally(() => historyInFlight.delete(key));
    historyInFlight.set(key, pending);
  }
  return pending;
}

/** Run tasks with bounded concurrency, preserving order of results. */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i]!);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

function sma(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

export interface MacdReading {
  macd: number;
  signal: number;
  histogram: number;
  prevHistogram: number | null;
}

// MACD (12/26/9) from daily closes, with standard SMA-seeded EMAs.
// Returns null when there's not enough history for a stable reading.
export function computeMacd(closes: number[]): MacdReading | null {
  if (closes.length < 60) return null;
  // EMA seeded with the SMA of the first `period` values (standard init).
  const ema = (period: number): number[] => {
    const k = 2 / (period + 1);
    const out: number[] = new Array(closes.length).fill(NaN);
    let seed = 0;
    for (let i = 0; i < period; i++) seed += closes[i]!;
    let prev = seed / period;
    out[period - 1] = prev;
    for (let i = period; i < closes.length; i++) {
      prev = closes[i]! * k + prev * (1 - k);
      out[i] = prev;
    }
    return out;
  };
  const e12 = ema(12);
  const e26 = ema(26);
  const macdLine: number[] = [];
  for (let i = 25; i < closes.length; i++) macdLine.push(e12[i]! - e26[i]!);
  // Signal: 9-period EMA of the MACD line, seeded with the SMA of its first 9 values.
  const k9 = 2 / 10;
  let sig = macdLine.slice(0, 9).reduce((a, b) => a + b, 0) / 9;
  const signalLine: number[] = new Array(macdLine.length).fill(NaN);
  signalLine[8] = sig;
  for (let i = 9; i < macdLine.length; i++) {
    sig = macdLine[i]! * k9 + sig * (1 - k9);
    signalLine[i] = sig;
  }
  const last = macdLine.length - 1;
  const macd = macdLine[last]!;
  const signal = signalLine[last]!;
  return {
    macd,
    signal,
    histogram: macd - signal,
    prevHistogram: last > 0 ? macdLine[last - 1]! - signalLine[last - 1]! : null,
  };
}

function rsi14(closes: number[]): number | null {
  const period = 14;
  if (closes.length < period + 1) return null;
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i]! - closes[i - 1]!;
    if (diff > 0) avgGain += diff;
    else avgLoss -= diff;
  }
  avgGain /= period;
  avgLoss /= period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i]! - closes[i - 1]!;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export interface SwingStats {
  avgDailyMove: number;
  avgWeeklyMove: number;
  avgMonthlyMove: number;
  avgUpMove: number;
  avgUpDays: number;
  avgDownMove: number;
  avgDownDays: number;
  sampleDays: number;
}

/**
 * Average dollar swing behavior from recent daily candles.
 * Groups consecutive up days / down days (close-to-close) into swings and
 * averages the total dollars moved and the length of each swing.
 */
export function computeSwingStats(candles: Candle[]): SwingStats | null {
  // Use roughly the last year of trading days
  const recent = candles.slice(-252);
  if (recent.length < 30) return null;

  // Typical move over N trading days: average absolute close-to-close change
  // across rolling windows (1 = day, 5 = ~week, 21 = ~month).
  const avgWindowMove = (win: number): number | null => {
    let sum = 0;
    let count = 0;
    for (let i = win; i < recent.length; i++) {
      sum += Math.abs(recent[i]!.close - recent[i - win]!.close);
      count++;
    }
    return count > 0 ? sum / count : null;
  };
  const dailyMove = avgWindowMove(1);
  const weeklyMove = avgWindowMove(5);
  const monthlyMove = avgWindowMove(21);

  const upSwings: { move: number; days: number }[] = [];
  const downSwings: { move: number; days: number }[] = [];

  let dir: 1 | -1 | 0 = 0;
  let swingMove = 0;
  let swingDays = 0;

  const flush = () => {
    if (swingDays === 0) return;
    if (dir === 1) upSwings.push({ move: swingMove, days: swingDays });
    else if (dir === -1) downSwings.push({ move: swingMove, days: swingDays });
    swingMove = 0;
    swingDays = 0;
  };

  for (let i = 1; i < recent.length; i++) {
    const change = recent[i]!.close - recent[i - 1]!.close;
    const d: 1 | -1 | 0 = change > 0 ? 1 : change < 0 ? -1 : 0;
    if (d === 0) {
      // Flat day ends the current swing
      flush();
      dir = 0;
      continue;
    }
    if (d !== dir) {
      flush();
      dir = d;
    }
    swingMove += Math.abs(change);
    swingDays++;
  }
  flush();

  if (
    dailyMove == null ||
    weeklyMove == null ||
    monthlyMove == null ||
    upSwings.length === 0 ||
    downSwings.length === 0
  ) {
    return null;
  }

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const round1 = (n: number) => Math.round(n * 10) / 10;

  return {
    avgDailyMove: round2(dailyMove),
    avgWeeklyMove: round2(weeklyMove),
    avgMonthlyMove: round2(monthlyMove),
    avgUpMove: round2(avg(upSwings.map((s) => s.move))),
    avgUpDays: round1(avg(upSwings.map((s) => s.days))),
    avgDownMove: round2(avg(downSwings.map((s) => s.move))),
    avgDownDays: round1(avg(downSwings.map((s) => s.days))),
    sampleDays: recent.length,
  };
}

export function buildTechnicalReading(candles: Candle[], lang: Lang = "es"): TechnicalReading {
  const closes = candles.map((c) => c.close);
  const price = closes[closes.length - 1] ?? 0;
  const s50 = sma(closes, 50);
  const s200 = sma(closes, 200);
  const rsi = rsi14(closes.slice(-120));

  const recent = candles.slice(-60);
  const supportLevel = recent.length
    ? Math.min(...recent.map((c) => c.low))
    : null;
  const resistanceLevel = recent.length
    ? Math.max(...recent.map((c) => c.high))
    : null;

  const year = candles.slice(-252);
  const high52 = year.length ? Math.max(...year.map((c) => c.high)) : null;
  const low52 = year.length ? Math.min(...year.map((c) => c.low)) : null;

  // Trend: price vs long-term average plus 50-day slope
  const closes20ago = closes.length > 20 ? closes[closes.length - 21]! : null;
  const slopeUp = closes20ago !== null && price > closes20ago;
  let trend: TechnicalReading["trend"] = "lateral";
  if (s200 !== null) {
    if (price > s200 * 1.02 && slopeUp) trend = "alcista";
    else if (price < s200 * 0.98 && !slopeUp) trend = "bajista";
  }

  let score = 50;
  const bullets: string[] = [];

  if (s200 !== null) {
    if (price > s200) {
      score += 12;
      bullets.push(
        t(lang,
          `El precio está por encima de su promedio de 200 días ($${s200.toFixed(2)}): la tendencia de fondo es sana.`,
          `The price is above its 200-day average ($${s200.toFixed(2)}): the underlying trend is healthy.`),
      );
    } else {
      score -= 12;
      bullets.push(
        t(lang,
          `El precio está por debajo de su promedio de 200 días ($${s200.toFixed(2)}): la tendencia de fondo aún es débil.`,
          `The price is below its 200-day average ($${s200.toFixed(2)}): the underlying trend is still weak.`),
      );
    }
  }

  if (s50 !== null && s200 !== null) {
    if (s50 > s200) {
      score += 8;
      bullets.push(
        t(lang,
          "El promedio de 50 días va por encima del de 200 (señal alcista de mediano plazo).",
          "The 50-day average is above the 200-day (a bullish medium-term signal)."),
      );
    } else {
      score -= 5;
    }
  }

  if (rsi !== null) {
    if (rsi < 30) {
      score += 12;
      bullets.push(
        t(lang,
          `RSI en ${rsi.toFixed(0)}: sobrevendida — el pesimismo puede ser una oportunidad de entrada.`,
          `RSI at ${rsi.toFixed(0)}: oversold — the pessimism may be an entry opportunity.`),
      );
    } else if (rsi < 50) {
      score += 8;
      bullets.push(
        t(lang,
          `RSI en ${rsi.toFixed(0)}: sin euforia — buen punto para comprar sin pagar caro.`,
          `RSI at ${rsi.toFixed(0)}: no euphoria — a good spot to buy without overpaying.`),
      );
    } else if (rsi <= 70) {
      score += 2;
      bullets.push(t(lang, `RSI en ${rsi.toFixed(0)}: zona neutral-alta.`, `RSI at ${rsi.toFixed(0)}: neutral-to-high zone.`));
    } else {
      score -= 12;
      bullets.push(
        t(lang,
          `RSI en ${rsi.toFixed(0)}: sobrecomprada — mejor esperar un retroceso.`,
          `RSI at ${rsi.toFixed(0)}: overbought — better to wait for a pullback.`),
      );
    }
  }

  if (high52 !== null && high52 > 0) {
    const offHigh = ((high52 - price) / high52) * 100;
    if (offHigh >= 10 && offHigh <= 35 && trend !== "bajista") {
      score += 10;
      bullets.push(
        t(lang,
          `Cotiza ${offHigh.toFixed(0)}% por debajo de su máximo de 52 semanas: hay descuento sin ser una caída libre.`,
          `Trades ${offHigh.toFixed(0)}% below its 52-week high: there's a discount without being a free fall.`),
      );
    } else if (offHigh < 3) {
      score -= 4;
      bullets.push(
        t(lang,
          "Está pegada a su máximo de 52 semanas: no hay descuento en el precio.",
          "It's right at its 52-week high: there's no discount in the price."),
      );
    } else if (offHigh > 45) {
      score -= 8;
      bullets.push(
        t(lang,
          `Cayó ${offHigh.toFixed(0)}% desde su máximo de 52 semanas: la caída es profunda, conviene prudencia.`,
          `Down ${offHigh.toFixed(0)}% from its 52-week high: the drop is deep, caution is warranted.`),
      );
    }
  }

  if (supportLevel !== null && price > 0) {
    const overSupport = ((price - supportLevel) / price) * 100;
    if (overSupport <= 8) {
      score += 8;
      bullets.push(
        t(lang,
          `El precio está cerca de su zona de soporte ($${supportLevel.toFixed(2)}): riesgo de caída adicional más acotado.`,
          `The price is near its support zone ($${supportLevel.toFixed(2)}): the risk of a further drop is more contained.`),
      );
    }
  }
  if (resistanceLevel !== null && price > 0) {
    const toResistance = ((resistanceLevel - price) / price) * 100;
    if (toResistance >= 10) {
      score += 5;
      bullets.push(
        t(lang,
          `Tiene ${toResistance.toFixed(0)}% de recorrido hasta su resistencia ($${resistanceLevel.toFixed(2)}).`,
          `It has ${toResistance.toFixed(0)}% of room to run to its resistance ($${resistanceLevel.toFixed(2)}).`),
      );
    }
  }
  if (low52 !== null && price > 0 && trend === "bajista") {
    score -= 5;
  }

  const buyScore = Math.max(0, Math.min(100, Math.round(score)));
  let verdict: string;
  if (buyScore >= 70) verdict = t(lang, "El gráfico acompaña: buen momento técnico para comprar", "The chart is supportive: a good technical moment to buy");
  else if (buyScore >= 55) verdict = t(lang, "Momento técnico razonable, con señales mixtas a favor", "Reasonable technical moment, with mixed signals in its favor");
  else if (buyScore >= 40) verdict = t(lang, "Señales mixtas: si te interesa, entra por partes", "Mixed signals: if you're interested, buy in stages");
  else verdict = t(lang, "El gráfico no acompaña: mejor esperar una señal de giro", "The chart isn't supportive: better to wait for a turnaround signal");

  return {
    buyScore,
    verdict,
    bullets,
    trend,
    rsi: rsi !== null ? Math.round(rsi * 10) / 10 : null,
    supportLevel,
    resistanceLevel,
    sma50: s50 !== null ? Math.round(s50 * 100) / 100 : null,
    sma200: s200 !== null ? Math.round(s200 * 100) / 100 : null,
  };
}

/** Best-effort buy score for screener enrichment; null on failure. */
export async function getBuyScore(ticker: string): Promise<number | null> {
  try {
    const candles = await fetchHistory(ticker);
    if (candles.length < 60) return null;
    return buildTechnicalReading(candles).buyScore;
  } catch {
    return null;
  }
}

/**
 * Strategy signal from the daily chart only: bearish daily trend AND the last
 * day's low more than 20% below the daily SMA20. Mirrors the signal in
 * buildTrendAnalysisRaw, but needs a single (cached) history fetch, so it is
 * cheap enough to compute for a whole screener page.
 */
/**
 * Downtrend per the strategy: the 20-period SMA sits BELOW the longer moving
 * averages (SMA50, and SMA200 when there is enough history). An uptrend never
 * qualifies, no matter how far the price is from the SMA20.
 */
export function dailyDowntrend(closes: number[]): boolean {
  const s20 = sma(closes, 20);
  const s50 = sma(closes, 50);
  if (s20 === null || s50 === null) return false;
  if (s20 >= s50) return false;
  const s200 = sma(closes, 200);
  return s200 === null || s20 < s200;
}

export function dailyStrategySignal(daily: Candle[]): boolean {
  if (daily.length === 0) return false;
  const closes = daily.map((c) => c.close);
  if (!dailyDowntrend(closes)) return false;
  const sma20 = sma(closes, 20);
  if (sma20 === null || sma20 <= 0) return false;
  const price = closes[closes.length - 1]!;
  const priceToSma20 = ((sma20 - price) / sma20) * 100;
  return priceToSma20 > 20;
}

/** Best-effort screener enrichment: buy score + strategy signal from one daily fetch. */
export async function getScreenerEnrichment(
  ticker: string,
): Promise<{ buyScore: number | null; strategySignal: boolean | null }> {
  try {
    const candles = await fetchHistory(ticker);
    return {
      buyScore: candles.length >= 60 ? buildTechnicalReading(candles).buyScore : null,
      strategySignal: dailyStrategySignal(candles),
    };
  } catch {
    return { buyScore: null, strategySignal: null };
  }
}

// --- Multi-timeframe trend analysis (mensual > semanal > diario > hora) ---

export interface FrameTrend {
  frame: "mensual" | "semanal" | "diario" | "hora";
  trend: "alcista" | "bajista" | "lateral" | "sin datos";
  sma20: number | null;
  priceVsSma20Percent: number | null;
}

export interface TrendAnalysis {
  ticker: string;
  price: number;
  frames: FrameTrend[];
  signal: {
    valid: boolean;
    lowToSma20Percent: number | null;
    message: string;
    bullets: string[];
  };
}

function frameTrend(candles: Candle[]): Omit<FrameTrend, "frame"> {
  const closes = candles.map((c) => c.close);
  const price = closes[closes.length - 1] ?? 0;
  const s20 = sma(closes, 20);
  if (s20 === null) return { trend: "sin datos", sma20: null, priceVsSma20Percent: null };
  const s20prev = closes.length >= 25 ? sma(closes.slice(0, -5), 20) : null;
  let trend: FrameTrend["trend"] = "lateral";
  if (s20 !== null && price > 0) {
    const rising = s20prev !== null ? s20 > s20prev : price > s20;
    const falling = s20prev !== null ? s20 < s20prev : price < s20;
    if (price > s20 * 1.01 && rising) trend = "alcista";
    else if (price < s20 * 0.99 && falling) trend = "bajista";
  }
  return {
    trend,
    sma20: s20,
    priceVsSma20Percent:
      s20 !== null && s20 > 0 ? Math.round(((price - s20) / s20) * 1000) / 10 : null,
  };
}

const FRAME_LABELS: Record<Timeframe, FrameTrend["frame"]> = {
  m: "mensual",
  w: "semanal",
  d: "diario",
  h: "hora",
};

const trendCache = new Map<string, { at: number; data: TrendAnalysis }>();
const trendInFlight = new Map<string, Promise<TrendAnalysis>>();
const TREND_TTL_MS = 30 * 60 * 1000;
const TREND_CACHE_MAX = 300;

export async function buildTrendAnalysis(ticker: string, lang: Lang = "es"): Promise<TrendAnalysis> {
  const key = `${ticker.toUpperCase()}:${lang}`;
  const hit = trendCache.get(key);
  if (hit && Date.now() - hit.at < TREND_TTL_MS) return hit.data;
  let pending = trendInFlight.get(key);
  if (!pending) {
    pending = buildTrendAnalysisRaw(ticker.toUpperCase(), lang)
      .then((data) => {
        // Only cache complete results so missing frames get retried
        if (data.frames.every((f) => f.trend !== "sin datos")) {
          if (trendCache.size >= TREND_CACHE_MAX) {
            const oldest = trendCache.keys().next().value;
            if (oldest !== undefined) trendCache.delete(oldest);
          }
          trendCache.set(key, { at: Date.now(), data });
        }
        return data;
      })
      .finally(() => trendInFlight.delete(key));
    trendInFlight.set(key, pending);
  }
  return pending;
}

// Human-readable trend name for prose (the enum value stays Spanish in `frames`).
function trendWord(trend: FrameTrend["trend"], lang: Lang): string {
  if (lang !== "en") return trend;
  switch (trend) {
    case "alcista":
      return "bullish";
    case "bajista":
      return "bearish";
    case "lateral":
      return "sideways";
    case "sin datos":
      return "no data";
  }
}

async function buildTrendAnalysisRaw(ticker: string, lang: Lang = "es"): Promise<TrendAnalysis> {
  const frames: Timeframe[] = ["m", "w", "d", "h"];
  // Sequential to stay friendly with Finviz rate limits (429s under fan-out)
  const results: FrameTrend[] = [];
  const seriesByFrame = new Map<Timeframe, Candle[]>();
  for (const f of frames) {
    try {
      const candles = await fetchHistory(ticker, f);
      seriesByFrame.set(f, candles);
      results.push({ frame: FRAME_LABELS[f], ...frameTrend(candles) });
    } catch {
      // Report missing data honestly instead of faking a neutral trend
      results.push({ frame: FRAME_LABELS[f], trend: "sin datos", sma20: null, priceVsSma20Percent: null });
    }
  }

  const daily = seriesByFrame.get("d") ?? [];
  const closes = daily.map((c) => c.close);
  const price = closes[closes.length - 1] ?? 0;
  const s20 = sma(closes, 20);
  const dailyTrend = results.find((r) => r.frame === "diario")?.trend ?? "lateral";

  // Strategy: daily downtrend (SMA20 below the longer averages) + price more
  // than 20% below the SMA20. Uptrends never qualify.
  const inDowntrend = dailyDowntrend(closes);
  let lowToSma20 : number | null = null;
  if (s20 !== null && s20 > 0 && price > 0) {
    lowToSma20 = Math.round(((s20 - price) / s20) * 1000) / 10;
  }
  const valid = inDowntrend && lowToSma20 !== null && lowToSma20 > 20;

  const bullets: string[] = [];
  if (lowToSma20 !== null && s20 !== null) {
    bullets.push(
      lowToSma20 > 0
        ? t(lang,
            `El precio está un ${lowToSma20.toFixed(1)}% por debajo de la media móvil de 20 días ($${s20.toFixed(2)}).`,
            `The price is ${lowToSma20.toFixed(1)}% below the 20-day moving average ($${s20.toFixed(2)}).`)
        : t(lang,
            `El precio está por encima de la media móvil de 20 días ($${s20.toFixed(2)}).`,
            `The price is above the 20-day moving average ($${s20.toFixed(2)}).`),
    );
  }
  if (inDowntrend)
    bullets.push(t(lang,
      "Tendencia diaria bajista confirmada: la media de 20 días está por debajo de las medias más largas (50 y 200 días).",
      "Daily downtrend confirmed: the 20-day average sits below the longer averages (50 and 200 days)."));
  else
    bullets.push(t(lang,
      "No hay tendencia bajista: la media de 20 días no está por debajo de las medias más largas (50 y 200 días), condición necesaria para la señal.",
      "No downtrend: the 20-day average is not below the longer averages (50 and 200 days), a necessary condition for the signal."));
  if (valid)
    bullets.push(t(lang,
      "Señal validada: caída extendida lejos de su media, con probabilidad de rebote fuerte.",
      "Signal validated: an extended drop far from its average, with a high probability of a strong bounce."));

  return {
    ticker: ticker.toUpperCase(),
    price,
    frames: results,
    signal: {
      valid,
      lowToSma20Percent: lowToSma20,
      message: valid
        ? t(lang, "Señal de compra validada según la estrategia", "Buy signal validated per the strategy")
        : t(lang, "La señal de la estrategia no se cumple por ahora", "The strategy's signal is not met for now"),
      bullets,
    },
  };
}
