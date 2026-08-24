import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Show } from "@clerk/react";
import { useGetRecentAnalyses } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, AlertCircle, ArrowRight, ChevronRight, Filter, Target, ShieldCheck, Tag, Users, LineChart, UserPlus, ListChecks, CheckCircle2 } from "lucide-react";
import cheapSafeIcon from "@/assets/cheap-safe-icon.png";
import dividendsIcon from "@/assets/dividends-icon.png";
import { ScoreCircle } from "@/components/score-circle";
import { AuthNav } from "@/components/auth-nav";
import { FinvizSeal } from "@/components/finviz-seal";
import { BROKERS } from "@/components/broker-links";
import { ReferenceLists } from "@/components/reference-lists";
import { HeaderChart } from "@/components/header-chart";
import { LanguageSelector } from "@/components/language-selector";
import { useLanguage } from "@/lib/language";
import { useSubscription } from "@/pages/subscribe";
import { useFavorites } from "@/hooks/use-favorites";
import { TopPicksSection } from "@/components/top-picks-section";
import { MarketPulseSection } from "@/components/market-pulse-section";
import { Star } from "lucide-react";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";

/** The user's saved watchlist with live price/change so they can decide daily. */
function FavoritesSection() {
  const { t, locale } = useLanguage();
  const { data: sub } = useSubscription();
  const hasAccess = sub?.active === true;
  const { data, isLoading } = useFavorites(hasAccess);
  if (!hasAccess || isLoading) return null;
  const favorites = data?.favorites ?? [];
  if (favorites.length === 0) return null;
  return (
    <div className="max-w-4xl mx-auto mt-10 text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="rounded-3xl bg-white/95 dark:bg-slate-900/85 backdrop-blur-md ring-1 ring-slate-900/10 dark:ring-white/10 shadow-xl overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-yellow-500" />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white shadow-lg">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">{t("favTitle")}</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t("favSubtitle")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {favorites.map((f) => (
              <Link key={f.ticker} href={`/analisis/${f.ticker}`}>
                <div
                  className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-amber-100 dark:hover:bg-amber-500/20 ring-1 ring-transparent hover:ring-amber-400/60 cursor-pointer transition-all group"
                  data-testid={`fav-${f.ticker}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">{f.ticker}</span>
                    {f.stock && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{f.stock.companyName}</span>
                    )}
                  </div>
                  {f.stock ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(f.stock.price)}</span>
                      <span
                        className={cn(
                          "text-xs font-bold px-2 py-0.5 rounded-md",
                          f.stock.changePercent >= 0
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
                        )}
                      >
                        {formatPercent(f.stock.changePercent)}
                      </span>
                    </div>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 shrink-0" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Prominent CTA to start the 7-day free trial, shown only to signed-in
 * users who don't yet have access (no active sub, not admin/founder). */
function TrialBanner() {
  const { t } = useLanguage();
  const { data, isLoading, isError } = useSubscription();
  if (isLoading || isError || !data || data.active) return null;
  return (
    <div className="max-w-2xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Link href="/suscripcion">
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-5 sm:p-6 text-left shadow-2xl shadow-emerald-950/30 ring-1 ring-white/20 cursor-pointer hover:scale-[1.02] transition-transform"
          data-testid="banner-trial"
        >
          <div>
            <p className="font-display font-bold text-lg text-white">{t("trialBannerTitle")}</p>
            <p className="text-sm text-emerald-50/90 mt-1">{t("trialBannerSubtitle")}</p>
          </div>
          <Button
            size="lg"
            className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold shrink-0 shadow-lg border-0"
          >
            {t("trialBannerCta")}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Link>
    </div>
  );
}

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const { data: recent, isLoading: isLoadingRecent } = useGetRecentAnalyses();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticker.trim()) {
      setLocation(`/analisis/${encodeURIComponent(ticker.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col relative pt-28">
      {/* Fixed Header with Logo and AuthNav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-800/80 backdrop-blur-md shadow-sm border-b border-slate-700/60 transition-all overflow-hidden">
        <HeaderChart />
        <div className="container max-w-5xl mx-auto px-4 h-28 flex items-center justify-between gap-4 relative">
          <Link href="/">
            <div className="flex items-center cursor-pointer hover:scale-105 transition-transform">
              <img src="/logo.png" alt={t("logoAlt")} className="h-20 md:h-24 object-contain drop-shadow-[0_2px_10px_rgba(255,255,255,0.6)]" />
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <AuthNav />
          </div>
        </div>
      </header>

      {/* Broker / platform logo strip, right under the header */}
      <div className="relative z-10 bg-white border-b border-slate-200 shadow-sm" data-testid="strip-brokers">
        <div className="container max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 md:gap-x-12">
          <span className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-slate-400">
            {t("brokersStripLabel")}
          </span>
          {BROKERS.map((b) => (
            <a
              key={b.id}
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`strip-broker-${b.id}`}
              title={b.name}
              className="opacity-80 hover:opacity-100 transition-opacity"
            >
              <img
                src={`${import.meta.env.BASE_URL}${b.logo}`}
                alt={b.name}
                className="h-6 md:h-8 w-auto object-contain"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      </div>

      {/* Hero Background Treatment: user's two images + gradient dots */}
      <div className="absolute top-0 left-0 right-0 h-[600px] pointer-events-none z-0 overflow-hidden bg-slate-950">
        {/* Bull vs bear (left half) */}
        <div className="absolute inset-y-0 left-0 w-full md:w-1/2 bg-[url('/hero-bull-bear.jpg')] bg-cover bg-center opacity-60"></div>
        {/* AI chip with charts (right half) */}
        <div className="hidden md:block absolute inset-y-0 right-0 w-1/2 bg-[url('/hero-ai.jpg')] bg-cover bg-center opacity-65"></div>
        {/* Soft blend seam between the two images */}
        <div className="hidden md:block absolute inset-y-0 left-1/3 right-1/3 bg-gradient-to-r from-transparent via-slate-900/50 to-transparent"></div>
        {/* Light veil so text stays readable without hiding the images */}
        <div className="absolute inset-0 bg-slate-900/35"></div>
        {/* Gradient dot pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(248,113,113,0.4) 1.5px, transparent 1.5px)",
            backgroundSize: "26px 26px",
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)",
          }}
        ></div>
        {/* Fade into the page background */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-slate-50 dark:to-slate-950"></div>
      </div>

      <main className="flex-1 relative z-10">
        {/* ── Signed-out: marketing landing ── */}
        <Show when="signed-out">
          <div className="container max-w-5xl mx-auto px-4 py-12 md:py-20">
            <div className="text-center space-y-6 animate-in slide-in-from-bottom-8 duration-700 fade-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl text-white max-w-4xl mx-auto leading-tight font-display font-bold drop-shadow-md">
                {t("landingHeroTitle")}
              </h1>
              <p className="text-xl md:text-2xl text-slate-200 max-w-3xl mx-auto leading-relaxed font-medium drop-shadow-sm">
                {t("landingHeroSubtitle")}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                <Link href="/sign-up">
                  <Button size="lg" className="h-16 px-10 text-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-950/40 border-0 w-full sm:w-auto" data-testid="button-landing-signup">
                    {t("landingCtaSignUp")}
                    <ArrowRight className="w-6 h-6 ml-2" />
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button size="lg" variant="outline" className="h-16 px-10 text-xl font-bold bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-2xl backdrop-blur-md w-full sm:w-auto" data-testid="button-landing-signin">
                    {t("landingCtaSignIn")}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Strategy features */}
            <div className="mt-24">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white text-center mb-12 tracking-tight">{t("landingWhyTitle")}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { icon: ShieldCheck, title: t("landingFeature1Title"), desc: t("landingFeature1Desc"), accent: "emerald" },
                  { icon: Tag, title: t("landingFeature2Title"), desc: t("landingFeature2Desc"), accent: "rose" },
                  { icon: Users, title: t("landingFeature3Title"), desc: t("landingFeature3Desc"), accent: "emerald" },
                  { icon: LineChart, title: t("landingFeature4Title"), desc: t("landingFeature4Desc"), accent: "rose" },
                ].map(({ icon: Icon, title, desc, accent }) => (
                  <Card key={title} className={cn(
                    "bg-white dark:bg-slate-900/60 border-0 ring-1 rounded-3xl overflow-hidden",
                    accent === "emerald" ? "ring-emerald-500/30 hover:ring-emerald-500/60" : "ring-rose-500/30 hover:ring-rose-500/60",
                    "transition-all hover:shadow-2xl"
                  )}>
                    <CardContent className="p-8 flex items-start gap-5">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
                        accent === "emerald" ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      )}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Proof band */}
            <div className="mt-20 rounded-3xl bg-slate-950 dark:bg-slate-900/80 ring-1 ring-emerald-500/30 p-10 md:p-14 text-center relative overflow-hidden">
              <div
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{
                  backgroundImage: "radial-gradient(circle, rgba(148,163,184,0.3) 1.5px, transparent 1.5px)",
                  backgroundSize: "26px 26px",
                }}
              ></div>
              <div className="relative">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-6" />
                <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4 tracking-tight">{t("landingProofTitle")}</h2>
                <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">{t("landingProofDesc")}</p>
              </div>
            </div>

            {/* How it works */}
            <div className="mt-20">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white text-center mb-12 tracking-tight">{t("landingHowTitle")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: UserPlus, step: "1", title: t("landingStep1Title"), desc: t("landingStep1Desc") },
                  { icon: ListChecks, step: "2", title: t("landingStep2Title"), desc: t("landingStep2Desc") },
                  { icon: TrendingUp, step: "3", title: t("landingStep3Title"), desc: t("landingStep3Desc") },
                ].map(({ icon: Icon, step, title, desc }) => (
                  <Card key={step} className="bg-white dark:bg-slate-900/60 border-0 ring-1 ring-slate-200 dark:ring-white/10 rounded-3xl text-center">
                    <CardContent className="p-8">
                      <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-6 text-2xl font-display font-bold shadow-lg shadow-emerald-900/30">
                        {step}
                      </div>
                      <Icon className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
                      <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Final CTA */}
            <div className="mt-20 text-center">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white mb-4 tracking-tight">{t("landingFinalCtaTitle")}</h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">{t("landingFinalCtaDesc")}</p>
              <Link href="/sign-up">
                <Button size="lg" className="h-16 px-12 text-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-900/30 border-0" data-testid="button-landing-final-cta">
                  {t("landingCtaSignUp")}
                  <ArrowRight className="w-6 h-6 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Show>

        {/* ── Signed-in: full app home ── */}
        <Show when="signed-in">
        <div className="container max-w-5xl mx-auto px-4 py-12 md:py-20">
          {/* Hero Section */}
          <div className="text-center space-y-6 animate-in slide-in-from-bottom-8 duration-700 fade-in">
            <p className="text-2xl md:text-3xl lg:text-4xl text-emerald-50 dark:text-slate-300 max-w-3xl mx-auto leading-tight font-display font-bold drop-shadow-sm">
              {t("homeTagline")}
            </p>

            {/* Trial CTA: only for signed-in users without an active subscription */}
            <TrialBanner />

            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mt-10 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-6 h-6 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors z-10" />
                <Input
                  type="text"
                  placeholder={t("homeSearchPlaceholder")}
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  className="pl-14 h-16 text-xl border-0 ring-4 ring-emerald-950/10 dark:ring-slate-800 bg-white/95 dark:bg-slate-900/80 backdrop-blur-md text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-emerald-400 rounded-2xl shadow-2xl transition-all"
                  data-testid="input-ticker-search"
                />
              </div>
              <Button type="submit" size="lg" className="h-16 px-10 text-xl font-bold bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-2xl shadow-xl shadow-slate-950/30 dark:shadow-emerald-900/30 transition-all border-0 w-full sm:w-auto" data-testid="button-search">
                {t("homeSearchButton")}
              </Button>
            </form>

            {/* Today's market pulse: what is moving the market, in plain words */}
            <MarketPulseSection />

            {/* Watchlist: the user's saved favorites with today's numbers */}
            <FavoritesSection />

            {/* Las 3 elegidas de hoy (visible para suscriptores) */}
            <div className="max-w-4xl mx-auto mt-10 text-left animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
              <TopPicksSection hideWhenUnavailable />
            </div>

            {/* Reference lists: quick lookup cards */}
            <div className="max-w-4xl mx-auto mt-10 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
              <ReferenceLists />
            </div>

            {/* Screener/Ideas Gateway */}
            <div className="mt-16 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/ideas">
                  <Card
                    data-testid="card-home-ideas"
                    className="relative border-0 ring-1 ring-emerald-400/30 hover:ring-emerald-400/70 transition-all cursor-pointer h-full hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-1 group rounded-3xl overflow-hidden text-left bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-950"
                  >
                    <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-emerald-500/20 blur-3xl group-hover:bg-emerald-500/30 transition-colors" />
                    <CardContent className="relative p-8 flex flex-col gap-4 h-full">
                      <div className="flex items-center justify-between">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-400/30 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                          <img src={cheapSafeIcon} alt="" className="w-12 h-12 object-contain drop-shadow" />
                        </div>
                        <ChevronRight className="w-7 h-7 text-emerald-400/70 group-hover:translate-x-2 transition-transform" />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-display font-bold mb-2 tracking-tight text-white leading-snug">{t("homeIdeasCta")}</h3>
                        <p className="text-emerald-100/70 text-sm font-medium leading-relaxed">{t("homeScreenerDesc")}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                
                <Link href="/ideas?preset=dividendos">
                  <Card
                    data-testid="card-home-dividends"
                    className="relative border-0 ring-1 ring-amber-400/40 hover:ring-amber-400/80 transition-all cursor-pointer h-full hover:shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-1 group rounded-3xl overflow-hidden text-left bg-white dark:bg-slate-900/60 backdrop-blur-md"
                  >
                    <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-amber-400/15 blur-3xl group-hover:bg-amber-400/25 transition-colors" />
                    <CardContent className="relative p-8 flex flex-col gap-4 h-full">
                      <div className="flex items-center justify-between">
                        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-500/10 ring-1 ring-amber-400/40 flex items-center justify-center shrink-0 group-hover:bg-amber-200 dark:group-hover:bg-amber-500/25 transition-colors">
                          <img src={dividendsIcon} alt="" className="w-12 h-12 object-contain drop-shadow" />
                        </div>
                        <ChevronRight className="w-7 h-7 text-amber-500/70 group-hover:translate-x-2 transition-transform" />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-display font-bold mb-2 tracking-tight text-slate-900 dark:text-white leading-snug">{t("ideasTabDividends")}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">{t("homeDividendsDesc")}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container max-w-5xl mx-auto px-4 py-16">
          {/* Recent Analyses Section */}
          <div className="animate-in slide-in-from-bottom-12 duration-1000 fade-in fill-mode-both">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl shadow-sm border border-emerald-200 dark:border-emerald-800/50">
                <TrendingUp className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white tracking-tight">{t("homeRecentTitle")}</h2>
            </div>
            
            {isLoadingRecent ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse border-slate-200 dark:border-slate-800 rounded-3xl">
                    <CardHeader className="h-32 bg-slate-100 dark:bg-slate-800/50 rounded-t-3xl" />
                  </Card>
                ))}
              </div>
            ) : recent && recent.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {recent.map((analysis) => (
                  <Link key={analysis.ticker} href={`/analisis/${analysis.ticker}`}>
                    <Card className="hover:border-emerald-500/50 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-emerald-900/5 hover:-translate-y-1 group h-full flex flex-col border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden" data-testid={`card-recent-${analysis.ticker}`}>
                      <CardHeader className="flex flex-row items-start justify-between pb-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800/50">
                        <div>
                          <Badge variant="secondary" className="mb-3 bg-white border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 shadow-sm font-bold">{analysis.ticker}</Badge>
                          <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate max-w-[140px]" title={analysis.companyName}>
                            {analysis.companyName}
                          </CardTitle>
                        </div>
                        <ScoreCircle score={analysis.overallScore} size="md" className="shadow-sm" />
                      </CardHeader>
                      <CardContent className="mt-auto pt-6 pb-6">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{t("homeCurrentPrice")}</p>
                            <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(analysis.price)}</p>
                            <p className={cn(
                              "text-sm font-mono font-bold mt-1 flex items-center gap-1",
                              analysis.changePercent >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                            )}>
                              {formatPercent(analysis.changePercent)}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 text-slate-400 group-hover:shadow-lg group-hover:shadow-emerald-900/20 group-hover:scale-110">
                            <ArrowRight className="w-5 h-5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl bg-slate-50 dark:bg-slate-900/50">
                <AlertCircle className="w-10 h-10 mx-auto mb-4 text-slate-400" />
                <p className="text-lg text-slate-500 font-medium">{t("homeNoRecent")}</p>
              </div>
            )}
          </div>
        </div>
        </Show>
      </main>
      <footer className="bg-slate-950 border-t border-slate-900 py-12 text-center text-sm text-slate-500 font-medium z-10 relative">
        <div className="mb-4 flex justify-center">
          <FinvizSeal variant="inline-dark" />
        </div>
        <p>{t("homeFooter")}</p>
        <p className="mt-3">
          <Link href="/soporte">
            <span className="text-emerald-500 hover:text-emerald-400 hover:underline cursor-pointer font-semibold" data-testid="link-footer-support">
              {t("footerSupportLink")}
            </span>
          </Link>
        </p>
      </footer>
    </div>
  );
}