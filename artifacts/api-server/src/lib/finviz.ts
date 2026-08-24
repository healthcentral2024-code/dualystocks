// Finviz Elite export client + simplified scoring engine.
// Fetches the CSV export for a ticker and converts dense metrics into
// plain-language Spanish analysis with 0-100 scores.

const EXPORT_URL = "https://elite.finviz.com/export.ashx";

// Column ids for the custom export view (Finviz "c=" parameter follows the
// header order of the full export; requesting 0-120 returns all columns).
const ALL_COLUMNS = Array.from({ length: 121 }, (_, i) => i).join(",");

export interface FinvizRow {
  [header: string]: string;
}

export type Lang = "es" | "en";

// Pick the string for the requested language (Spanish default).
function t(lang: Lang, es: string, en: string): string {
  return lang === "en" ? en : es;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function parseCsv(text: string): FinvizRow[] {
  // Strip BOM if present
  const clean = text.replace(/^\uFEFF/, "").trim();
  const lines = clean.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]!);
  // Guard against 200-status non-CSV bodies (auth errors, HTML gateways, quota pages)
  if (!headers.includes("Ticker")) {
    throw new Error(
      `Finviz devolvió una respuesta inesperada (no CSV): ${clean.slice(0, 120)}`,
    );
  }
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: FinvizRow = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? "";
    });
    return row;
  });
}

export async function fetchScreenerRows(
  filters: string,
  order: string,
  limit: number,
): Promise<FinvizRow[]> {
  const auth = process.env["FINVIZ_API_KEY"];
  if (!auth) {
    throw new Error("FINVIZ_API_KEY is not configured");
  }
  const url = `${EXPORT_URL}?v=152&f=${encodeURIComponent(filters)}&o=${encodeURIComponent(order)}&c=${ALL_COLUMNS}&auth=${encodeURIComponent(auth)}`;
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`Finviz respondió con estado ${res.status}`);
  }
  return parseCsv(await res.text()).slice(0, limit);
}

/** Fetch several tickers in ONE Finviz request (t= accepts a comma list). */
export async function fetchFinvizRows(tickers: string[]): Promise<FinvizRow[]> {
  if (tickers.length === 0) return [];
  const auth = process.env["FINVIZ_API_KEY"];
  if (!auth) {
    throw new Error("FINVIZ_API_KEY is not configured");
  }
  const url = `${EXPORT_URL}?v=152&t=${encodeURIComponent(tickers.join(","))}&c=${ALL_COLUMNS}&auth=${encodeURIComponent(auth)}`;
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`Finviz respondió con estado ${res.status}`);
  }
  return parseCsv(await res.text()).filter((r) => r["Ticker"] && r["Price"]);
}

export async function fetchFinvizRow(ticker: string): Promise<FinvizRow | null> {
  const auth = process.env["FINVIZ_API_KEY"];
  if (!auth) {
    throw new Error("FINVIZ_API_KEY is not configured");
  }
  const url = `${EXPORT_URL}?v=152&t=${encodeURIComponent(ticker)}&c=${ALL_COLUMNS}&auth=${encodeURIComponent(auth)}`;
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`Finviz respondió con estado ${res.status}`);
  }
  const rows = parseCsv(await res.text());
  const row = rows[0];
  if (!row || !row["Ticker"] || !row["Price"]) return null;
  return row;
}

// ---------- parsing helpers ----------

function num(row: FinvizRow, key: string): number | null {
  const raw = row[key];
  if (raw === undefined || raw === "" || raw === "-") return null;
  const cleaned = raw.replace(/[%,$]/g, "").replace(/,/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function str(row: FinvizRow, key: string): string | null {
  const raw = row[key];
  if (raw === undefined || raw === "" || raw === "-") return null;
  return raw;
}

function fmtMarketCap(mcapMillions: number | null): string | null {
  if (mcapMillions === null) return null;
  if (mcapMillions >= 1_000_000) return `${(mcapMillions / 1_000_000).toFixed(2)}T`;
  if (mcapMillions >= 1_000) return `${(mcapMillions / 1_000).toFixed(2)}B`;
  return `${mcapMillions.toFixed(0)}M`;
}

// Map a value onto 0-100 given "bad" and "good" reference points (linear).
function scale(value: number, bad: number, good: number): number {
  const t = (value - bad) / (good - bad);
  return Math.round(Math.max(0, Math.min(1, t)) * 100);
}

interface Factor {
  label: string;
  value: string;
  score: number;
}

interface Category {
  key: string;
  label: string;
  score: number;
  verdict: string;
  points: string[];
  weight?: number;
  factors?: Factor[];
}

function avg(scores: number[]): number {
  if (scores.length === 0) return 50;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function verdictFor(score: number, good: string, mid: string, bad: string): string {
  if (score >= 65) return good;
  if (score >= 40) return mid;
  return bad;
}

export interface SimplifiedAnalysis {
  ticker: string;
  companyName: string;
  sector: string;
  industry: string;
  country: string | null;
  price: number;
  changePercent: number;
  marketCap: string | null;
  strategyMatch: boolean;
  overallScore: number;
  overallVerdict: string;
  summary: string[];
  categories: Category[];
  keyMetrics: { label: string; value: string; hint: string | null }[];
  lastEarningsDate: string | null;
  nextEarningsDate: string | null;
  targetPrice: number | null;
  recommendation: number | null;
  insiderTransPercent: number | null;
  insiderOwnPercent: number | null;
  analyzedAt: string;
}

export function parseNextEarningsDate(
  rawValue: string | null,
  now: Date = new Date(),
): string | null {
  if (!rawValue) return null;

  const isoMatch = rawValue.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const numericDateMatch = rawValue.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
  if (numericDateMatch) {
    const month = Number(numericDateMatch[1]);
    const day = Number(numericDateMatch[2]);
    const yearValue = Number(numericDateMatch[3]);
    const year = yearValue < 100 ? 2000 + yearValue : yearValue;
    const candidate = new Date(Date.UTC(year, month - 1, day));
    if (
      month >= 1 &&
      month <= 12 &&
      candidate.getUTCFullYear() === year &&
      candidate.getUTCMonth() === month - 1 &&
      candidate.getUTCDate() === day
    ) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  const dateMatch = rawValue.match(
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})(?:,\s*(\d{4}))?\b/i,
  );
  if (!dateMatch) return null;

  const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const month = monthNames.indexOf(dateMatch[1]!.toLowerCase());
  const day = Number(dateMatch[2]);
  let year = dateMatch[3] ? Number(dateMatch[3]) : now.getUTCFullYear();
  if (month < 0 || day < 1 || day > 31) return null;

  let candidate = new Date(Date.UTC(year, month, day));
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (!dateMatch[3] && candidate < sevenDaysAgo) {
    year += 1;
    candidate = new Date(Date.UTC(year, month, day));
  }
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month ||
    candidate.getUTCDate() !== day
  ) {
    return null;
  }

  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ---------- screener presets ----------

interface LangText {
  es: string;
  en: string;
}

export interface ScreenerPreset {
  preset: string;
  label: LangText;
  description: LangText;
  criteria: LangText[];
  filters: string;
  order: string;
}

// Resolve a preset's user-facing text for the requested language.
export interface LocalizedPreset {
  preset: string;
  label: string;
  description: string;
  criteria: string[];
  filters: string;
  order: string;
}

export function localizePreset(preset: ScreenerPreset, lang: Lang): LocalizedPreset {
  return {
    preset: preset.preset,
    label: preset.label[lang],
    description: preset.description[lang],
    criteria: preset.criteria.map((c) => c[lang]),
    filters: preset.filters,
    order: preset.order,
  };
}

export const SCREENER_PRESETS: Record<string, ScreenerPreset> = {
  valor: {
    preset: "valor",
    label: {
      es: "Valor con bajo riesgo",
      en: "Value with low risk",
    },
    description: {
      es: "Empresas medianas y grandes que cotizan baratas frente a sus ganancias, con poca deuda, buena rentabilidad y menor volatilidad que el mercado. Ideas para comprar y mantener a mediano o largo plazo.",
      en: "Mid- and large-cap companies trading cheaply relative to their earnings, with low debt, solid profitability and less volatility than the market. Ideas to buy and hold for the medium or long term.",
    },
    criteria: [
      {
        es: "P/E menor a 20 y PEG menor a 1.5 (baratas frente a lo que ganan y crecen)",
        en: "P/E under 20 and PEG under 1.5 (cheap relative to what they earn and grow)",
      },
      {
        es: "Deuda/Capital menor a 1 (deuda bajo control)",
        en: "Debt/Equity under 1 (debt under control)",
      },
      {
        es: "ROE mayor a 10% (negocio rentable)",
        en: "ROE above 10% (profitable business)",
      },
      {
        es: "Beta menor a 1.5 (volatilidad contenida)",
        en: "Beta under 1.5 (contained volatility)",
      },
      {
        es: "Capitalización mediana o superior",
        en: "Mid-cap or larger",
      },
    ],
    filters: "fa_pe_u20,fa_peg_u1.5,fa_debteq_u1,fa_roe_o10,ta_beta_u1.5,cap_midover",
    order: "pe",
  },
  dividendos: {
    preset: "dividendos",
    label: {
      es: "Dividendos sólidos",
      en: "Solid dividends",
    },
    description: {
      es: "Empresas que pagan más de 3% anual en dividendos, con un reparto sostenible y deuda controlada. Pensadas para generar ingresos mientras esperas la apreciación a largo plazo.",
      en: "Companies paying more than 3% a year in dividends, with a sustainable payout and controlled debt. Designed to generate income while you wait for long-term appreciation.",
    },
    criteria: [
      {
        es: "Dividendo mayor a 3% anual",
        en: "Dividend above 3% a year",
      },
      {
        es: "Payout menor a 70% (el dividendo es sostenible)",
        en: "Payout under 70% (the dividend is sustainable)",
      },
      {
        es: "Deuda/Capital menor a 1",
        en: "Debt/Equity under 1",
      },
      {
        es: "Capitalización mediana o superior",
        en: "Mid-cap or larger",
      },
    ],
    filters: "fa_div_o3,fa_payoutratio_u70,fa_debteq_u1,cap_midover",
    order: "-dividendyield",
  },
  oportunidades: {
    preset: "oportunidades",
    label: {
      es: "Calidad en descuento",
      en: "Quality at a discount",
    },
    description: {
      es: "Empresas grandes, rentables y en crecimiento que hoy cotizan por debajo de su promedio de 50 días: negocios de calidad pasando por una baja temporal de precio.",
      en: "Large, profitable, growing companies now trading below their 50-day average: quality businesses going through a temporary dip in price.",
    },
    criteria: [
      {
        es: "ROE mayor a 15% (alta rentabilidad)",
        en: "ROE above 15% (high profitability)",
      },
      {
        es: "Ganancias creciendo más de 5% este año",
        en: "Earnings growing more than 5% this year",
      },
      {
        es: "Precio por debajo de su promedio de 50 días (en descuento)",
        en: "Price below its 50-day average (at a discount)",
      },
      {
        es: "Capitalización grande",
        en: "Large-cap",
      },
    ],
    filters: "fa_roe_o15,fa_epsyoy_o5,ta_sma50_pb,cap_largeover",
    order: "pe",
  },
  estrategia: {
    preset: "estrategia",
    label: { es: "Mi Estrategia", en: "My Strategy" },
    description: {
      es: "Tu lista lista-para-comprar: empresas de cualquier país con capitalización superior a $500M y cuyo precio objetivo promedio de los analistas está al menos 50% por encima del precio actual, ordenadas por puntuación técnica de compra.",
      en: "Your ready-to-buy list: companies from any country with a market cap above $500M whose average analyst price target is at least 50% above the current price, ranked by technical buy score.",
    },
    criteria: [
      { es: "Capitalización mayor a $500M", en: "Market cap above $500M" },
      { es: "Todos los países (mercado abierto)", en: "All countries (open market)" },
      {
        es: "Potencial al precio objetivo mayor a +50%",
        en: "Upside to price target above +50%",
      },
    ],
    // cap_0.5to = Elite custom range ">$500M" (cap_o0.5 is invalid and silently ignored)
    filters: "cap_0.5to,targetprice_a50",
    order: "-targetprice",
  },
};

export interface ScreenerStock {
  ticker: string;
  companyName: string;
  sector: string;
  price: number;
  changePercent: number;
  marketCap: string | null;
  pe: number | null;
  dividendYield: string | null;
  beta: number | null;
  targetUpsidePercent: number | null;
  targetPrice: number | null;
  recom: number | null;
  insiderTransactions: string | null;
  index: string | null;
  reasons: string[];
}

export function buildScreenerStock(row: FinvizRow, lang: Lang = "es"): ScreenerStock {
  const price = num(row, "Price") ?? 0;
  const pe = num(row, "P/E");
  const peg = num(row, "PEG");
  const roe = num(row, "Return on Equity");
  const debtEq = num(row, "Total Debt/Equity");
  const beta = num(row, "Beta");
  const divYield = str(row, "Dividend Yield");
  const target = num(row, "Target Price");
  const sma50 = num(row, "50-Day Simple Moving Average");
  const upside =
    target !== null && price > 0 ? ((target - price) / price) * 100 : null;

  const reasons: string[] = [];
  if (pe !== null && pe < 20)
    reasons.push(t(lang, `P/E de ${pe.toFixed(1)}: barata frente a sus ganancias`, `P/E of ${pe.toFixed(1)}: cheap relative to its earnings`));
  if (peg !== null && peg < 1.5)
    reasons.push(t(lang, `PEG de ${peg.toFixed(2)}: el precio no ignora su crecimiento`, `PEG of ${peg.toFixed(2)}: the price accounts for its growth`));
  if (roe !== null && roe > 10)
    reasons.push(t(lang, `ROE de ${roe.toFixed(0)}%: negocio rentable`, `ROE of ${roe.toFixed(0)}%: profitable business`));
  if (debtEq !== null && debtEq < 1)
    reasons.push(t(lang, `Deuda/Capital de ${debtEq.toFixed(2)}: deuda bajo control`, `Debt/Equity of ${debtEq.toFixed(2)}: debt under control`));
  if (divYield)
    reasons.push(t(lang, `Paga ${divYield} anual en dividendos`, `Pays ${divYield} a year in dividends`));
  if (beta !== null && beta < 1)
    reasons.push(t(lang, `Beta de ${beta.toFixed(2)}: se mueve menos que el mercado`, `Beta of ${beta.toFixed(2)}: moves less than the market`));
  if (sma50 !== null && sma50 < 0)
    reasons.push(t(lang, `Cotiza ${Math.abs(sma50).toFixed(1)}% bajo su promedio de 50 días`, `Trades ${Math.abs(sma50).toFixed(1)}% below its 50-day average`));
  if (upside !== null && upside > 0)
    reasons.push(t(lang, `Analistas le ven +${upside.toFixed(1)}% hasta $${target!.toFixed(2)}`, `Analysts see +${upside.toFixed(1)}% upside to $${target!.toFixed(2)}`));

  return {
    ticker: row["Ticker"] ?? "",
    companyName: row["Company"] ?? "",
    sector: row["Sector"] ?? "",
    price,
    changePercent: num(row, "Change") ?? 0,
    marketCap: fmtMarketCap(num(row, "Market Cap")),
    pe,
    dividendYield: divYield,
    beta,
    targetUpsidePercent: upside !== null ? Math.round(upside * 10) / 10 : null,
    targetPrice: target,
    recom: num(row, "Analyst Recom"),
    insiderTransactions: str(row, "Insider Transactions"),
    index: str(row, "Index"),
    reasons: reasons.slice(0, 4),
  };
}

export function buildAnalysis(
  row: FinvizRow,
  lang: Lang = "es",
  macd?: import("./technical").MacdReading | null,
  lastEarningsDate: string | null = null,
): SimplifiedAnalysis {
  const ticker = row["Ticker"] ?? "";
  const price = num(row, "Price") ?? 0;
  const change = num(row, "Change") ?? 0;

  // --- Valoración ---
  const pe = num(row, "P/E");
  const fpe = num(row, "Forward P/E");
  const peg = num(row, "PEG");
  const pb = num(row, "P/B");
  const valScores: number[] = [];
  const valPoints: string[] = [];
  const valFactors: Factor[] = [];
  if (pe !== null) {
    valScores.push(scale(pe, 60, 10));
    valFactors.push({ label: "P/E", value: pe.toFixed(1), score: scale(pe, 60, 10) });
    valPoints.push(
      pe < 20
        ? t(lang, `P/E de ${pe.toFixed(1)}: pagas poco por cada dólar de ganancia`, `P/E of ${pe.toFixed(1)}: you pay little for each dollar of earnings`)
        : pe < 35
          ? t(lang, `P/E de ${pe.toFixed(1)}: valoración moderada frente al mercado`, `P/E of ${pe.toFixed(1)}: moderate valuation versus the market`)
          : t(lang, `P/E de ${pe.toFixed(1)}: la acción está cara frente a sus ganancias`, `P/E of ${pe.toFixed(1)}: the stock is expensive relative to its earnings`),
    );
  }
  if (peg !== null) {
    valScores.push(scale(peg, 4, 0.8));
    valFactors.push({ label: "PEG", value: peg.toFixed(2), score: scale(peg, 4, 0.8) });
    valPoints.push(
      peg < 1.5
        ? t(lang, `PEG de ${peg.toFixed(2)}: precio razonable considerando su crecimiento`, `PEG of ${peg.toFixed(2)}: reasonable price given its growth`)
        : t(lang, `PEG de ${peg.toFixed(2)}: el crecimiento no justifica del todo el precio`, `PEG of ${peg.toFixed(2)}: growth doesn't fully justify the price`),
    );
  }
  if (fpe !== null && pe !== null && fpe < pe) {
    valPoints.push(t(lang, `El P/E futuro (${fpe.toFixed(1)}) es menor: se esperan más ganancias`, `The forward P/E (${fpe.toFixed(1)}) is lower: more earnings are expected`));
  }
  if (pb !== null && pb < 3) {
    valPoints.push(t(lang, `P/B de ${pb.toFixed(1)}: cotiza cerca de su valor contable`, `P/B of ${pb.toFixed(1)}: trades close to its book value`));
  }
  const valuation: Category = {
    key: "valuation",
    label: t(lang, "Valoración", "Valuation"),
    score: avg(valScores),
    verdict: verdictFor(
      avg(valScores),
      t(lang, "Precio atractivo frente a lo que gana la empresa", "Attractive price relative to what the company earns"),
      t(lang, "Valoración razonable, ni ganga ni burbuja", "Reasonable valuation, neither a bargain nor a bubble"),
      t(lang, "La acción está cara: pagas una prima alta", "The stock is expensive: you pay a high premium"),
    ),
    points: valPoints,
    factors: valFactors,
  };

  // --- Crecimiento ---
  const epsNext5 = num(row, "EPS Growth Next 5 Years");
  const epsThis = num(row, "EPS Growth This Year");
  const epsNext = num(row, "EPS Growth Next Year");
  const salesQ = num(row, "Sales Growth Quarter Over Quarter");
  const grScores: number[] = [];
  const grPoints: string[] = [];
  const grFactors: Factor[] = [];
  if (epsNext5 !== null) {
    grScores.push(scale(epsNext5, 0, 20));
    grFactors.push({ label: t(lang, "Crecim. ganancias 5 años", "EPS growth 5 yrs"), value: `${epsNext5.toFixed(1)}%`, score: scale(epsNext5, 0, 20) });
    grPoints.push(t(lang, `Crecimiento esperado de ganancias: ${epsNext5.toFixed(1)}% anual (próx. 5 años)`, `Expected earnings growth: ${epsNext5.toFixed(1)}% a year (next 5 years)`));
  }
  if (epsThis !== null) {
    grScores.push(scale(epsThis, -10, 25));
    grFactors.push({ label: t(lang, "Ganancias este año", "Earnings this year"), value: `${epsThis >= 0 ? "+" : ""}${epsThis.toFixed(1)}%`, score: scale(epsThis, -10, 25) });
    grPoints.push(t(lang, `Ganancias este año: ${epsThis >= 0 ? "+" : ""}${epsThis.toFixed(1)}%`, `Earnings this year: ${epsThis >= 0 ? "+" : ""}${epsThis.toFixed(1)}%`));
  }
  if (epsNext !== null) {
    grScores.push(scale(epsNext, -10, 25));
    grFactors.push({ label: t(lang, "Ganancias próx. año", "Earnings next year"), value: `${epsNext >= 0 ? "+" : ""}${epsNext.toFixed(1)}%`, score: scale(epsNext, -10, 25) });
  }
  if (salesQ !== null) {
    grScores.push(scale(salesQ, -5, 20));
    grFactors.push({ label: t(lang, "Ventas últ. trimestre", "Sales last quarter"), value: `${salesQ >= 0 ? "+" : ""}${salesQ.toFixed(1)}%`, score: scale(salesQ, -5, 20) });
    grPoints.push(t(lang, `Ventas del último trimestre: ${salesQ >= 0 ? "+" : ""}${salesQ.toFixed(1)}% interanual`, `Latest quarter sales: ${salesQ >= 0 ? "+" : ""}${salesQ.toFixed(1)}% year over year`));
  }
  const growth: Category = {
    key: "growth",
    label: t(lang, "Crecimiento", "Growth"),
    score: avg(grScores),
    verdict: verdictFor(
      avg(grScores),
      t(lang, "La empresa crece con fuerza", "The company is growing strongly"),
      t(lang, "Crecimiento moderado y estable", "Moderate and steady growth"),
      t(lang, "El crecimiento es débil o está estancado", "Growth is weak or stalled"),
    ),
    points: grPoints,
    factors: grFactors,
  };

  // --- Rentabilidad ---
  const roe = num(row, "Return on Equity");
  const margin = num(row, "Profit Margin");
  const opMargin = num(row, "Operating Margin");
  const prScores: number[] = [];
  const prPoints: string[] = [];
  const prFactors: Factor[] = [];
  if (roe !== null) {
    prScores.push(scale(roe, 0, 25));
    prFactors.push({ label: "ROE", value: `${roe.toFixed(1)}%`, score: scale(roe, 0, 25) });
    prPoints.push(t(lang, `ROE de ${roe.toFixed(1)}%: retorno sobre el dinero de los accionistas`, `ROE of ${roe.toFixed(1)}%: return on shareholders' money`));
  }
  if (margin !== null) {
    prScores.push(scale(margin, 0, 20));
    prFactors.push({ label: t(lang, "Margen neto", "Net margin"), value: `${margin.toFixed(1)}%`, score: scale(margin, 0, 20) });
    prPoints.push(t(lang, `Margen neto de ${margin.toFixed(1)}%: lo que queda de cada venta como ganancia`, `Net margin of ${margin.toFixed(1)}%: what's left of each sale as profit`));
  }
  if (opMargin !== null) {
    prScores.push(scale(opMargin, 0, 25));
    prFactors.push({ label: t(lang, "Margen operativo", "Operating margin"), value: `${opMargin.toFixed(1)}%`, score: scale(opMargin, 0, 25) });
  }
  const profitability: Category = {
    key: "profitability",
    label: t(lang, "Rentabilidad", "Profitability"),
    score: avg(prScores),
    verdict: verdictFor(
      avg(prScores),
      t(lang, "Negocio muy rentable y eficiente", "Very profitable and efficient business"),
      t(lang, "Rentabilidad aceptable para su sector", "Acceptable profitability for its sector"),
      t(lang, "Le cuesta convertir ventas en ganancias", "Struggles to turn sales into profit"),
    ),
    points: prPoints,
    factors: prFactors,
  };

  // --- Salud financiera ---
  const debtEq = num(row, "Total Debt/Equity");
  const currentRatio = num(row, "Current Ratio");
  const heScores: number[] = [];
  const hePoints: string[] = [];
  const heFactors: Factor[] = [];
  if (debtEq !== null) {
    heScores.push(scale(debtEq, 2.5, 0.2));
    heFactors.push({ label: t(lang, "Deuda/Capital", "Debt/Equity"), value: debtEq.toFixed(2), score: scale(debtEq, 2.5, 0.2) });
    hePoints.push(
      debtEq < 1
        ? t(lang, `Deuda/Capital de ${debtEq.toFixed(2)}: deuda bajo control`, `Debt/Equity of ${debtEq.toFixed(2)}: debt under control`)
        : t(lang, `Deuda/Capital de ${debtEq.toFixed(2)}: carga de deuda considerable`, `Debt/Equity of ${debtEq.toFixed(2)}: sizable debt load`),
    );
  }
  if (currentRatio !== null) {
    heScores.push(scale(currentRatio, 0.5, 2));
    heFactors.push({ label: t(lang, "Ratio corriente", "Current ratio"), value: currentRatio.toFixed(2), score: scale(currentRatio, 0.5, 2) });
    hePoints.push(
      currentRatio >= 1
        ? t(lang, `Ratio corriente de ${currentRatio.toFixed(2)}: puede pagar sus cuentas de corto plazo`, `Current ratio of ${currentRatio.toFixed(2)}: can pay its short-term bills`)
        : t(lang, `Ratio corriente de ${currentRatio.toFixed(2)}: liquidez ajustada`, `Current ratio of ${currentRatio.toFixed(2)}: tight liquidity`),
    );
  }
  const health: Category = {
    key: "health",
    label: t(lang, "Salud financiera", "Financial health"),
    score: avg(heScores),
    verdict: verdictFor(
      avg(heScores),
      t(lang, "Finanzas sólidas, bajo riesgo de apuros", "Solid finances, low risk of trouble"),
      t(lang, "Situación financiera manejable", "Manageable financial situation"),
      t(lang, "Deuda o liquidez que merecen precaución", "Debt or liquidity that warrant caution"),
    ),
    points: hePoints,
    factors: heFactors,
  };

  // --- Momentum (corto plazo) ---
  const rsi = num(row, "Relative Strength Index (14)");
  const sma50 = num(row, "50-Day Simple Moving Average");
  const sma200 = num(row, "200-Day Simple Moving Average");
  const perfMonth = num(row, "Performance (Month)");
  const perfQuarter = num(row, "Performance (Quarter)");
  const moScores: number[] = [];
  const moPoints: string[] = [];
  const moFactors: Factor[] = [];
  if (sma50 !== null) {
    moScores.push(scale(sma50, -10, 10));
    moFactors.push({ label: t(lang, "vs. promedio 50 días", "vs. 50-day average"), value: `${sma50 >= 0 ? "+" : ""}${sma50.toFixed(1)}%`, score: scale(sma50, -10, 10) });
    moPoints.push(
      sma50 >= 0
        ? t(lang, `Cotiza ${sma50.toFixed(1)}% sobre su promedio de 50 días: tendencia de corto plazo alcista`, `Trades ${sma50.toFixed(1)}% above its 50-day average: bullish short-term trend`)
        : t(lang, `Cotiza ${Math.abs(sma50).toFixed(1)}% bajo su promedio de 50 días: presión de corto plazo`, `Trades ${Math.abs(sma50).toFixed(1)}% below its 50-day average: short-term pressure`),
    );
  }
  if (sma200 !== null) {
    moScores.push(scale(sma200, -15, 15));
    moFactors.push({ label: t(lang, "vs. promedio 200 días", "vs. 200-day average"), value: `${sma200 >= 0 ? "+" : ""}${sma200.toFixed(1)}%`, score: scale(sma200, -15, 15) });
    moPoints.push(
      sma200 >= 0
        ? t(lang, `Sobre su promedio de 200 días: tendencia de fondo positiva`, `Above its 200-day average: positive underlying trend`)
        : t(lang, `Bajo su promedio de 200 días: tendencia de fondo débil`, `Below its 200-day average: weak underlying trend`),
    );
  }
  if (perfMonth !== null) {
    moScores.push(scale(perfMonth, -10, 10));
    moFactors.push({ label: t(lang, "Último mes", "Past month"), value: `${perfMonth >= 0 ? "+" : ""}${perfMonth.toFixed(1)}%`, score: scale(perfMonth, -10, 10) });
    moPoints.push(t(lang, `Último mes: ${perfMonth >= 0 ? "+" : ""}${perfMonth.toFixed(1)}%`, `Past month: ${perfMonth >= 0 ? "+" : ""}${perfMonth.toFixed(1)}%`));
  }
  if (perfQuarter !== null) {
    moScores.push(scale(perfQuarter, -15, 15));
    moFactors.push({ label: t(lang, "Último trimestre", "Past quarter"), value: `${perfQuarter >= 0 ? "+" : ""}${perfQuarter.toFixed(1)}%`, score: scale(perfQuarter, -15, 15) });
  }
  if (rsi !== null) {
    // Prefer neutral RSI: too high = overbought, too low = oversold
    const rsiScore = rsi > 70 ? scale(rsi, 90, 70) : rsi < 30 ? scale(rsi, 10, 30) : 100 - Math.abs(50 - rsi);
    moScores.push(rsiScore);
    moFactors.push({ label: "RSI (14)", value: rsi.toFixed(0), score: Math.round(rsiScore) });
    if (rsi > 70) moPoints.push(t(lang, `RSI de ${rsi.toFixed(0)}: sobrecomprada, puede corregir en el corto plazo`, `RSI of ${rsi.toFixed(0)}: overbought, may pull back in the short term`));
    else if (rsi < 30) moPoints.push(t(lang, `RSI de ${rsi.toFixed(0)}: sobrevendida, posible rebote`, `RSI of ${rsi.toFixed(0)}: oversold, possible bounce`));
    else moPoints.push(t(lang, `RSI de ${rsi.toFixed(0)}: en zona sana, ni sobrecomprada ni sobrevendida`, `RSI of ${rsi.toFixed(0)}: in a healthy zone, neither overbought nor oversold`));
  }
  if (macd) {
    // MACD 12/26/9 from daily prices: above the signal line = bullish momentum.
    const histPct = price > 0 ? (macd.histogram / price) * 100 : 0;
    const macdScore = scale(histPct, -1.5, 1.5);
    moScores.push(macdScore);
    moFactors.push({ label: "MACD", value: `${macd.histogram >= 0 ? "+" : ""}${macd.histogram.toFixed(2)}`, score: macdScore });
    const rising = macd.prevHistogram !== null && macd.histogram > macd.prevHistogram;
    moPoints.push(
      macd.histogram >= 0
        ? t(lang,
            `MACD por encima de su señal${rising ? " y ganando fuerza" : ""}: impulso comprador`,
            `MACD above its signal line${rising ? " and gaining strength" : ""}: buying momentum`)
        : t(lang,
            `MACD por debajo de su señal${rising ? ", aunque mejorando" : ""}: impulso vendedor`,
            `MACD below its signal line${rising ? ", though improving" : ""}: selling momentum`),
    );
  }
  const momentum: Category = {
    key: "momentum",
    label: t(lang, "Momentum", "Momentum"),
    score: avg(moScores),
    verdict: verdictFor(
      avg(moScores),
      t(lang, "La acción viene con viento a favor", "The stock has the wind at its back"),
      t(lang, "Tendencia mixta, sin dirección clara", "Mixed trend, no clear direction"),
      t(lang, "La tendencia reciente juega en contra", "The recent trend is working against it"),
    ),
    points: moPoints,
    factors: moFactors,
  };

  // --- Sentimiento ---
  const recom = num(row, "Analyst Recom");
  const target = num(row, "Target Price");
  const shortFloat = num(row, "Short Float");
  const instOwn = num(row, "Institutional Ownership");
  const seScores: number[] = [];
  const sePoints: string[] = [];
  const seFactors: Factor[] = [];
  if (recom !== null) {
    seScores.push(scale(recom, 4, 1.5));
    seFactors.push({ label: t(lang, "Recom. analistas", "Analyst rating"), value: recom.toFixed(1), score: scale(recom, 4, 1.5) });
    sePoints.push(
      recom <= 2
        ? t(lang, `Recomendación de analistas: ${recom.toFixed(1)} (compra)`, `Analyst rating: ${recom.toFixed(1)} (buy)`)
        : recom <= 3
          ? t(lang, `Recomendación de analistas: ${recom.toFixed(1)} (mantener)`, `Analyst rating: ${recom.toFixed(1)} (hold)`)
          : t(lang, `Recomendación de analistas: ${recom.toFixed(1)} (venta)`, `Analyst rating: ${recom.toFixed(1)} (sell)`),
    );
  }
  if (target !== null && price > 0) {
    const upside = ((target - price) / price) * 100;
    seScores.push(scale(upside, -10, 25));
    seFactors.push({ label: t(lang, "Potencial al objetivo", "Upside to target"), value: `${upside >= 0 ? "+" : ""}${upside.toFixed(1)}%`, score: scale(upside, -10, 25) });
    sePoints.push(
      t(lang,
        `Precio objetivo $${target.toFixed(2)}: ${upside >= 0 ? "+" : ""}${upside.toFixed(1)}% de potencial según analistas`,
        `Target price $${target.toFixed(2)}: ${upside >= 0 ? "+" : ""}${upside.toFixed(1)}% upside according to analysts`),
    );
  }
  if (shortFloat !== null) {
    seScores.push(scale(shortFloat, 15, 1));
    seFactors.push({ label: "Short float", value: `${shortFloat.toFixed(1)}%`, score: scale(shortFloat, 15, 1) });
    if (shortFloat > 10) sePoints.push(t(lang, `Short float de ${shortFloat.toFixed(1)}%: muchos apuestan en contra`, `Short float of ${shortFloat.toFixed(1)}%: many are betting against it`));
  }
  if (instOwn !== null && instOwn > 50) {
    sePoints.push(t(lang, `${instOwn.toFixed(0)}% en manos de instituciones: respaldo profesional`, `${instOwn.toFixed(0)}% held by institutions: professional backing`));
  }
  const sentiment: Category = {
    key: "sentiment",
    label: t(lang, "Sentimiento", "Sentiment"),
    score: avg(seScores),
    verdict: verdictFor(
      avg(seScores),
      t(lang, "Wall Street ve la acción con buenos ojos", "Wall Street views the stock favorably"),
      t(lang, "Opiniones divididas entre los analistas", "Opinions are split among analysts"),
      t(lang, "El mercado desconfía de esta acción", "The market is wary of this stock"),
    ),
    points: sePoints,
    factors: seFactors,
  };

  const categories = [valuation, growth, profitability, health, momentum, sentiment];

  // Weighted overall: momentum & sentiment matter for short term; growth/valuation for medium.
  const weights: Record<string, number> = {
    valuation: 0.18,
    growth: 0.2,
    profitability: 0.16,
    health: 0.12,
    momentum: 0.18,
    sentiment: 0.16,
  };
  const overallScore = Math.round(
    categories.reduce((acc, c) => acc + c.score * (weights[c.key] ?? 0), 0),
  );
  for (const c of categories) c.weight = Math.round((weights[c.key] ?? 0) * 100);

  // --- La estrategia del usuario: gangas de calidad ---
  // Cap > $500M, recomendación de analistas < 2, potencial al objetivo > 50%
  // y los insiders no están vendiendo. Cuando se cumple, el veredicto lo dice
  // claramente aunque el puntaje fundamental sea bajo (las gangas suelen tenerlo).
  const capM = num(row, "Market Cap");
  const insiderTrans = num(row, "Insider Transactions");
  const upsidePct = target !== null && price > 0 ? ((target - price) / price) * 100 : null;
  const strategyMatch =
    capM !== null && capM > 500 &&
    recom !== null && recom < 2 &&
    upsidePct !== null && upsidePct > 50 &&
    (insiderTrans === null || insiderTrans >= 0);

  const overallVerdict = strategyMatch
    ? t(lang,
        "Cumple tu estrategia: empresa sólida a precio de ganga",
        "Meets your strategy: a solid company at a bargain price")
    : overallScore >= 70
      ? t(lang, "Candidata sólida para invertir a corto y mediano plazo", "Solid candidate for short- and medium-term investing")
      : overallScore >= 55
        ? t(lang, "Interesante, pero conviene esperar mejor punto de entrada o más confirmación", "Interesting, but it's worth waiting for a better entry point or more confirmation")
        : overallScore >= 40
          ? t(lang, "Neutral: hay señales mixtas, no es prioridad para invertir hoy", "Neutral: signals are mixed, not a priority to invest in today")
          : t(lang, "Mejor evitarla por ahora: los riesgos superan a las oportunidades", "Better to avoid for now: the risks outweigh the opportunities");

  // Summary: top strengths and weaknesses
  const sorted = [...categories].sort((a, b) => b.score - a.score);
  const best = sorted[0]!;
  const worst = sorted[sorted.length - 1]!;
  const summary: string[] = [];
  if (strategyMatch) {
    summary.push(
      t(lang,
        `Cumple tus criterios: capitalización mayor a $500M, recomendación de analistas ${recom!.toFixed(1)} (menos de 2), potencial de +${upsidePct!.toFixed(1)}% al precio objetivo${insiderTrans !== null && insiderTrans > 0 ? " e insiders comprando" : ""}`,
        `Meets your criteria: market cap above $500M, analyst rating ${recom!.toFixed(1)} (below 2), +${upsidePct!.toFixed(1)}% upside to target${insiderTrans !== null && insiderTrans > 0 ? ", and insiders buying" : ""}`),
      t(lang,
        `El puntaje fundamental (${overallScore}/100) puede ser bajo: es normal en las gangas de tu estrategia, que buscan empresas castigadas con gran potencial de rebote`,
        `The fundamental score (${overallScore}/100) can be low: that's normal for your strategy's bargains, which target beaten-down companies with big rebound potential`),
    );
  }
  summary.push(
    t(lang, `Puntaje general: ${overallScore}/100 — ${overallVerdict.toLowerCase()}`, `Overall score: ${overallScore}/100 — ${overallVerdict.toLowerCase()}`),
    t(lang, `Punto más fuerte: ${best.label.toLowerCase()} (${best.score}/100)`, `Strongest area: ${best.label.toLowerCase()} (${best.score}/100)`),
    t(lang, `Punto más débil: ${worst.label.toLowerCase()} (${worst.score}/100)`, `Weakest area: ${worst.label.toLowerCase()} (${worst.score}/100)`),
  );
  if (target !== null && price > 0) {
    const upside = ((target - price) / price) * 100;
    summary.push(
      upside >= 0
        ? t(lang, `Los analistas le ven un ${upside.toFixed(1)}% de subida hasta $${target.toFixed(2)}`, `Analysts see ${upside.toFixed(1)}% upside to $${target.toFixed(2)}`)
        : t(lang, `El precio objetivo de los analistas ($${target.toFixed(2)}) está por debajo del precio actual`, `Analysts' target price ($${target.toFixed(2)}) is below the current price`),
    );
  }

  const nextEarningsDate = parseNextEarningsDate(str(row, "Earnings Date"));
  const keyMetrics = [
    { label: "P/E", value: pe !== null ? pe.toFixed(2) : "—", hint: t(lang, "Precio sobre ganancias: cuántos años de ganancias pagas", "Price to earnings: how many years of earnings you pay for") },
    { label: t(lang, "P/E futuro", "Forward P/E"), value: fpe !== null ? fpe.toFixed(2) : "—", hint: t(lang, "P/E con las ganancias estimadas del próximo año", "P/E using next year's estimated earnings") },
    { label: "PEG", value: peg !== null ? peg.toFixed(2) : "—", hint: t(lang, "P/E ajustado por crecimiento; menos de 1.5 suele ser bueno", "P/E adjusted for growth; under 1.5 is usually good") },
    { label: "ROE", value: roe !== null ? `${roe.toFixed(1)}%` : "—", hint: t(lang, "Retorno sobre el capital de los accionistas", "Return on shareholders' equity") },
    { label: t(lang, "Margen neto", "Net margin"), value: margin !== null ? `${margin.toFixed(1)}%` : "—", hint: t(lang, "Porcentaje de las ventas que se convierte en ganancia", "Percentage of sales that becomes profit") },
    { label: t(lang, "Deuda/Capital", "Debt/Equity"), value: debtEq !== null ? debtEq.toFixed(2) : "—", hint: t(lang, "Menos de 1 indica deuda manejable", "Under 1 indicates manageable debt") },
    { label: "RSI (14)", value: rsi !== null ? rsi.toFixed(0) : "—", hint: t(lang, "Más de 70 sobrecomprada, menos de 30 sobrevendida", "Above 70 is overbought, below 30 is oversold") },
    { label: "MACD", value: macd ? `${macd.histogram >= 0 ? "+" : ""}${macd.histogram.toFixed(2)}` : "—", hint: t(lang, "Impulso del precio: positivo es comprador, negativo es vendedor", "Price momentum: positive is buying pressure, negative is selling pressure") },
    { label: "Beta", value: num(row, "Beta") !== null ? num(row, "Beta")!.toFixed(2) : "—", hint: t(lang, "Volatilidad frente al mercado; 1 se mueve igual que el índice", "Volatility versus the market; 1 moves in line with the index") },
    { label: t(lang, "Rendimiento anual", "Yearly performance"), value: num(row, "Performance (Year)") !== null ? `${num(row, "Performance (Year)")!.toFixed(1)}%` : "—", hint: t(lang, "Variación del precio en los últimos 12 meses", "Price change over the last 12 months") },
    { label: t(lang, "Dividendo", "Dividend"), value: str(row, "Dividend Yield") ?? "—", hint: t(lang, "Rendimiento anual por dividendos", "Annual dividend yield") },
    { label: t(lang, "Volumen prom.", "Avg. volume"), value: num(row, "Average Volume") !== null ? `${(num(row, "Average Volume")! / 1000).toFixed(1)}M` : "—", hint: t(lang, "Acciones negociadas por día en promedio", "Average number of shares traded per day") },
    { label: t(lang, "Próx. resultados", "Next earnings"), value: nextEarningsDate ?? "—", hint: t(lang, "Fecha estimada del próximo reporte de ganancias", "Estimated date of the next earnings report") },
  ];

  return {
    ticker,
    companyName: row["Company"] ?? ticker,
    sector: row["Sector"] ?? "",
    industry: row["Industry"] ?? "",
    country: str(row, "Country"),
    price,
    changePercent: change,
    marketCap: fmtMarketCap(num(row, "Market Cap")),
    overallScore,
    overallVerdict,
    strategyMatch,
    summary,
    categories,
    keyMetrics,
    lastEarningsDate,
    nextEarningsDate,
    targetPrice: target,
    recommendation: recom,
    insiderTransPercent: num(row, "Insider Transactions"),
    insiderOwnPercent: num(row, "Insider Ownership"),
    analyzedAt: new Date().toISOString(),
  };
}

// ---------- sector performance (groups export) ----------

const GROUP_EXPORT_URL = "https://elite.finviz.com/grp_export.ashx";

export interface SectorPerf {
  name: string;
  changeToday: number;
  perfWeek: number;
  perfMonth: number;
  perfQuarter: number;
  perfYtd: number;
  stocks: number;
}

const SECTOR_LABELS_ES: Record<string, string> = {
  "Basic Materials": "Materiales básicos",
  "Communication Services": "Comunicaciones",
  "Consumer Cyclical": "Consumo cíclico",
  "Consumer Defensive": "Consumo básico",
  Energy: "Energía",
  Financial: "Financiero",
  Healthcare: "Salud",
  Industrials: "Industria",
  "Real Estate": "Bienes raíces",
  Technology: "Tecnología",
  Utilities: "Servicios públicos",
};

export function sectorLabel(name: string, lang: Lang): string {
  return lang === "es" ? (SECTOR_LABELS_ES[name] ?? name) : name;
}

function parseGroupCsv(text: string): FinvizRow[] {
  const clean = text.replace(/^\uFEFF/, "").trim();
  const lines = clean.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]!);
  // Guard against non-CSV 200 bodies (auth errors, HTML gateways)
  if (!headers.includes("Name")) {
    throw new Error(
      `Finviz devolvió una respuesta inesperada (no CSV): ${clean.slice(0, 120)}`,
    );
  }
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: FinvizRow = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? "";
    });
    return row;
  });
}

function pct(row: FinvizRow, key: string): number {
  const raw = row[key];
  if (!raw || raw === "-") return 0;
  const n = Number(raw.replace(/[%,]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Fetch per-sector performance. Combines the performance view (v=140) with
 *  the overview view (v=152, for the stock counts) in two requests. */
export async function fetchSectorPerformance(): Promise<SectorPerf[]> {
  const auth = process.env["FINVIZ_API_KEY"];
  if (!auth) {
    throw new Error("FINVIZ_API_KEY is not configured");
  }
  const get = async (view: number) => {
    const url = `${GROUP_EXPORT_URL}?g=sector&v=${view}&auth=${encodeURIComponent(auth)}`;
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      throw new Error(`Finviz respondió con estado ${res.status}`);
    }
    return parseGroupCsv(await res.text());
  };
  // Sequential to avoid Finviz burst rate limits
  const perf = await get(140);
  const overview = await get(152);
  const counts = new Map(
    overview.map((r) => [r["Name"] ?? "", Number(r["Stocks"] ?? 0) || 0]),
  );
  return perf
    .filter((r) => r["Name"])
    .map((r) => ({
      name: r["Name"]!,
      changeToday: pct(r, "Change"),
      perfWeek: pct(r, "Performance (Week)"),
      perfMonth: pct(r, "Performance (Month)"),
      perfQuarter: pct(r, "Performance (Quarter)"),
      perfYtd: pct(r, "Performance (Year To Date)"),
      stocks: counts.get(r["Name"]!) ?? 0,
    }));
}
