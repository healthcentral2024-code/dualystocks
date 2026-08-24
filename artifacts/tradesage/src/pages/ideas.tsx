import { HeaderChart } from "@/components/header-chart";
import { useState } from "react";
import { Link } from "wouter";
import { useGetScreener, getGetScreenerQueryKey, useGetSectorTrend, getGetSectorTrendQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthNav } from "@/components/auth-nav";
import { FinvizSeal } from "@/components/finviz-seal";
import { TopPicksSection } from "@/components/top-picks-section";
import { LanguageSelector } from "@/components/language-selector";
import { useLanguage } from "@/lib/language";
import type { TranslationKey } from "@/lib/translations";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { ArrowLeft, BarChart3, Check, ChevronRight, Lightbulb, TrendingUp, TrendingDown, Target, Shield, Percent, Filter, X, Star } from "lucide-react";

type Preset = 'valor' | 'dividendos' | 'oportunidades' | 'estrategia';

// "Mi Estrategia": cap > $500M, países abiertos, potencial al objetivo +50%
const STRATEGY_FILTERS = { cap: "over500", country: "all", targetUpside: "a50" } as const;

function getRecomKey(val: number): TranslationKey {
  if (val <= 1.5) return "recomStrongBuy";
  if (val <= 2.5) return "recomBuy";
  if (val <= 3.5) return "recomHold";
  return "recomSell";
}

export default function Ideas() {
  const { t, lang } = useLanguage();
  const [initialPreset] = useState<Preset>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("preset");
      if (p === "valor" || p === "dividendos" || p === "oportunidades" || p === "estrategia") return p;
    }
    return 'valor';
  });
  const [activeTab, setActiveTab] = useState<Preset>(initialPreset);
  const [filters, setFilters] = useState({
    index: "all",
    exchange: "all",
    cap: "all",
    country: "all",
    price: "all",
    recom: "all",
    insider: "all",
    insiderOwn: "all",
    targetUpside: "all",
    optionable: "all",
    ...(initialPreset === 'estrategia' ? STRATEGY_FILTERS : null),
  });

  const queryParams: any = { preset: activeTab, lang };
  if (filters.index !== "all") queryParams.index = filters.index;
  if (filters.exchange !== "all") queryParams.exchange = filters.exchange;
  if (filters.price !== "all") queryParams.price = filters.price;
  if (filters.recom !== "all") queryParams.recom = filters.recom;
  if (filters.insider !== "all") queryParams.insider = filters.insider;
  if (filters.insiderOwn !== "all") queryParams.insiderOwn = filters.insiderOwn;
  if (filters.optionable !== "all") queryParams.optionable = filters.optionable;
  // En "Mi Estrategia" los tres selects son la fuente de verdad: se envían
  // siempre (incluido "all", que quita explícitamente el criterio del preset).
  const strategyTab = activeTab === 'estrategia';
  if (strategyTab || filters.cap !== "all") queryParams.cap = filters.cap;
  if (strategyTab || filters.country !== "all") queryParams.country = filters.country;
  if (strategyTab || filters.targetUpside !== "all") queryParams.targetUpside = filters.targetUpside;

  const { data, isLoading, isError, refetch, isRefetching } = useGetScreener(
    queryParams,
    {
      query: {
        queryKey: getGetScreenerQueryKey(queryParams),
        placeholderData: (previousData, previousQuery) => {
          const previousParams = previousQuery?.queryKey[1];
          if (
            !previousParams ||
            typeof previousParams !== "object" ||
            Array.isArray(previousParams)
          ) {
            return undefined;
          }
          const { lang: _previousLang, ...previousFilters } = previousParams as Record<string, unknown>;
          const { lang: _currentLang, ...currentFilters } = queryParams as Record<string, unknown>;
          return JSON.stringify(previousFilters) === JSON.stringify(currentFilters)
            ? previousData
            : undefined;
        },
      }
    }
  );

  const sectorParams = { lang } as const;
  const { data: sectorData, isLoading: sectorsLoading } = useGetSectorTrend(
    sectorParams,
    {
      query: {
        queryKey: getGetSectorTrendQueryKey(sectorParams),
        placeholderData: (previousData) => previousData,
      },
    },
  );

  const activeFiltersCount = Object.values(filters).filter(v => v !== "all").length;

  const clearFilters = () => setFilters({
    index: "all",
    exchange: "all",
    cap: "all",
    country: "all",
    price: "all",
    recom: "all",
    insider: "all",
    insiderOwn: "all",
    targetUpside: "all",
    optionable: "all",
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative">
      {/* Background treatment */}
      <div className="fixed inset-0 pointer-events-none -z-50 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-[0.03] dark:opacity-10 mix-blend-multiply dark:mix-blend-screen" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950 border-b border-slate-800 shadow-sm relative overflow-hidden">
        <HeaderChart />
        <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between relative">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 -ml-3 text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">{t("ideasBack")}</span>
            </Button>
          </Link>
          <div className="flex items-center gap-4 md:gap-6">
            <img src="/logo.png" alt="DualyStocks" className="h-10 md:h-12 object-contain drop-shadow-[0_2px_8px_rgba(255,255,255,0.6)]" />
            <LanguageSelector />
            <AuthNav />
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-10 md:py-16 space-y-10">
        <div className="relative overflow-hidden rounded-3xl p-8 md:p-16 mb-12 text-center animate-in slide-in-from-bottom-4 duration-500 border border-slate-800 shadow-2xl bg-slate-950">
          <div className="absolute inset-0 bg-[url('/ai-bg.jpg')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/80 via-slate-950/90 to-slate-950"></div>
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-5">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 mb-3 border border-emerald-500/30 shadow-inner shadow-emerald-500/20">
              <Lightbulb className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white drop-shadow-sm tracking-tight">
              {t("ideasTitle")}
            </h1>
            <p className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed">
              {t("ideasSubtitle")}
            </p>
            <div className="flex justify-center pt-1">
              <FinvizSeal variant="inline-dark" />
            </div>
          </div>
        </div>

        {/* Las 3 de hoy */}
        <TopPicksSection />

        {/* Sectores en tendencia */}
        <section
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm"
          data-testid="card-sector-trend"
        >
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">{t("sectorTrendTitle")}</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{t("sectorTrendSubtitle")}</p>
          {sectorsLoading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          ) : sectorData ? (
            <>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-4" data-testid="text-sector-message">
                {sectorData.message}
              </p>
              <div className="overflow-x-auto -mx-2 px-2">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="text-left text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2 pr-3">{t("sectorColName")}</th>
                      <th className="py-2 px-3 text-right">{t("sectorColToday")}</th>
                      <th className="py-2 px-3 text-right">{t("sectorColWeek")}</th>
                      <th className="py-2 px-3 text-right">{t("sectorColMonth")}</th>
                      <th className="py-2 px-3 text-right hidden sm:table-cell">{t("sectorColQuarter")}</th>
                      <th className="py-2 pl-3 text-right hidden md:table-cell">{t("sectorColYtd")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectorData.sectors.map((s, idx) => {
                      const cell = (v: number, extra?: string) => (
                        <td className={cn("py-2.5 px-3 text-right font-mono font-semibold", extra,
                          v >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                          {formatPercent(v)}
                        </td>
                      );
                      return (
                        <tr key={s.name} className="border-b border-slate-100 dark:border-slate-800/60 last:border-0" data-testid={`row-sector-${idx}`}>
                          <td className="py-2.5 pr-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {idx < 3 && s.perfMonth > 0 && (
                              <TrendingUp className="w-3.5 h-3.5 inline-block mr-1.5 text-emerald-500 align-[-2px]" />
                            )}
                            {s.label}
                          </td>
                          {cell(s.changeToday)}
                          {cell(s.perfWeek)}
                          {cell(s.perfMonth)}
                          {cell(s.perfQuarter, "hidden sm:table-cell")}
                          {cell(s.perfYtd, "hidden md:table-cell pl-3 px-0")}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">{t("sectorTrendNote")}</p>
            </>
          ) : (
            <p className="text-sm text-slate-500">{t("sectorTrendError")}</p>
          )}
        </section>

        <Tabs 
          defaultValue="valor" 
          value={activeTab} 
          onValueChange={(val) => {
            const preset = val as Preset;
            setActiveTab(preset);
            if (preset === 'estrategia') {
              // Aplica los criterios de la estrategia de una vez;
              // los selects los reflejan y siguen siendo editables.
              setFilters(f => ({ ...f, ...STRATEGY_FILTERS }));
            }
          }}
          className="w-full"
        >
          <div className="flex justify-center mb-10">
            <TabsList className="grid w-full max-w-2xl grid-cols-4 h-14 items-center rounded-xl bg-white shadow-sm border border-slate-200 p-1.5 dark:bg-slate-900 dark:border-slate-800">
              <TabsTrigger value="valor" className="rounded-lg h-11 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm font-bold dark:data-[state=active]:bg-emerald-900/40 dark:data-[state=active]:text-emerald-400 transition-all uppercase tracking-wide text-xs">
                {t("ideasTabValue")}
              </TabsTrigger>
              <TabsTrigger value="dividendos" className="rounded-lg h-11 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm font-bold dark:data-[state=active]:bg-emerald-900/40 dark:data-[state=active]:text-emerald-400 transition-all uppercase tracking-wide text-xs">
                {t("ideasTabDividends")}
              </TabsTrigger>
              <TabsTrigger value="oportunidades" className="rounded-lg h-11 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm font-bold dark:data-[state=active]:bg-emerald-900/40 dark:data-[state=active]:text-emerald-400 transition-all uppercase tracking-wide text-xs">
                {t("ideasTabOpportunities")}
              </TabsTrigger>
              <TabsTrigger value="estrategia" className="rounded-lg h-11 gap-1.5 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm font-bold dark:data-[state=active]:bg-emerald-900/40 dark:data-[state=active]:text-emerald-400 transition-all uppercase tracking-wide text-xs">
                <Star className={cn("w-3.5 h-3.5", activeTab === 'estrategia' && "fill-current")} />
                {t("ideasTabStrategy")}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 mb-10 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                <Filter className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                {t("ideasFiltersTitle")}
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">{activeFiltersCount}</Badge>
                )}
              </h3>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-medium transition-colors">
                  <X className="w-4 h-4 mr-1" /> {t("ideasClear")}
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t("filterIndex")}</label>
                <Select value={filters.index} onValueChange={v => setFilters({...filters, index: v})}>
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-medium"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filterAll")}</SelectItem>
                    <SelectItem value="sp500">S&P 500</SelectItem>
                    <SelectItem value="nasdaq100">Nasdaq 100</SelectItem>
                    <SelectItem value="dowjones">Dow Jones</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t("filterExchange")}</label>
                <Select value={filters.exchange} onValueChange={v => setFilters({...filters, exchange: v})}>
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-medium"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filterAll")}</SelectItem>
                    <SelectItem value="nyse">NYSE</SelectItem>
                    <SelectItem value="nasdaq">NASDAQ</SelectItem>
                    <SelectItem value="amex">AMEX</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t("filterCap")}</label>
                <Select value={filters.cap} onValueChange={v => setFilters({...filters, cap: v})}>
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-medium"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filterAllFem")}</SelectItem>
                    <SelectItem value="over500">{t("filterCapOver500")}</SelectItem>
                    <SelectItem value="over1000">{t("filterCapOver1000")}</SelectItem>
                    <SelectItem value="from500to1000">{t("filterCapFrom500to1000")}</SelectItem>
                    <SelectItem value="under500">{t("filterCapUnder500")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t("filterCountry")}</label>
                <Select value={filters.country} onValueChange={v => setFilters({...filters, country: v})}>
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-medium"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filterAll")}</SelectItem>
                    <SelectItem value="usa">{t("filterUsa")}</SelectItem>
                    <SelectItem value="notusa">{t("filterNotUsa")}</SelectItem>
                    <SelectItem value="europe">{t("filterEurope")}</SelectItem>
                    <SelectItem value="china">{t("filterChina")}</SelectItem>
                    <SelectItem value="canada">{t("filterCanada")}</SelectItem>
                    <SelectItem value="japan">{t("filterJapan")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t("filterPrice")}</label>
                <Select value={filters.price} onValueChange={v => setFilters({...filters, price: v})}>
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-medium"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filterAll")}</SelectItem>
                    <SelectItem value="o50">{t("filterPriceO50")}</SelectItem>
                    <SelectItem value="o100">{t("filterPriceO100")}</SelectItem>
                    <SelectItem value="o150">{t("filterPriceO150")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t("filterRecom")}</label>
                <Select value={filters.recom} onValueChange={v => setFilters({...filters, recom: v})}>
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-medium"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filterAny")}</SelectItem>
                    <SelectItem value="strongbuy">{t("filterRecomStrongBuy")}</SelectItem>
                    <SelectItem value="buybetter">{t("filterRecomBuyBetter")}</SelectItem>
                    <SelectItem value="holdbetter">{t("filterRecomHoldBetter")}</SelectItem>
                    <SelectItem value="holdworse">{t("filterRecomHoldWorse")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t("filterInsider")}</label>
                <Select value={filters.insider} onValueChange={v => setFilters({...filters, insider: v})}>
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-medium"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filterAny")}</SelectItem>
                    <SelectItem value="compras">{t("filterInsiderBuying")}</SelectItem>
                    <SelectItem value="ventas">{t("filterInsiderSelling")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t("filterInsiderOwn")}</label>
                <Select value={filters.insiderOwn} onValueChange={v => setFilters({...filters, insiderOwn: v})}>
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-medium"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filterAny")}</SelectItem>
                    <SelectItem value="over30">{t("filterInsiderOwnOver30")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t("filterTargetUpside")}</label>
                <Select value={filters.targetUpside} onValueChange={v => setFilters({...filters, targetUpside: v})}>
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-medium"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filterAny")}</SelectItem>
                    <SelectItem value="a5">{t("filterUpside5")}</SelectItem>
                    <SelectItem value="a10">{t("filterUpside10")}</SelectItem>
                    <SelectItem value="a20">{t("filterUpside20")}</SelectItem>
                    <SelectItem value="a30">{t("filterUpside30")}</SelectItem>
                    <SelectItem value="a50">{t("filterUpside50")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t("filterOptionable")}</label>
                <Select value={filters.optionable} onValueChange={v => setFilters({...filters, optionable: v})}>
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-medium" data-testid="select-optionable"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filterAny")}</SelectItem>
                    <SelectItem value="yes">{t("filterOptionableYes")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="min-h-[400px]">
            {isLoading ? (
              <div className="space-y-8">
                <Skeleton className="h-32 w-full rounded-3xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-80 w-full rounded-3xl" />
                  ))}
                </div>
              </div>
            ) : data ? (
              <div className="space-y-10 animate-in fade-in duration-500">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row gap-10 items-start shadow-sm relative overflow-hidden mb-10">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="flex-1 space-y-5 relative z-10">
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-4 tracking-tight">
                      <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl shadow-sm border border-emerald-200 dark:border-emerald-800/50">
                        <Target className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      {data.label}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg font-medium">
                      {data.description}
                    </p>
                  </div>
                  <div className="w-full md:w-1/3 bg-slate-50 dark:bg-slate-950 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-inner relative z-10">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3 text-lg">
                      <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      {t("ideasCriteriaTitle")}
                    </h3>
                    <ul className="space-y-3">
                      {data.criteria.map((criterion, i) => (
                        <li key={i} className="flex gap-3 text-slate-700 dark:text-slate-300 font-medium">
                          <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-snug">{criterion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  {data.stocks.map((stock) => (
                    <Link key={stock.ticker} href={`/analisis/${stock.ticker}`}>
                      <Card className="hover:border-emerald-500/50 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-emerald-900/5 hover:-translate-y-1 group bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                        <div className="flex flex-col md:flex-row items-start md:items-center p-5 md:p-6 gap-5 md:gap-6">
                          <div className="flex items-center gap-4 min-w-[220px] w-full md:w-auto shrink-0 border-b md:border-b-0 border-slate-100 dark:border-slate-800/50 pb-4 md:pb-0">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1.5">
                                <Badge className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 shadow-sm border-0 font-bold px-2.5 py-0.5">{stock.ticker}</Badge>
                                {stock.buyScore !== undefined && stock.buyScore !== null && (
                                  <Badge className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 shadow-sm border",
                                    stock.buyScore >= 70 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50" :
                                    stock.buyScore >= 40 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/50" :
                                    "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 border-rose-200 dark:border-rose-800/50"
                                  )}>
                                    {stock.buyScore}%
                                  </Badge>
                                )}
                                {stock.strategySignal === true && (
                                  <Badge className="text-[10px] font-bold px-2 py-0.5 shadow-sm border bg-emerald-600 text-white hover:bg-emerald-500 border-emerald-500 dark:bg-emerald-600 dark:text-white dark:border-emerald-500">
                                    <Target className="w-3 h-3 mr-1" />
                                    {t("ideasStrategySignal")}
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]" title={stock.companyName}>{stock.companyName}</h4>
                              <p className="text-xs font-medium text-slate-500 mt-1 truncate max-w-[200px]">{stock.sector}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 md:gap-6 w-full flex-1 items-center">
                            <div>
                              <p className="text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px] font-bold mb-1">{t("homeCurrentPrice")}</p>
                              <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-base">{formatCurrency(stock.price)}</p>
                            </div>
                            
                            <div>
                              <p className="text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px] font-bold mb-1">{t("statChange")}</p>
                              <p className={cn(
                                "font-mono font-bold flex items-center gap-1 text-base",
                                stock.changePercent >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                              )}>
                                {formatPercent(stock.changePercent)}
                              </p>
                            </div>

                            <div className="hidden sm:block">
                              <p className="text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px] font-bold mb-1">{t("filterRecom")}</p>
                              <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{stock.recom != null ? t(getRecomKey(stock.recom)) : "—"}</p>
                            </div>

                            <div className="hidden sm:block">
                              <p className="text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px] font-bold mb-1">{t("statUpside")}</p>
                              <p className={cn(
                                "font-mono font-bold text-base",
                                stock.targetUpsidePercent != null ? (stock.targetUpsidePercent >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400") : "text-slate-500"
                              )}>
                                {stock.targetUpsidePercent != null ? formatPercent(stock.targetUpsidePercent) : "—"}
                              </p>
                            </div>

                            <div className="hidden md:block">
                              <p className="text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px] font-bold mb-1">{t("statDivYield")}</p>
                              <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-base">{stock.dividendYield || "—"}</p>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center justify-end w-full md:w-auto mt-2 md:mt-0">
                            <div className="flex items-center text-sm font-bold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500 transition-colors w-full md:w-auto justify-end bg-slate-50 dark:bg-slate-950 md:bg-transparent md:dark:bg-transparent p-3 md:p-0 rounded-xl md:rounded-none">
                              <span className="md:hidden mr-1 text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">{t("ideasSeeFullAnalysis")}</span>
                              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform ml-auto md:ml-0" />
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                  
                  {data.stocks.length === 0 && (
                    <div className="col-span-1 lg:col-span-2 p-16 text-center border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl bg-slate-50 dark:bg-slate-900/50">
                      <p className="text-lg text-slate-500 font-medium">{t("ideasNoResults")}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : isError ? (
              <div className="p-16 text-center border-2 border-dashed border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 rounded-3xl space-y-5">
                <p className="text-lg text-rose-600 dark:text-rose-400 font-medium">
                  {t("ideasLoadError")}
                </p>
                <Button onClick={() => refetch()} disabled={isRefetching} className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-8 h-12 rounded-xl">
                  {isRefetching ? t("ideasRetrying") : t("ideasRetry")}
                </Button>
              </div>
            ) : null}
          </div>
        </Tabs>
      </main>
    </div>
  );
}
