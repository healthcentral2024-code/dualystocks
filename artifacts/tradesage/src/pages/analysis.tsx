import { HeaderChart } from "@/components/header-chart";
import { useParams, Link, useLocation } from "wouter";
import { useGetAnalysis, useGetChartAnalysis, useGetTrendAnalysis } from "@workspace/api-client-react";
import { getGetAnalysisQueryKey, getGetChartAnalysisQueryKey, getGetTrendAnalysisQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, Loader2, Info, TrendingDown, TrendingUp, AlertTriangle, Lightbulb, BarChart2, Activity, Users, Star, ChevronDown, ChevronUp, CalendarDays, Newspaper } from "lucide-react";
import { useState } from "react";
import { useFavorites, useToggleFavorite } from "@/hooks/use-favorites";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreCircle } from "@/components/score-circle";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AuthNav } from "@/components/auth-nav";
import { FinvizSeal } from "@/components/finviz-seal";
import { LanguageSelector } from "@/components/language-selector";
import { TradingChart } from "@/components/trading-chart";
import { useLanguage } from "@/lib/language";
import { getLeveragedInfo } from "@/lib/leveraged-etfs";
import { frameKey, trendKey } from "@/lib/translations";
import { TradeCalculator } from "@/components/trade-calculator";
import { formatCurrency, formatPercent, getScoreColors, cn } from "@/lib/utils";

function FavoriteButton({ ticker, showTicker = false }: { ticker: string; showTicker?: boolean }) {
  const { t } = useLanguage();
  const { data } = useFavorites();
  const toggle = useToggleFavorite();
  const saved = data?.favorites.some((f) => f.ticker === ticker.toUpperCase()) ?? false;
  return (
    <Button
      variant={saved ? "default" : "outline"}
      size="sm"
      disabled={toggle.isPending}
      onClick={() => toggle.mutate({ ticker: ticker.toUpperCase(), saved })}
      className={cn(
        "gap-2 font-bold rounded-md",
        saved
          ? "bg-amber-500 hover:bg-amber-600 text-white border-0"
          : "border-amber-400 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10",
      )}
      data-testid="button-favorite"
    >
      <Star className={cn("w-4 h-4", saved && "fill-current")} />
      {saved ? t("favRemove") : t("favAdd")}
      {/* On ETF pages, make explicit that the BASE stock is what gets saved */}
      {showTicker && <span className="font-mono">({ticker.toUpperCase()})</span>}
    </Button>
  );
}

function fmtUsd(n: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: n < 1 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtDays(n: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(n);
}

function formatEarningsDate(value: string | null | undefined, locale: string): string {
  if (!value) return "—";
  const calendarDate = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (!calendarDate) return "—";
  const date = new Date(`${calendarDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default function Analysis() {
  const { ticker } = useParams<{ ticker: string }>();
  const [, navigate] = useLocation();
  const [showDetails, setShowDetails] = useState(false);
  const { t, locale, lang } = useLanguage();

  // ×2 / inverse ETFs are not companies: analyze their base asset instead and
  // explain the product on top (e.g. AVL ×2 → analysis of AVGO).
  const leveraged = getLeveragedInfo(ticker);
  const baseTicker = leveraged?.base ?? ticker ?? "";

  const { data, isLoading, isError } = useGetAnalysis(baseTicker, { lang }, {
    query: {
      enabled: !!baseTicker,
      queryKey: getGetAnalysisQueryKey(baseTicker, { lang }),
      placeholderData: (previousData, previousQuery) =>
        previousQuery?.queryKey[0] === `/api/analysis/${baseTicker}`
          ? previousData
          : undefined,
      retry: false,
    }
  });

  const { data: trendData } = useGetTrendAnalysis(baseTicker, { lang }, {
    query: {
      enabled: !!baseTicker,
      queryKey: getGetTrendAnalysisQueryKey(baseTicker, { lang }),
      placeholderData: (previousData, previousQuery) =>
        previousQuery?.queryKey[0] === `/api/analysis/${baseTicker}/trend`
          ? previousData
          : undefined,
      retry: false,
    }
  });

  const { data: chartData, isLoading: isLoadingChart } = useGetChartAnalysis(baseTicker, { lang }, {
    query: {
      enabled: !!baseTicker,
      queryKey: getGetChartAnalysisQueryKey(baseTicker, { lang }),
      placeholderData: (previousData, previousQuery) =>
        previousQuery?.queryKey[0] === `/api/analysis/${baseTicker}/chart`
          ? previousData
          : undefined,
      retry: false,
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8 animate-pulse">
          <div className="relative w-28 h-28 mx-auto">
            <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin shadow-lg shadow-emerald-500/20"></div>
          </div>
          <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">{t("analysisLoadingTitle")} {ticker}...</h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
            {t("analysisLoadingDesc")}
          </p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-3xl mx-auto text-center space-y-8 animate-in fade-in zoom-in duration-500 bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="w-24 h-24 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-3xl mx-auto flex items-center justify-center rotate-12 shadow-inner">
            <AlertTriangle className="w-12 h-12 -rotate-12" />
          </div>
          <div>
            <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-4 tracking-tight">{t("analysisNotFoundTitle")}</h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">
              {t("analysisNotFoundDescBefore")}{ticker}{t("analysisNotFoundDescAfter")}
            </p>
          </div>
          <Link href="/">
            <Button size="lg" className="h-16 px-10 text-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-900/20 transition-all border border-emerald-500/50 mt-4">
              <ArrowLeft className="w-6 h-6 mr-2" />
              {t("analysisSearchOther")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // When the stock meets the user's strategy, the verdict hero goes green even
  // if the fundamental score is low — the strategy hunts beaten-down bargains.
  const overallColors = data.strategyMatch ? getScoreColors(85) : getScoreColors(data.overallScore);
  const isPositiveChange = data.changePercent >= 0;
  const isExchangeTradedFund = /\b(?:exchange traded fund|etf)\b/i.test(data.industry);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative">
      {/* Background grain */}
      <div className="fixed inset-0 pointer-events-none -z-50 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-[0.02] dark:opacity-10 mix-blend-multiply dark:mix-blend-screen" />

      {/* Navbar/Header */}
      <header className="sticky top-0 z-50 bg-slate-950 border-b border-slate-800 shadow-md relative overflow-hidden">
        <HeaderChart />
        <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between relative">
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 -ml-3 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              data-testid="button-back"
              onClick={() => {
                if (window.history.length > 1) window.history.back();
                else navigate("/");
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline font-bold">{t("analysisBack")}</span>
            </Button>
            <Link href="/ideas">
              <Button variant="ghost" size="sm" className="gap-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/30 transition-colors font-bold">
                <Lightbulb className="w-4 h-4" />
                <span className="hidden sm:inline">{t("analysisInvestmentIdeas")}</span>
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <img src="/logo.png" alt="DualyStocks" className="h-10 md:h-12 object-contain drop-shadow-[0_2px_8px_rgba(255,255,255,0.6)]" />
            <LanguageSelector />
            <AuthNav />
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-10 md:py-16 space-y-16">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-8 justify-between items-start md:items-end animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <Badge className="text-lg px-4 py-1 rounded-md bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 shadow-sm border-0 font-bold tracking-wide">{data.ticker}</Badge>
              {data.country && <Badge variant="outline" className="text-sm px-3 py-1 text-slate-600 border-slate-300 dark:text-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md shadow-sm font-semibold">{data.country}</Badge>}
              <FavoriteButton ticker={data.ticker} showTicker={!!leveraged} />
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-slate-900 dark:text-white mb-3 tracking-tight drop-shadow-sm">
              {data.companyName}
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 flex items-center gap-3 font-medium">
              <span className="bg-white border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 px-3 py-1 rounded-md text-sm">{data.sector}</span> 
              <span className="text-slate-300 dark:text-slate-700">•</span> 
              <span className="bg-white border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 px-3 py-1 rounded-md text-sm">{data.industry}</span>
            </p>
            <div className="mt-4">
              <FinvizSeal variant="inline" />
            </div>
          </div>
          <div className="flex w-full flex-col items-end gap-3 md:w-auto">
            {!isExchangeTradedFund && (
              <div className="flex max-w-full items-center justify-end gap-2 overflow-x-auto whitespace-nowrap pb-1">
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                  <strong>{t("lastEarningsDate")}:</strong>
                  {formatEarningsDate(data.lastEarningsDate, locale)}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  <CalendarDays className="h-3.5 w-3.5 text-emerald-500" />
                  <strong>{t("nextEarningsDate")}:</strong>
                  {formatEarningsDate(data.nextEarningsDate, locale)}
                </span>
              </div>
            )}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl min-w-[240px] shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-full blur-2xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-widest font-bold">{t("analysisCurrentPrice")}</p>
              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(data.price)}</span>
                <span className={cn(
                  "font-mono font-bold flex items-center gap-1 text-base px-2.5 py-1 rounded-lg border",
                  isPositiveChange ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800/50 dark:text-emerald-400 shadow-sm" : "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:border-rose-800/50 dark:text-rose-400 shadow-sm"
                )}>
                  {isPositiveChange ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  {formatPercent(data.changePercent)}
                </span>
              </div>
              {data.marketCap && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 font-medium">
                  {t("analysisMarketCap")} <span className="font-bold text-slate-900 dark:text-white">{data.marketCap}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Trade Calculator */}
        <TradeCalculator
          key={data.ticker}
          currentPrice={data.price} 
          analystTargetPrice={data.targetPrice} 
        />

        {/* ×2 / inverse ETF banner: explains the product and gives a derived reading */}
        {leveraged && (
          <section
            className="rounded-3xl border-2 border-violet-300 dark:border-violet-700/60 bg-violet-50/80 dark:bg-violet-950/30 p-6 md:p-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
            data-testid="banner-leveraged"
          >
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-violet-600 text-white border-0 font-bold uppercase tracking-wider text-[11px] px-3 py-1">
                {leveraged.direction === "bear"
                  ? (leveraged.factor === 2 ? t("levBadgeInverseX2") : t("levBadgeInverse"))
                  : t("levBadgeX2")}
              </Badge>
              <span className="font-mono font-bold text-lg text-slate-900 dark:text-white">{leveraged.ticker}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">({leveraged.label[lang]})</span>
            </div>
            <p className="text-base md:text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
              <span className="font-bold">{leveraged.ticker}</span>{" "}
              {leveraged.direction === "bear"
                ? (leveraged.factor === 2 ? t("levExplainInverseX2") : t("levExplainInverse"))
                : t("levExplainX2")}{" "}
              <span className="font-bold">{leveraged.base}</span>. {t("levShowingBase")}
            </p>
            {chartData?.technical && (() => {
              const tech = chartData.technical;
              const trendUp = tech.trend === "alcista";
              const trendDown = tech.trend === "bajista";
              const score = tech.buyScore ?? 50;
              let key: "good" | "mixed" | "bad";
              if (leveraged.direction === "bull") {
                key = trendUp && score >= 70 ? "good" : trendDown || score < 40 ? "bad" : "mixed";
              } else {
                key = trendDown ? "good" : trendUp && score >= 70 ? "bad" : "mixed";
              }
              const styles = {
                good: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200",
                mixed: "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/60 text-amber-900 dark:text-amber-200",
                bad: "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/60 text-rose-900 dark:text-rose-200",
              }[key];
              const textKey = (
                {
                  bull: { good: "levGoodBull", mixed: "levMixedBull", bad: "levBadBull" },
                  bear: { good: "levGoodBear", mixed: "levMixedBear", bad: "levBadBear" },
                } as const
              )[leveraged.direction][key];
              return (
                <div className={cn("rounded-2xl border p-4 md:p-5", styles)} data-testid="text-leveraged-reading">
                  <p className="font-bold mb-1">{t("levReadingTitle")}</p>
                  <p className="leading-relaxed">{t(textKey)}</p>
                </div>
              );
            })()}
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              {t("levRiskNote")}
            </p>
          </section>
        )}

        {/* Hero Veredicto Section */}
        <section className={cn(
          "rounded-[2rem] border-2 p-8 md:p-14 flex flex-col md:flex-row gap-10 items-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both shadow-2xl relative overflow-hidden",
          overallColors.bg,
          overallColors.border
        )}>
          {/* Subtle background glow based on score */}
          <div className={cn(
            "absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[100px] opacity-20 pointer-events-none translate-x-1/4 -translate-y-1/4",
            data.strategyMatch || data.overallScore >= 70 ? "bg-emerald-500" : data.overallScore >= 40 ? "bg-amber-500" : "bg-rose-500"
          )}></div>

          {/* Dot pattern texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.35] dark:opacity-[0.15]"
            style={{
              backgroundImage: "radial-gradient(currentColor 1.5px, transparent 1.5px)",
              backgroundSize: "22px 22px",
              color: "rgb(16 185 129 / 0.45)",
            }}
          ></div>

          {/* Big brand watermark logo */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt=""
              aria-hidden="true"
              className="w-[70%] max-w-[640px] opacity-[0.08] dark:opacity-[0.06] select-none"
              data-testid="img-verdict-watermark"
            />
          </div>

          <div className="shrink-0 flex flex-col items-center relative z-10 bg-white/30 dark:bg-slate-950/30 p-8 rounded-3xl backdrop-blur-sm border border-white/40 dark:border-white/10 shadow-lg">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 mb-6">{t("analysisGlobalScore")}</h2>
            <ScoreCircle score={data.overallScore} size="xl" className="shadow-xl bg-white dark:bg-slate-900" />
            {data.strategyMatch && (
              <p className="mt-4 text-xs font-semibold text-slate-600 dark:text-slate-300 text-center max-w-[180px] leading-snug">
                {t("analysisStrategyScoreNote")}
              </p>
            )}

          </div>
          
          <div className="flex-1 space-y-8 text-center md:text-left relative z-10">
            <div>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white mb-4 tracking-tight drop-shadow-sm">
                {data.overallVerdict}
              </h2>
              <p className="text-slate-700 dark:text-slate-300 font-medium text-lg">
                {t("analysisVerdictDateBefore")}{new Date(data.analyzedAt).toLocaleDateString(locale)}{t("analysisVerdictDateAfter")}
              </p>
            </div>
            
            <section
              data-testid="section-recent-news"
              className="rounded-3xl border border-sky-200 bg-sky-50/80 p-6 text-left shadow-lg backdrop-blur-sm dark:border-sky-900/60 dark:bg-sky-950/35"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl border border-sky-200 bg-sky-100 p-2 shadow-sm dark:border-sky-800/60 dark:bg-sky-900/50">
                  <Newspaper className="h-5 w-5 text-sky-700 dark:text-sky-300" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-sky-900 dark:text-sky-200">
                  {t("recentNewsTitle")}
                </h3>
              </div>
              {data.recentNews.length > 0 ? (
                <div className="space-y-3">
                  {data.recentNews.map((news) => {
                    const impact = news.impact ?? "neutral";
                    const impactLabel =
                      impact === "positive"
                        ? t("recentNewsImpactPositive")
                        : impact === "negative"
                          ? t("recentNewsImpactNegative")
                          : t("recentNewsImpactNeutral");
                    const impactStyles =
                      impact === "positive"
                        ? "border-emerald-200 bg-emerald-50/90 hover:bg-emerald-100/90 dark:border-emerald-800/70 dark:bg-emerald-950/45 dark:hover:bg-emerald-950/65"
                        : impact === "negative"
                          ? "border-rose-200 bg-rose-50/90 hover:bg-rose-100/90 dark:border-rose-800/70 dark:bg-rose-950/45 dark:hover:bg-rose-950/65"
                          : "border-slate-200 bg-slate-50/90 hover:bg-slate-100/90 dark:border-slate-700 dark:bg-slate-900/70 dark:hover:bg-slate-900";
                    const badgeStyles =
                      impact === "positive"
                        ? "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-200"
                        : impact === "negative"
                          ? "border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-700 dark:bg-rose-900/70 dark:text-rose-200"
                          : "border-slate-300 bg-slate-200 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200";

                    return (
                      <a
                        key={news.url}
                        href={news.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-impact={impact}
                        className={cn(
                          "block rounded-xl border px-4 py-3 transition-colors",
                          impactStyles,
                        )}
                      >
                        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                          <p className="min-w-0 flex-1 font-medium leading-snug text-slate-900 dark:text-slate-100">
                            {news.title}
                          </p>
                          <span
                            className={cn(
                              "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
                              badgeStyles,
                            )}
                          >
                            {impactLabel}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                          {news.impactReason || t("recentNewsImpactReasonUnavailable")}
                        </p>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                          {new Date(news.publishedAt).toLocaleDateString(locale)} ·{" "}
                          <span className="underline">{t("recentNewsReadMore")}</span>
                        </p>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {t("recentNewsEmpty")}
                </p>
              )}
              <p className="mt-4 border-t border-sky-200/80 pt-3 text-xs leading-relaxed text-sky-900/75 dark:border-sky-800/70 dark:text-sky-200/75">
                {t("recentNewsImpactDisclaimer")}
              </p>
            </section>

            <div className="bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm rounded-3xl p-8 border border-white/50 dark:border-white/10 shadow-lg">
              <h3 className="font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3 justify-center md:justify-start text-xl">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
                  <Info className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                {t("analysisKeyPoints")}
              </h3>
              <ul className="space-y-4 text-left">
                {data.summary.map((point, i) => (
                  <li key={i} className="flex gap-4 text-slate-800 dark:text-slate-200 text-lg font-medium leading-relaxed">
                    <span className="text-emerald-500 dark:text-emerald-400 mt-1.5 text-2xl leading-none">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Toggle: full analysis details */}
        <div className="flex justify-center -mt-6">
          <Button
            variant="outline"
            size="lg"
            data-testid="button-toggle-details"
            aria-expanded={showDetails}
            onClick={() => setShowDetails((v) => !v)}
            className="gap-2 h-14 px-8 text-base font-bold rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-md"
          >
            {showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            {showDetails ? t("analysisHideDetails") : t("analysisShowDetails")}
          </Button>
        </div>

        {/* Typical Move Section */}
        {showDetails && chartData?.swing && (
          <section
            className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150 fill-mode-both rounded-3xl border-2 border-amber-300/70 dark:border-amber-500/30 bg-gradient-to-br from-amber-50 via-white to-amber-50/60 dark:from-amber-950/40 dark:via-slate-900 dark:to-amber-950/20 p-6 md:p-8 shadow-lg space-y-6"
            data-testid="card-swing-stats"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 rounded-2xl shadow-sm border border-amber-200 dark:border-amber-800/50">
                <Activity className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-display font-bold text-slate-900 dark:text-white">{t("swingTitle")}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t("swingNote")}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([
                ["day", chartData.swing.avgDailyMove],
                ["week", chartData.swing.avgWeeklyMove],
                ["month", chartData.swing.avgMonthlyMove],
              ] as const).map(([period, value]) => (
                <div
                  key={period}
                  className="rounded-2xl bg-white/80 dark:bg-slate-950/50 border border-amber-200/80 dark:border-amber-800/40 px-5 py-4 text-center shadow-sm"
                  data-testid={`stat-swing-${period}`}
                >
                  <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-1">
                    {t(period === "day" ? "swingPerDay" : period === "week" ? "swingPerWeek" : "swingPerMonth")}
                  </p>
                  <p className="text-3xl font-display font-bold text-slate-900 dark:text-white">
                    ±{fmtUsd(value, locale)}
                  </p>
                  {data.price > 0 && (
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mt-1" data-testid={`stat-swing-${period}-pct`}>
                      ±{((value / data.price) * 100).toLocaleString(locale, { maximumFractionDigits: 1 })}% {t("swingPctOfPrice")}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span>
                  {t("swingUpBefore")}{fmtUsd(chartData.swing.avgUpMove, locale)}{t("swingUpMid")}{fmtDays(chartData.swing.avgUpDays, locale)}{t("swingDaysWord")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-rose-600 dark:text-rose-400">
                <TrendingDown className="w-4 h-4 shrink-0" />
                <span>
                  {t("swingDownBefore")}{fmtUsd(chartData.swing.avgDownMove, locale)}{t("swingUpMid")}{fmtDays(chartData.swing.avgDownDays, locale)}{t("swingDaysWord")}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Analyst Consensus Section */}
        {showDetails && (data.recommendation != null || data.targetPrice != null || data.insiderTransPercent != null) && (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-both">
            <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-5 flex items-center gap-4">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl shadow-sm border border-emerald-200 dark:border-emerald-800/50">
                <Users className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              {t("analysisAnalystOpinion")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Recomendación */}
              {data.recommendation != null && (() => {
                const r = data.recommendation;
                const good = r < 2, mid = r >= 2 && r <= 3;
                const label = good ? t("analysisRecomBuy") : mid ? t("analysisRecomNeutral") : t("analysisRecomNo");
                const color = good ? "text-emerald-700 dark:text-emerald-400" : mid ? "text-amber-700 dark:text-amber-400" : "text-rose-700 dark:text-rose-400";
                const bg = good ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50 shadow-sm" : mid ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50 shadow-sm" : "bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/50 shadow-sm";
                return (
                  <div className={cn("rounded-3xl border-2 p-8 relative overflow-hidden", bg)}>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">{t("analysisRecommendation")}</p>
                    <p className={cn("text-5xl font-mono font-bold mb-2 tracking-tighter", color)}>{r.toFixed(1)}</p>
                    <p className={cn("font-bold text-xl", color)}>{label}</p>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">{t("analysisRecomHint")}</p>
                  </div>
                );
              })()}
              {/* Precio objetivo */}
              {data.targetPrice != null && (() => {
                const upside = data.price > 0 ? ((data.targetPrice - data.price) / data.price) * 100 : null;
                const strong = upside != null && upside >= 50;
                const positive = upside != null && upside >= 0;
                const color = strong ? "text-emerald-700 dark:text-emerald-400" : positive ? "text-amber-700 dark:text-amber-400" : "text-rose-700 dark:text-rose-400";
                const bg = strong ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50 shadow-sm" : positive ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50 shadow-sm" : "bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/50 shadow-sm";
                return (
                  <div className={cn("rounded-3xl border-2 p-8 relative overflow-hidden", bg)}>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">{t("analysisTargetPrice")}</p>
                    <p className={cn("text-5xl font-mono font-bold mb-2 tracking-tighter", color)}>{formatCurrency(data.targetPrice)}</p>
                    {upside != null && (
                      <p className={cn("font-bold text-lg", color)}>
                        {upside >= 0 ? "+" : ""}{upside.toFixed(1)}% {t("analysisPotential")}{strong ? " 🔥" : ""}
                      </p>
                    )}
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">{t("analysisTargetHint")}</p>
                  </div>
                );
              })()}
              {/* Directivos */}
              {(() => {
                const it = data.insiderTransPercent;
                const io = data.insiderOwnPercent;
                if (it == null && io == null) return null;
                const buying = it != null && it > 0;
                const selling = it != null && it < 0;
                const color = buying ? "text-emerald-700 dark:text-emerald-400" : selling ? "text-rose-700 dark:text-rose-400" : "text-slate-600 dark:text-slate-400";
                const bg = buying ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50 shadow-sm" : selling ? "bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/50 shadow-sm" : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-sm";
                return (
                  <div className={cn("rounded-3xl border-2 p-8 relative overflow-hidden", bg)}>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">{t("analysisInsidersTitle")}</p>
                    <p className={cn("text-5xl font-mono font-bold mb-2 tracking-tighter", color)}>{it != null ? `${it > 0 ? "+" : ""}${it.toFixed(1)}%` : "—"}</p>
                    <p className={cn("font-bold text-xl", color)}>
                      {buying ? t("analysisInsidersBuying") : selling ? t("analysisInsidersSelling") : t("analysisInsidersNone")}
                    </p>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
                      {t("analysisInsidersHintBase")}{io != null ? `${t("analysisInsidersOwnBefore")}${io.toFixed(1)}${t("analysisInsidersOwnAfter")}` : ""}{t("analysisInsidersHintTail")}
                    </p>
                  </div>
                );
              })()}
            </div>
          </section>
        )}

        {/* Trend Analysis Section */}
        {showDetails && trendData && (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-250 fill-mode-both">
            <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-5 flex items-center gap-4">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl shadow-sm border border-emerald-200 dark:border-emerald-800/50">
                <Activity className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              {t("analysisTrendTitle")}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-5">
                {trendData.frames.map((f) => {
                  const up = f.trend === "alcista", down = f.trend === "bajista", noData = f.trend === "sin datos";
                  const color = up ? "text-emerald-700 dark:text-emerald-400" : down ? "text-rose-700 dark:text-rose-400" : noData ? "text-slate-500 dark:text-slate-400" : "text-amber-700 dark:text-amber-400";
                  const bg = up ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 shadow-sm" : down ? "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/50 shadow-sm" : noData ? "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-sm" : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 shadow-sm";
                  const tKey = trendKey(f.trend);
                  return (
                    <div key={f.frame} className={cn("rounded-3xl border-2 p-6 flex flex-col items-center text-center transition-all hover:scale-105", bg)}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">{t(frameKey(f.frame))}</p>
                      {up ? <TrendingUp className={cn("w-10 h-10 mb-3", color)} /> : down ? <TrendingDown className={cn("w-10 h-10 mb-3", color)} /> : <Activity className={cn("w-10 h-10 mb-3", color)} />}
                      <p className={cn("font-bold uppercase text-sm tracking-wide", color)}>{tKey ? t(tKey) : f.trend}</p>
                      {f.priceVsSma20Percent != null && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-mono font-bold">
                          {f.priceVsSma20Percent >= 0 ? "+" : ""}{f.priceVsSma20Percent.toFixed(1)}% {t("analysisVsSma20")}
                        </p>
                      )}
                    </div>
                  );
                })}
                <p className="col-span-2 md:col-span-4 text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
                  {t("analysisTrendPriority")}
                </p>
              </div>
              <div className={cn(
                "rounded-3xl border-2 p-8 shadow-xl flex flex-col relative overflow-hidden",
                trendData.signal.valid ? "bg-emerald-600 border-emerald-500 text-white" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              )}>
                {trendData.signal.valid && (
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                )}
                <p className={cn(
                  "text-xs font-bold uppercase tracking-widest mb-4",
                  trendData.signal.valid ? "text-emerald-100" : "text-slate-500 dark:text-slate-400"
                )}>{t("analysisStrategySignal")}</p>
                <p className={cn(
                  "font-display font-bold text-3xl leading-tight mb-5",
                  trendData.signal.valid ? "text-white" : "text-slate-900 dark:text-white"
                )}>
                  {trendData.signal.message}
                </p>
                {trendData.signal.lowToSma20Percent != null && (
                  <p className={cn(
                    "text-base mb-6 font-medium",
                    trendData.signal.valid ? "text-emerald-100" : "text-slate-600 dark:text-slate-400"
                  )}>
                    {t("analysisLowToSma20Before")}<span className={cn("font-mono font-bold", trendData.signal.valid ? "text-white" : "text-slate-900 dark:text-white")}>{trendData.signal.lowToSma20Percent.toFixed(1)}%</span>{t("analysisLowToSma20After")}
                  </p>
                )}
                <ul className="space-y-4 mt-auto relative z-10">
                  {trendData.signal.bullets.map((b, i) => (
                    <li key={i} className="flex gap-3 text-base">
                      <span className={cn(
                        "w-2 h-2 rounded-full shrink-0 mt-2",
                        trendData.signal.valid ? "bg-emerald-300" : "bg-emerald-500"
                      )} />
                      <span className={cn("leading-relaxed font-medium", trendData.signal.valid ? "text-emerald-50" : "text-slate-700 dark:text-slate-300")}>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Chart Section */}
        {chartData && (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300 fill-mode-both">
            <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-5 flex items-center gap-4">
              <div className="p-2.5 bg-slate-900 dark:bg-white/10 rounded-2xl shadow-sm border border-slate-800 dark:border-white/20">
                <BarChart2 className="w-7 h-7 text-emerald-400 dark:text-emerald-300" />
              </div>
              {t("analysisChartTitle")}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
                <TradingChart 
                  candles={chartData.candles} 
                  supportLevel={chartData.technical.supportLevel}
                  resistanceLevel={chartData.technical.resistanceLevel}
                />
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl flex flex-col relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex items-center gap-3 mb-8 relative z-10">
                  <Activity className="w-6 h-6 text-emerald-500" />
                  <h3 className="font-bold text-xl text-slate-900 dark:text-white">{t("analysisAlgoReading")}</h3>
                </div>
                
                <div className="flex flex-wrap items-center gap-6 mb-8 pb-8 border-b border-slate-200 dark:border-slate-800 relative z-10">
                  <div className="shrink-0 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 text-center">{t("analysisBuySuggestion")}</p>
                    <ScoreCircle score={chartData.technical.buyScore} size="lg" className="shadow-md bg-white dark:bg-slate-900" />
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <Badge variant={
                      chartData.technical.trend === 'alcista' ? 'default' :
                      chartData.technical.trend === 'bajista' ? 'destructive' : 'secondary'
                    } className={cn("mb-3 uppercase tracking-widest text-[10px] px-3 py-1 shadow-sm",
                      chartData.technical.trend === 'alcista' ? "bg-emerald-600 hover:bg-emerald-500 text-white" :
                      chartData.technical.trend === 'bajista' ? "bg-rose-600 hover:bg-rose-500 text-white" :
                      "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    )}>
                      {t("analysisTrendBadge")} {(() => { const k = trendKey(chartData.technical.trend); return k ? t(k) : chartData.technical.trend; })()}
                    </Badge>
                    <p className={cn("font-bold text-lg leading-snug", getScoreColors(chartData.technical.buyScore).text)}>
                      {chartData.technical.verdict}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8 text-sm relative z-10">
                  {chartData.technical.rsi !== null && chartData.technical.rsi !== undefined && (() => {
                    const rsi = chartData.technical.rsi;
                    const zone = rsi <= 30 ? "oversold" : rsi >= 70 ? "overbought" : "neutral";
                    const zoneStyles = {
                      oversold: {
                        card: "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50",
                        value: "text-emerald-700 dark:text-emerald-400",
                        badge: "bg-emerald-600 text-white",
                        label: t("rsiOversold"),
                        hint: t("rsiOversoldHint"),
                      },
                      neutral: {
                        card: "bg-slate-50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800/50",
                        value: "text-slate-900 dark:text-white",
                        badge: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                        label: t("rsiNeutral"),
                        hint: t("rsiNeutralHint"),
                      },
                      overbought: {
                        card: "bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50",
                        value: "text-rose-700 dark:text-rose-400",
                        badge: "bg-rose-600 text-white",
                        label: t("rsiOverbought"),
                        hint: t("rsiOverboughtHint"),
                      },
                    }[zone];
                    return (
                      <div className={cn("p-4 rounded-xl border", zoneStyles.card)} data-testid="card-rsi">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-widest">RSI</p>
                          <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", zoneStyles.badge)} data-testid="badge-rsi-zone">
                            {zoneStyles.label}
                          </span>
                        </div>
                        <p className={cn("font-mono font-bold text-lg", zoneStyles.value)}>{rsi.toFixed(1)}</p>
                        {/* Mini scale 0–100 with the current value marked */}
                        <div className="relative h-1.5 mt-2 rounded-full bg-gradient-to-r from-emerald-400 via-slate-300 dark:via-slate-600 to-rose-400">
                          <div
                            className="absolute -top-[3px] w-3 h-3 rounded-full bg-white dark:bg-slate-200 border-2 border-slate-700 dark:border-slate-300 shadow"
                            style={{ left: `calc(${Math.min(100, Math.max(0, rsi))}% - 6px)` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-snug">{zoneStyles.hint}</p>
                      </div>
                    );
                  })()}
                  {chartData.technical.supportLevel !== null && chartData.technical.supportLevel !== undefined && (
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
                      <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">{t("analysisSupport")}</p>
                      <p className="font-mono font-bold text-lg text-emerald-600 dark:text-emerald-400">{formatCurrency(chartData.technical.supportLevel)}</p>
                    </div>
                  )}
                  {chartData.technical.resistanceLevel !== null && chartData.technical.resistanceLevel !== undefined && (
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 col-span-2">
                      <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">{t("analysisResistance")}</p>
                      <p className="font-mono font-bold text-lg text-rose-600 dark:text-rose-400">{formatCurrency(chartData.technical.resistanceLevel)}</p>
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-inner relative z-10">
                  <ul className="space-y-4">
                    {chartData.technical.bullets.map((bullet, i) => (
                      <li key={i} className="flex gap-3 text-base text-slate-700 dark:text-slate-300 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-2" />
                        <span className="leading-relaxed">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Categories Grid */}
        {showDetails && (
        <section className="space-y-8">
          <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-5">{t("analysisBreakdown")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data.categories.map((category, idx) => {
              const catColors = getScoreColors(category.score);
              return (
                <Card 
                  key={category.key} 
                  className={cn(
                    "flex flex-col animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-500 overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl hover:-translate-y-1 transition-all",
                  )}
                  style={{ animationDelay: `${200 + (idx * 100)}ms` }}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800/50">
                    <div>
                      <CardTitle className="text-xl font-display font-bold tracking-tight">{category.label}</CardTitle>
                      {typeof category.weight === "number" && category.weight > 0 && (
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1" data-testid={`text-weight-${category.key}`}>
                          {t("analysisWeightLabel").replace("{pct}", String(category.weight))}
                        </p>
                      )}
                    </div>
                    <ScoreCircle score={category.score} size="sm" className="shadow-sm bg-white dark:bg-slate-900" />
                  </CardHeader>
                  <CardContent className="pt-6 pb-8 flex-1 flex flex-col">
                    <p className={cn("font-bold mb-6 text-xl", catColors.text)}>
                      {category.verdict}
                    </p>
                    {category.factors && category.factors.length > 0 && (
                      <div className="space-y-3 mb-6" data-testid={`factors-${category.key}`}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{t("analysisFactorsTitle")}</p>
                        {category.factors.map((f, i) => (
                          <div key={i}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="font-medium text-slate-600 dark:text-slate-400">{f.label}</span>
                              <span className="font-mono font-bold text-slate-900 dark:text-white">{f.value}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  f.score >= 65 ? "bg-emerald-500" : f.score >= 40 ? "bg-amber-400" : "bg-rose-500",
                                )}
                                style={{ width: `${Math.max(4, f.score)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <ul className="space-y-4 mt-auto text-base text-slate-600 dark:text-slate-400 font-medium">
                      {category.points.map((pt, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="shrink-0 mt-2 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                          <span className="leading-relaxed">{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
        )}

        {/* Metrics Table */}
        {showDetails && (
        <section className="space-y-8 pb-20">
          <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-5">{t("analysisKeyMetrics")}</h2>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[40%] font-bold text-slate-900 dark:text-white py-5 text-base tracking-wide">{t("analysisMetric")}</TableHead>
                  <TableHead className="w-[30%] font-bold text-slate-900 dark:text-white py-5 text-base tracking-wide">{t("analysisValue")}</TableHead>
                  <TableHead className="w-[30%] font-bold text-slate-900 dark:text-white py-5 text-base tracking-wide hidden sm:table-cell">{t("analysisContext")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.keyMetrics.map((metric, i) => (
                  <TableRow key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <TableCell className="font-bold text-slate-800 dark:text-slate-200 py-4">{metric.label}</TableCell>
                    <TableCell className="font-mono text-slate-900 dark:text-white font-bold py-4 text-lg">{metric.value}</TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400 font-medium hidden sm:table-cell py-4">
                      {metric.hint || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
        )}
      </main>
    </div>
  );
}
