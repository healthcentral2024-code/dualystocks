import {
  useGetMarketPulse,
  getGetMarketPulseQueryKey,
} from "@workspace/api-client-react";
import { TrendingUp, TrendingDown, Activity, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/language";
import { cn } from "@/lib/utils";

/**
 * "Today's market pulse": plain-language explanation of what is moving the
 * market today plus a per-sector green/red strip. Public (no subscription).
 */
export function MarketPulseSection() {
  const { t, lang } = useLanguage();
  const params = { lang } as const;
  const { data, isLoading, isError } = useGetMarketPulse(params, {
    query: {
      queryKey: getGetMarketPulseQueryKey(params),
      placeholderData: (previousData) => previousData,
    },
  });

  if (!data) {
    return (
      <div
        className="max-w-4xl mx-auto mt-10 text-left animate-in fade-in slide-in-from-bottom-4 duration-700"
        data-testid="section-market-pulse"
        aria-busy={isLoading}
      >
        <div className="rounded-3xl bg-white/95 p-6 shadow-xl ring-1 ring-slate-900/10 dark:bg-slate-900/85 dark:ring-white/10">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                {t("pulseTitle")}
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {isError ? t("pulseUnavailable") : t("pulseLoading")}
              </p>
            </div>
          </div>
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-28 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const MoodIcon =
    data.mood === "up" ? TrendingUp : data.mood === "down" ? TrendingDown : Activity;
  const moodColor =
    data.mood === "up"
      ? "from-emerald-500 to-green-600"
      : data.mood === "down"
        ? "from-rose-500 to-red-600"
        : "from-sky-500 to-blue-600";
  const moodLabel =
    data.mood === "up"
      ? t("pulseMoodUp")
      : data.mood === "down"
        ? t("pulseMoodDown")
        : t("pulseMoodMixed");

  return (
    <div
      className="max-w-4xl mx-auto mt-10 text-left animate-in fade-in slide-in-from-bottom-4 duration-700"
      data-testid="section-market-pulse"
    >
      <div className="rounded-3xl bg-white/95 dark:bg-slate-900/85 backdrop-blur-md ring-1 ring-slate-900/10 dark:ring-white/10 shadow-xl overflow-hidden">
        <div className={cn("h-1.5 w-full bg-gradient-to-r", moodColor)} />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-1">
            <div
              className={cn(
                "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg",
                moodColor,
              )}
            >
              <MoodIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">
                {t("pulseTitle")}
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {moodLabel}
              </p>
            </div>
          </div>
          <p
            className="text-sm text-slate-700 dark:text-slate-300 mt-3 leading-relaxed"
            data-testid="text-pulse-summary"
          >
            {data.summary}
          </p>

          {data.topNews && data.topNews.length > 0 && (
            <div className="mt-3 space-y-1">
              {data.topNews.map((n) => (
                <a
                  key={n.url}
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <ExternalLink className="w-3 h-3 mt-0.5 shrink-0" />
                  <span className="truncate">{n.title}</span>
                </a>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {data.sectors.map((s) => {
              const up = s.changeToday > 0.05;
              const down = s.changeToday < -0.05;
              return (
                <span
                  key={s.name}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1",
                    up &&
                      "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800",
                    down &&
                      "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-800",
                    !up &&
                      !down &&
                      "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
                  )}
                  data-testid={`pulse-sector-${s.name.replace(/\s+/g, "-")}`}
                >
                  {s.label}
                  <span className="font-mono">
                    {s.changeToday > 0 ? "+" : ""}
                    {s.changeToday.toFixed(2)}%
                  </span>
                </span>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
            {t("pulseDisclaimer")}
          </p>
        </div>
      </div>
    </div>
  );
}
