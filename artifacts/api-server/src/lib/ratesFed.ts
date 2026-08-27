import type { Lang } from "./finviz";

const TREASURY_PAGE =
  "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve";
const TREASURY_XML =
  "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_yield_curve";
const FED_CALENDAR = "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm";
const REQUEST_HEADERS = {
  "User-Agent": "DualyStocks/1.0 (https://www.dualystocks.com)",
};

interface TreasuryObservation {
  date: string;
  twoYear: number;
  tenYear: number;
}

export interface RatesAndFed {
  ratesDate: string;
  rates: Array<{ maturity: "2Y" | "10Y"; yield: number; changeBps: number }>;
  spreadBps: number;
  interpretation: string;
  upcomingMeetings: Array<{ decisionDate: string; hasPressConference: boolean }>;
  updatedAt: string;
  treasurySourceUrl: string;
  fedSourceUrl: string;
}

function property(xml: string, name: string): string | null {
  return xml.match(new RegExp(`<d:${name}[^>]*>([^<]+)</d:${name}>`))?.[1] ?? null;
}

function parseTreasury(xml: string): TreasuryObservation[] {
  return [...xml.matchAll(/<m:properties>([\s\S]*?)<\/m:properties>/g)]
    .map((match) => {
      const block = match[1] ?? "";
      const date = property(block, "NEW_DATE")?.slice(0, 10);
      const twoYear = Number(property(block, "BC_2YEAR"));
      const tenYear = Number(property(block, "BC_10YEAR"));
      return date && Number.isFinite(twoYear) && Number.isFinite(tenYear)
        ? { date, twoYear, tenYear }
        : null;
    })
    .filter((item): item is TreasuryObservation => item !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function parseMeetingsForYear(html: string, year: number) {
  const start = html.indexOf(`${year} FOMC Meetings`);
  if (start < 0) return [];
  const remaining = html.slice(start + 20);
  const nextHeadingOffset = remaining.search(/\d{4} FOMC Meetings/);
  const section = html.slice(
    start,
    nextHeadingOffset >= 0 ? start + 20 + nextHeadingOffset : undefined,
  );
  const meetings: Array<{ decisionDate: string; hasPressConference: boolean }> = [];
  const pattern =
    /fomc-meeting__month[^>]*><strong>([^<]+)<\/strong>[\s\S]*?fomc-meeting__date[^>]*>([^<]+)</g;
  for (const match of section.matchAll(pattern)) {
    const month = MONTHS[(match[1] ?? "").trim().toLowerCase()];
    const rawDays = (match[2] ?? "").replace(/&nbsp;/g, " ").trim();
    const days = [...rawDays.matchAll(/\d+/g)].map((value) => Number(value[0]));
    const day = days.at(-1);
    if (!month || !day) continue;
    meetings.push({
      decisionDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      hasPressConference: rawDays.includes("*"),
    });
  }
  return meetings;
}

function interpretation(lang: Lang, twoChange: number, tenChange: number): string {
  const strongest = Math.abs(tenChange) >= Math.abs(twoChange) ? tenChange : twoChange;
  if (strongest >= 3) {
    return lang === "es"
      ? "Los rendimientos subieron. Esto suele presionar a las acciones de crecimiento, aunque no determina por sí solo la dirección del mercado."
      : "Yields rose. This often pressures growth stocks, although it does not determine the market's direction by itself.";
  }
  if (strongest <= -3) {
    return lang === "es"
      ? "Los rendimientos bajaron. Esto suele aliviar presión sobre las acciones de crecimiento, aunque otros factores también mueven el mercado."
      : "Yields fell. This often eases pressure on growth stocks, although other factors also move the market.";
  }
  return lang === "es"
    ? "Los rendimientos cambiaron poco. Hoy las tasas no muestran una señal fuerte para las acciones."
    : "Yields changed little. Rates are not sending a strong signal for stocks today.";
}

async function fetchOfficialText(url: string, timeoutMs: number): Promise<string> {
  const response = await fetch(url, {
    headers: REQUEST_HEADERS,
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`Official source failed: ${response.status}`);
  return response.text();
}

export async function fetchRatesAndFed(lang: Lang): Promise<RatesAndFed> {
  const now = new Date();
  const year = now.getUTCFullYear();
  const currentMonth = `${year}${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const treasuryUrl = `${TREASURY_XML}&field_tdr_date_value_month=${currentMonth}`;
  const [treasuryXml, fedHtml] = await Promise.all([
    fetchOfficialText(treasuryUrl, 45_000),
    fetchOfficialText(FED_CALENDAR, 12_000),
  ]);
  let observations = parseTreasury(treasuryXml);
  if (observations.length < 2) {
    const previousMonthDate = new Date(Date.UTC(year, now.getUTCMonth() - 1, 1));
    const previousMonth = `${previousMonthDate.getUTCFullYear()}${String(previousMonthDate.getUTCMonth() + 1).padStart(2, "0")}`;
    const previousXml = await fetchOfficialText(
      `${TREASURY_XML}&field_tdr_date_value_month=${previousMonth}`,
      45_000,
    );
    observations = [...parseTreasury(previousXml), ...observations]
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  const latest = observations.at(-1);
  const previous = observations.at(-2);
  if (!latest || !previous) throw new Error("Treasury feed did not contain two observations");

  const today = now.toISOString().slice(0, 10);
  const upcomingMeetings = [
    ...parseMeetingsForYear(fedHtml, year),
    ...parseMeetingsForYear(fedHtml, year + 1),
  ].filter((meeting) => meeting.decisionDate >= today).slice(0, 3);

  const twoChange = Math.round((latest.twoYear - previous.twoYear) * 100);
  const tenChange = Math.round((latest.tenYear - previous.tenYear) * 100);
  return {
    ratesDate: latest.date,
    rates: [
      { maturity: "2Y", yield: latest.twoYear, changeBps: twoChange },
      { maturity: "10Y", yield: latest.tenYear, changeBps: tenChange },
    ],
    spreadBps: Math.round((latest.tenYear - latest.twoYear) * 100),
    interpretation: interpretation(lang, twoChange, tenChange),
    upcomingMeetings,
    updatedAt: now.toISOString(),
    treasurySourceUrl: TREASURY_PAGE,
    fedSourceUrl: FED_CALENDAR,
  };
}