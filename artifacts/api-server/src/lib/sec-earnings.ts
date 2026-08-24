const SEC_TICKERS_URL = "https://www.sec.gov/files/company_tickers.json";
const SEC_SUBMISSIONS_URL = "https://data.sec.gov/submissions";
const SEC_USER_AGENT = "DualyStocks costumer@dualystocks.com";
const REQUEST_TIMEOUT_MS = 8_000;
const TICKER_MAP_TTL_MS = 24 * 60 * 60 * 1000;
const EARNINGS_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

interface SecTickerEntry {
  cik_str?: number;
  ticker?: string;
}

interface SecRecentFilings {
  form?: string[];
  items?: string[];
  filingDate?: string[];
}

interface SecSubmissions {
  filings?: {
    recent?: SecRecentFilings;
  };
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

let tickerMapCache: CacheEntry<Map<string, number>> | null = null;
let tickerMapRequest: Promise<Map<string, number>> | null = null;
const earningsCache = new Map<string, CacheEntry<string | null>>();
const earningsRequests = new Map<string, Promise<string | null>>();

async function fetchSecJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "User-Agent": SEC_USER_AGENT,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`SEC request returned ${response.status}`);
  }

  return (await response.json()) as T;
}

async function getTickerMap(): Promise<Map<string, number>> {
  if (tickerMapCache && tickerMapCache.expiresAt > Date.now()) {
    return tickerMapCache.value;
  }
  if (tickerMapRequest) return tickerMapRequest;

  tickerMapRequest = (async () => {
    const payload = await fetchSecJson<Record<string, SecTickerEntry>>(SEC_TICKERS_URL);
    const tickerMap = new Map<string, number>();

    for (const entry of Object.values(payload)) {
      if (entry.ticker && Number.isInteger(entry.cik_str)) {
        tickerMap.set(entry.ticker.toUpperCase(), entry.cik_str!);
      }
    }

    tickerMapCache = {
      value: tickerMap,
      expiresAt: Date.now() + TICKER_MAP_TTL_MS,
    };
    return tickerMap;
  })();

  try {
    return await tickerMapRequest;
  } finally {
    tickerMapRequest = null;
  }
}

function findLatestEarningsDate(recent: SecRecentFilings | undefined): string | null {
  const forms = recent?.form ?? [];
  const items = recent?.items ?? [];
  const filingDates = recent?.filingDate ?? [];

  for (let index = 0; index < forms.length; index += 1) {
    const form = forms[index];
    const filingItems = String(items[index] ?? "")
      .split(",")
      .map((item) => item.trim());
    const filingDate = filingDates[index];

    if (
      (form === "8-K" || form === "8-K/A") &&
      filingItems.includes("2.02") &&
      /^\d{4}-\d{2}-\d{2}$/.test(filingDate ?? "")
    ) {
      return filingDate!;
    }
  }

  return null;
}

export async function getLastEarningsDate(ticker: string): Promise<string | null> {
  const normalizedTicker = ticker.toUpperCase();
  const cached = earningsCache.get(normalizedTicker);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const pending = earningsRequests.get(normalizedTicker);
  if (pending) return pending;

  const request = (async () => {
    const tickerMap = await getTickerMap();
    const cik = tickerMap.get(normalizedTicker);
    if (!cik) return null;

    const paddedCik = String(cik).padStart(10, "0");
    const submissions = await fetchSecJson<SecSubmissions>(
      `${SEC_SUBMISSIONS_URL}/CIK${paddedCik}.json`,
    );
    const date = findLatestEarningsDate(submissions.filings?.recent);
    earningsCache.set(normalizedTicker, {
      value: date,
      expiresAt: Date.now() + EARNINGS_CACHE_TTL_MS,
    });
    return date;
  })();

  earningsRequests.set(normalizedTicker, request);
  try {
    return await request;
  } finally {
    earningsRequests.delete(normalizedTicker);
  }
}