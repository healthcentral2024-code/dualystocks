import { Link } from "wouter";
import { useGetTopPicks, getGetTopPicksQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/language";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { ChevronRight, Star, Target } from "lucide-react";

interface TopPicksSectionProps {
  /** When true (e.g. on the public home page), render nothing if the
   * picks can't be loaded (visitor without subscription) instead of an error. */
  hideWhenUnavailable?: boolean;
}

export function TopPicksSection({ hideWhenUnavailable = false }: TopPicksSectionProps) {
  const { t, lang } = useLanguage();
  const picksParams = { lang } as const;
  const { data: picksData, isLoading: picksLoading, isError } = useGetTopPicks(
    picksParams,
    {
      query: {
        queryKey: getGetTopPicksQueryKey(picksParams),
        placeholderData: (previousData) => previousData,
        retry: false,
      },
    },
  );

  if (hideWhenUnavailable && (isError || (!picksLoading && (!picksData || picksData.picks.length === 0)))) {
    return null;
  }

  return (
    <section
      className="relative overflow-hidden rounded-3xl border-2 border-emerald-300/70 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/60 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-950/20 p-6 md:p-8 shadow-lg"
      data-testid="card-top-picks"
    >
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="flex items-center gap-3 mb-1 relative z-10">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
          <Star className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-current" />
        </div>
        <h3 className="font-display font-bold text-slate-900 dark:text-white text-xl md:text-2xl">{t("topPicksTitle")}</h3>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 relative z-10">
        {t("topPicksSubtitle")}
        {picksData && (
          <span className="ml-1">
            {t("topPicksUpdated")} {new Date(picksData.updatedAt).toLocaleTimeString(lang === "en" ? "en-US" : "es-ES", { hour: "2-digit", minute: "2-digit" })}.
          </span>
        )}
      </p>
      {picksLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : picksData && picksData.picks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
          {picksData.picks.map((s, idx) => (
            <Link key={s.ticker} href={`/analisis/${s.ticker}`}>
              <div
                className="group h-full rounded-2xl bg-white/90 dark:bg-slate-950/60 border border-emerald-200/80 dark:border-emerald-800/40 p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
                data-testid={`card-top-pick-${idx}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="w-8 h-8 rounded-full bg-emerald-600 text-white font-display font-bold flex items-center justify-center shadow-sm">
                    {idx + 1}
                  </span>
                  {s.strategySignal && (
                    <Badge className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] uppercase tracking-wider">
                      {t("topPicksSignal")}
                    </Badge>
                  )}
                </div>
                <p className="font-mono font-bold text-lg text-slate-900 dark:text-white">{s.ticker}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate mb-3">{s.companyName}</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="font-mono font-bold text-xl text-slate-900 dark:text-white">{formatCurrency(s.price)}</span>
                  <span className={cn("text-sm font-mono font-semibold", s.changePercent >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                    {formatPercent(s.changePercent)}
                  </span>
                </div>
                {s.targetUpsidePercent != null && (
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <Target className="w-4 h-4" />
                    +{s.targetUpsidePercent.toFixed(0)}% {t("topPicksUpside")}
                  </p>
                )}
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 flex items-center gap-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {t("topPicksSee")} <ChevronRight className="w-3.5 h-3.5" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">{t("topPicksError")}</p>
      )}
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 relative z-10">{t("topPicksNote")}</p>
    </section>
  );
}
