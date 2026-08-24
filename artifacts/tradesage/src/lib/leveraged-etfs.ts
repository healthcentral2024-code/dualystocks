/**
 * Catalog of leveraged (×2) and inverse ETFs shown in the reference lists.
 * Each entry maps the ETF ticker to its underlying ("base") asset, so the
 * analysis page can explain the product and analyze the base instead of
 * treating the ETF like a company.
 */

export interface TickerItem {
  ticker: string;
  label: { es: string; en: string };
  /** Underlying/base asset ticker shown first (e.g. TSLA for TSLL) */
  base?: string;
}

export interface TickerGroup {
  title: { es: string; en: string };
  items: TickerItem[];
}

export const DOUBLES: TickerGroup[] = [
  {
    title: { es: "De índices", en: "Index-based" },
    items: [
      { ticker: "SSO", base: "SPY", label: { es: "SSO ×2 (S&P 500)", en: "SSO ×2 (S&P 500)" } },
      { ticker: "QLD", base: "QQQ", label: { es: "QLD ×2 (Nasdaq 100)", en: "QLD ×2 (Nasdaq 100)" } },
      { ticker: "DDM", base: "DIA", label: { es: "DDM ×2 (Dow Jones)", en: "DDM ×2 (Dow Jones)" } },
      { ticker: "UWM", base: "IWM", label: { es: "UWM ×2 (Russell 2000)", en: "UWM ×2 (Russell 2000)" } },
    ],
  },
  {
    title: { es: "De acciones individuales", en: "Single-stock" },
    items: [
      { ticker: "NVDU", base: "NVDA", label: { es: "NVDU ×2 (también NVDL)", en: "NVDU ×2 (also NVDL)" } },
      { ticker: "TSLL", base: "TSLA", label: { es: "TSLL ×2", en: "TSLL ×2" } },
      { ticker: "AAPU", base: "AAPL", label: { es: "AAPU ×2", en: "AAPU ×2" } },
      { ticker: "MSFU", base: "MSFT", label: { es: "MSFU ×2", en: "MSFU ×2" } },
      { ticker: "METU", base: "META", label: { es: "METU ×2", en: "METU ×2" } },
      { ticker: "AMZU", base: "AMZN", label: { es: "AMZU ×2", en: "AMZU ×2" } },
      { ticker: "GGLL", base: "GOOGL", label: { es: "GGLL ×2", en: "GGLL ×2" } },
      { ticker: "AMUU", base: "AMD", label: { es: "AMUU ×2", en: "AMUU ×2" } },
      { ticker: "MUU", base: "MU", label: { es: "MUU ×2", en: "MUU ×2" } },
      { ticker: "AVL", base: "AVGO", label: { es: "AVL ×2", en: "AVL ×2" } },
      { ticker: "TSMX", base: "TSM", label: { es: "TSMX ×2", en: "TSMX ×2" } },
      { ticker: "QCMU", base: "QCOM", label: { es: "QCMU ×2", en: "QCMU ×2" } },
      { ticker: "PLTU", base: "PLTR", label: { es: "PLTU ×2", en: "PLTU ×2" } },
      { ticker: "NFXL", base: "NFLX", label: { es: "NFXL ×2", en: "NFXL ×2" } },
      { ticker: "CONX", base: "COIN", label: { es: "CONX ×2", en: "CONX ×2" } },
      { ticker: "HODU", base: "HOOD", label: { es: "HODU ×2", en: "HODU ×2" } },
      { ticker: "BRKU", base: "BRK.B", label: { es: "BRKU ×2 (Berkshire)", en: "BRKU ×2 (Berkshire)" } },
      { ticker: "XOMX", base: "XOM", label: { es: "XOMX ×2", en: "XOMX ×2" } },
      { ticker: "ELIL", base: "LLY", label: { es: "ELIL ×2 (Eli Lilly)", en: "ELIL ×2 (Eli Lilly)" } },
    ],
  },
];

export const INVERSES: TickerGroup[] = [
  {
    title: {
      es: "De los índices ×1 (suben cuando el mercado baja)",
      en: "Index ×1 (rise when the market falls)",
    },
    items: [
      { ticker: "SH", base: "SPY", label: { es: "SH inverso (S&P 500)", en: "SH inverse (S&P 500)" } },
      { ticker: "PSQ", base: "QQQ", label: { es: "PSQ inverso (Nasdaq 100)", en: "PSQ inverse (Nasdaq 100)" } },
      { ticker: "DOG", base: "DIA", label: { es: "DOG inverso (Dow Jones)", en: "DOG inverse (Dow Jones)" } },
      { ticker: "RWM", base: "IWM", label: { es: "RWM inverso (Russell 2000)", en: "RWM inverse (Russell 2000)" } },
    ],
  },
  {
    title: {
      es: "De los índices ×2 (suben el doble cuando el mercado baja)",
      en: "Index ×2 (rise double when the market falls)",
    },
    items: [
      { ticker: "SDS", base: "SPY", label: { es: "SDS inverso ×2", en: "SDS inverse ×2" } },
      { ticker: "QID", base: "QQQ", label: { es: "QID inverso ×2", en: "QID inverse ×2" } },
      { ticker: "DXD", base: "DIA", label: { es: "DXD inverso ×2", en: "DXD inverse ×2" } },
      { ticker: "TWM", base: "IWM", label: { es: "TWM inverso ×2", en: "TWM inverse ×2" } },
    ],
  },
  {
    title: {
      es: "De acciones individuales ×1 (suben cuando la acción baja)",
      en: "Single-stock ×1 (rise when the stock falls)",
    },
    items: [
      { ticker: "AAPD", base: "AAPL", label: { es: "AAPD inverso (Apple)", en: "AAPD inverse (Apple)" } },
      { ticker: "MSFD", base: "MSFT", label: { es: "MSFD inverso (Microsoft)", en: "MSFD inverse (Microsoft)" } },
      { ticker: "GGLS", base: "GOOGL", label: { es: "GGLS inverso (Google)", en: "GGLS inverse (Google)" } },
      { ticker: "AMZD", base: "AMZN", label: { es: "AMZD inverso (Amazon)", en: "AMZD inverse (Amazon)" } },
      { ticker: "NVDD", base: "NVDA", label: { es: "NVDD inverso (Nvidia)", en: "NVDD inverse (Nvidia)" } },
      { ticker: "METD", base: "META", label: { es: "METD inverso (Meta)", en: "METD inverse (Meta)" } },
      { ticker: "TSLS", base: "TSLA", label: { es: "TSLS inverso (Tesla)", en: "TSLS inverse (Tesla)" } },
      { ticker: "AMDD", base: "AMD", label: { es: "AMDD inverso", en: "AMDD inverse" } },
      { ticker: "MUD", base: "MU", label: { es: "MUD inverso (Micron)", en: "MUD inverse (Micron)" } },
      { ticker: "AVS", base: "AVGO", label: { es: "AVS inverso (Broadcom)", en: "AVS inverse (Broadcom)" } },
      { ticker: "QCMD", base: "QCOM", label: { es: "QCMD inverso (Qualcomm)", en: "QCMD inverse (Qualcomm)" } },
      { ticker: "TSMZ", base: "TSM", label: { es: "TSMZ inverso (TSMC)", en: "TSMZ inverse (TSMC)" } },
      { ticker: "PLTD", base: "PLTR", label: { es: "PLTD inverso (Palantir)", en: "PLTD inverse (Palantir)" } },
      { ticker: "NFXS", base: "NFLX", label: { es: "NFXS inverso (Netflix)", en: "NFXS inverse (Netflix)" } },
      { ticker: "PALD", base: "PANW", label: { es: "PALD inverso (Palo Alto)", en: "PALD inverse (Palo Alto)" } },
      { ticker: "ORCS", base: "ORCL", label: { es: "ORCS inverso (Oracle)", en: "ORCS inverse (Oracle)" } },
      { ticker: "CSCS", base: "CSCO", label: { es: "CSCS inverso (Cisco)", en: "CSCS inverse (Cisco)" } },
    ],
  },
];

export interface LeveragedInfo {
  /** ETF ticker, e.g. AVL */
  ticker: string;
  /** Underlying asset ticker, e.g. AVGO */
  base: string;
  /** Daily multiplier: 1 or 2 */
  factor: 1 | 2;
  /** bull = moves with the base; bear = moves against it (inverse) */
  direction: "bull" | "bear";
  label: { es: string; en: string };
}

function buildMap(): Record<string, LeveragedInfo> {
  const map: Record<string, LeveragedInfo> = {};
  for (const group of DOUBLES) {
    for (const item of group.items) {
      if (!item.base) continue;
      map[item.ticker] = { ticker: item.ticker, base: item.base, factor: 2, direction: "bull", label: item.label };
    }
  }
  for (const group of INVERSES) {
    const isX2 = group.title.es.includes("×2");
    for (const item of group.items) {
      if (!item.base) continue;
      map[item.ticker] = { ticker: item.ticker, base: item.base, factor: isX2 ? 2 : 1, direction: "bear", label: item.label };
    }
  }
  return map;
}

const LEVERAGED_ETFS = buildMap();

// Aliases advertised in the list labels but not shown as their own rows.
LEVERAGED_ETFS["NVDL"] = { ticker: "NVDL", base: "NVDA", factor: 2, direction: "bull", label: { es: "NVDL ×2", en: "NVDL ×2" } };

/** Returns info if the ticker is a known ×2 / inverse ETF, else undefined. */
export function getLeveragedInfo(ticker: string | undefined): LeveragedInfo | undefined {
  if (!ticker) return undefined;
  return LEVERAGED_ETFS[ticker.toUpperCase()];
}
