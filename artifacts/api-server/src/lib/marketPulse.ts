// "Market pulse": plain-language explanation of what is moving the overall
// market today. Combines Finviz sector performance (change today) with the
// general market news feed, summarized for novice investors by a small LLM.

import { openai } from "@workspace/integrations-openai-ai-server";
import { fetchSectorPerformance, sectorLabel, type Lang } from "./finviz";

const NEWS_EXPORT_URL = "https://elite.finviz.com/news_export.ashx";
const MAX_HEADLINES = 25;
const MAX_AGE_HOURS = 30;

export interface MarketPulse {
  summary: string;
  mood: "up" | "down" | "mixed";
  sectors: { name: string; label: string; changeToday: number }[];
  topNews: { title: string; url: string }[];
  updatedAt: string;
}

interface NewsItem {
  title: string;
  url: string;
  publishedAt: Date;
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

function isSafeHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** General (no ticker) market news from the Finviz Elite news export. */
async function fetchMarketNews(): Promise<NewsItem[]> {
  const key = process.env["FINVIZ_API_KEY"];
  if (!key) throw new Error("FINVIZ_API_KEY is not configured");
  const url = `${NEWS_EXPORT_URL}?v=3&auth=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Finviz news export failed: ${res.status}`);
  const text = (await res.text()).replace(/^\uFEFF/, "").trim();
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]!);
  if (!headers.includes("Title")) {
    throw new Error(`Finviz news export returned non-CSV: ${text.slice(0, 120)}`);
  }
  const iTitle = headers.indexOf("Title");
  const iDate = headers.indexOf("Date");
  const iUrl = headers.indexOf("Url");
  const cutoff = Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000;
  const items: NewsItem[] = [];
  for (const line of lines.slice(1)) {
    const v = parseCsvLine(line);
    const title = v[iTitle]?.trim();
    const rawDate = v[iDate]?.trim();
    const link = v[iUrl]?.trim();
    if (!title || !rawDate || !link) continue;
    if (!isSafeHttpUrl(link)) continue;
    const publishedAt = new Date(rawDate.replace(" ", "T"));
    if (Number.isNaN(publishedAt.getTime()) || publishedAt.getTime() < cutoff) continue;
    items.push({ title, url: link, publishedAt });
    if (items.length >= MAX_HEADLINES) break;
  }
  return items;
}

function moodFromSectors(sectors: { changeToday: number }[]): "up" | "down" | "mixed" {
  if (sectors.length === 0) return "mixed";
  const up = sectors.filter((s) => s.changeToday > 0.05).length;
  const down = sectors.filter((s) => s.changeToday < -0.05).length;
  if (up >= sectors.length * 0.7) return "up";
  if (down >= sectors.length * 0.7) return "down";
  return "mixed";
}

async function summarize(
  sectors: { name: string; changeToday: number }[],
  news: NewsItem[],
  mood: "up" | "down" | "mixed",
  lang: Lang,
): Promise<{ summary: string; newsIndexes: number[] }> {
  const language = lang === "en" ? "English" : "Spanish";
  const sectorLines = sectors
    .map((s) => `${s.name}: ${s.changeToday > 0 ? "+" : ""}${s.changeToday.toFixed(2)}%`)
    .join("\n");
  const newsLines = news.map((n, i) => `${i + 1}. ${n.title}`).join("\n");
  const response = await openai.chat.completions.create(
    {
      model: "gpt-5-mini",
      max_completion_tokens: 8192,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            `You explain the stock market to complete beginners in plain ${language}. ` +
            `Given today's per-sector performance and recent market headlines, write 2-3 short sentences answering: what is the market doing today, and WHY (which event or news is behind the move, if the headlines make it clear). ` +
            `Mention the most affected sectors in everyday words. If no clear cause appears in the headlines, say the move has no single clear cause — never invent one. ` +
            `Calm, educational tone: red days are normal, this is information, not advice to buy or sell. No jargon, no tickers. ` +
            `Respond with JSON: {"summary": "<the 2-3 sentences in ${language}>", "newsIndexes": [<up to 3 1-based indexes of the headlines that best explain today's move, or [] if none>]}`,
        },
        {
          role: "user",
          content: `Overall direction: ${mood}\nSector change today:\n${sectorLines}\n\nRecent market headlines:\n${newsLines || "(none)"}`,
        },
      ],
    },
    { signal: AbortSignal.timeout(20_000) },
  );
  const raw = response.choices[0]?.message?.content ?? "";
  const parsed = JSON.parse(raw) as { summary?: string; newsIndexes?: number[] };
  const summary = (parsed.summary ?? "").trim();
  if (!summary) throw new Error("Empty market pulse summary");
  const newsIndexes = Array.isArray(parsed.newsIndexes)
    ? parsed.newsIndexes
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= news.length)
        .slice(0, 3)
    : [];
  return { summary, newsIndexes };
}

/** Deterministic summary used when the LLM is unavailable: the section still
 *  shows today's sector moves, just without the news explanation. */
function fallbackSummary(
  sectors: { label: string; changeToday: number }[],
  mood: "up" | "down" | "mixed",
  lang: Lang,
): string {
  const best = sectors[0];
  const worst = sectors[sectors.length - 1];
  const fmt = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
  if (lang === "en") {
    const dir =
      mood === "up" ? "Most sectors are up today" : mood === "down" ? "Most sectors are down today" : "The market is mixed today";
    return `${dir}. Strongest: ${best?.label} (${fmt(best?.changeToday ?? 0)}); weakest: ${worst?.label} (${fmt(worst?.changeToday ?? 0)}). Red days are normal — this is information, not advice.`;
  }
  const dir =
    mood === "up"
      ? "Hoy sube la mayoría de los sectores"
      : mood === "down"
        ? "Hoy baja la mayoría de los sectores"
        : "Hoy el mercado está mixto";
  return `${dir}. El más fuerte: ${best?.label} (${fmt(best?.changeToday ?? 0)}); el más débil: ${worst?.label} (${fmt(worst?.changeToday ?? 0)}). Los días rojos son normales: esto es información, no un consejo.`;
}

export interface MarketPulseBuild {
  pulse: MarketPulse;
  /** True when the LLM summary failed and the deterministic fallback was used. */
  degraded: boolean;
}

export async function buildMarketPulse(lang: Lang): Promise<MarketPulseBuild> {
  const sectorsRaw = await fetchSectorPerformance();
  if (sectorsRaw.length === 0) {
    throw new Error("Finviz devolvió una lista de sectores vacía");
  }
  const sectors = [...sectorsRaw]
    .sort((a, b) => b.changeToday - a.changeToday)
    .map((s) => ({
      name: s.name,
      label: sectorLabel(s.name, lang),
      changeToday: s.changeToday,
    }));
  const mood = moodFromSectors(sectors);

  // News is best-effort: if the feed fails we still show sector data with a
  // summary generated from sectors alone.
  let news: NewsItem[] = [];
  try {
    news = await fetchMarketNews();
  } catch {
    news = [];
  }

  let summary: string;
  let newsIndexes: number[] = [];
  let degraded = false;
  try {
    ({ summary, newsIndexes } = await summarize(sectors, news, mood, lang));
  } catch {
    summary = fallbackSummary(sectors, mood, lang);
    degraded = true;
  }
  const topNews = newsIndexes
    .map((i) => news[i - 1])
    .filter((n): n is NewsItem => Boolean(n))
    .map((n) => ({ title: n.title, url: n.url }));

  return {
    pulse: {
      summary,
      mood,
      sectors,
      topNews,
      updatedAt: new Date().toISOString(),
    },
    degraded,
  };
}
