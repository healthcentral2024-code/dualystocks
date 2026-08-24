const TICKER_PATTERN = /^[A-Z0-9.\-]{1,10}$/;
const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_QUERY_LENGTH = 80;

type YahooSearchQuote = {
  symbol?: string;
  quoteType?: string;
  exchange?: string;
  shortname?: string;
  longname?: string;
};

type YahooSearchResponse = {
  quotes?: YahooSearchQuote[];
};

type CacheEntry = {
  ticker: string | null;
  expiresAt: number;
};

const lookupCache = new Map<string, CacheEntry>();
const pendingLookups = new Map<string, Promise<string | null>>();

const US_EQUITY_EXCHANGES = new Set([
  "NMS",
  "NGM",
  "NCM",
  "NYQ",
  "ASE",
  "PCX",
  "BTS",
]);

function normalizeName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function isValidTicker(value: string): boolean {
  return TICKER_PATTERN.test(value);
}

function isUsEquity(quote: YahooSearchQuote): quote is YahooSearchQuote & { symbol: string } {
  return (
    quote.quoteType === "EQUITY" &&
    typeof quote.symbol === "string" &&
    isValidTicker(quote.symbol.toUpperCase()) &&
    US_EQUITY_EXCHANGES.has(quote.exchange ?? "")
  );
}

function companyName(quote: YahooSearchQuote): string {
  return quote.longname ?? quote.shortname ?? "";
}

/**
 * Resolves either a market symbol (AAPL) or a company name (Apple) to the
 * symbol accepted by Finviz. Name lookups are cached to keep the search
 * provider from being queried once per chart/analysis request.
 */
export async function resolveStockTicker(input: string): Promise<string | null> {
  const decodedInput = (() => {
    try {
      return decodeURIComponent(input);
    } catch {
      return input;
    }
  })();
  const query = decodedInput.trim();
  if (!query || query.length > MAX_QUERY_LENGTH) return null;

  const upper = query.toUpperCase();
  const cacheKey = normalizeName(query);
  const cached = lookupCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.ticker;

  const pending = pendingLookups.get(cacheKey);
  if (pending) return pending;

  const lookup = (async (): Promise<string | null> => {
    try {
      const url = new URL("https://query1.finance.yahoo.com/v1/finance/search");
      url.searchParams.set("q", query);
      url.searchParams.set("quotesCount", "8");
      url.searchParams.set("newsCount", "0");

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "DualyStocks stock search",
        },
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) {
        throw new Error(`Stock name search returned ${response.status}`);
      }

      const payload = (await response.json()) as YahooSearchResponse;
      const candidates = (payload.quotes ?? []).filter(isUsEquity);
      const normalizedQuery = normalizeName(query);
      const ticker =
        candidates.find((quote) => quote.symbol.toUpperCase() === upper)?.symbol ??
        candidates.find((quote) => normalizeName(companyName(quote)) === normalizedQuery)
          ?.symbol ??
        candidates.find((quote) => normalizeName(companyName(quote)).startsWith(normalizedQuery))
          ?.symbol ??
        candidates[0]?.symbol ??
        (isValidTicker(upper) ? upper : null);

      lookupCache.set(cacheKey, { ticker, expiresAt: Date.now() + CACHE_TTL_MS });
      return ticker;
    } catch (error) {
      if (isValidTicker(upper)) {
        lookupCache.set(cacheKey, {
          ticker: upper,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
        return upper;
      }
      throw error;
    }
  })();

  pendingLookups.set(cacheKey, lookup);
  try {
    return await lookup;
  } finally {
    pendingLookups.delete(cacheKey);
  }
}