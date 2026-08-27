import {
  getGetRatesAndFedQueryKey,
  useGetRatesAndFed,
} from "@workspace/api-client-react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ExternalLink,
  Landmark,
  Minus,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/language";
import { cn } from "@/lib/utils";

export function RatesFedSection() {
  const { t, lang, locale } = useLanguage();
  const params = { lang } as const;
  const { data, isLoading } = useGetRatesAndFed(params, {
    query: {
      queryKey: getGetRatesAndFedQueryKey(params),
      staleTime: 60 * 60 * 1000,
      placeholderData: (previousData) => previousData,
    },
  });

  if (!data) {
    return (
      <section
        className="mx-auto mt-10 max-w-4xl text-left"
        data-testid="section-rates-fed"
        aria-busy={isLoading}
      >
        <div className="rounded-3xl bg-white/95 p-6 shadow-xl ring-1 ring-slate-900/10 dark:bg-slate-900/85 dark:ring-white/10">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                {t("ratesFedTitle")}
              </h3>
              <p className="text-xs font-semibold text-slate-500">{t("ratesFedLoading")}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((item) => <Skeleton key={item} className="h-24 rounded-2xl" />)}
          </div>
        </div>
      </section>
    );
  }

  const nextMeeting = data.upcomingMeetings[0];
  const formatDate = (date: string) =>
    new Date(`${date}T12:00:00`).toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <section
      className="mx-auto mt-10 max-w-4xl animate-in text-left fade-in slide-in-from-bottom-4 duration-700"
      data-testid="section-rates-fed"
    >
      <div className="overflow-hidden rounded-3xl bg-white/95 shadow-xl ring-1 ring-slate-900/10 backdrop-blur-md dark:bg-slate-900/85 dark:ring-white/10">
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400" />
        <div className="p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                <Landmark className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  {t("ratesFedTitle")}
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t("ratesFedAsOf")} {formatDate(data.ratesDate)}
                </p>
              </div>
            </div>
            <a
              href={data.treasurySourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-300"
            >
              {t("ratesFedOfficialData")} <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {data.rates.map((rate) => {
              const ChangeIcon =
                rate.changeBps > 0 ? ArrowUpRight : rate.changeBps < 0 ? ArrowDownRight : Minus;
              return (
                <div key={rate.maturity} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-950/50 dark:ring-slate-800">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {rate.maturity === "2Y" ? t("ratesFedTwoYear") : t("ratesFedTenYear")}
                  </p>
                  <div className="mt-1 flex items-end justify-between gap-2">
                    <span className="font-mono text-3xl font-bold text-slate-900 dark:text-white">
                      {rate.yield.toFixed(2)}%
                    </span>
                    <span className={cn(
                      "mb-1 inline-flex items-center text-xs font-bold",
                      rate.changeBps > 0 && "text-amber-600 dark:text-amber-400",
                      rate.changeBps < 0 && "text-emerald-600 dark:text-emerald-400",
                      rate.changeBps === 0 && "text-slate-500",
                    )}>
                      <ChangeIcon className="h-4 w-4" />
                      {rate.changeBps > 0 ? "+" : ""}{rate.changeBps} pb
                    </span>
                  </div>
                </div>
              );
            })}

            <div className="rounded-2xl bg-indigo-50 p-4 ring-1 ring-indigo-200 dark:bg-indigo-950/30 dark:ring-indigo-800/60">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                {t("ratesFedCurve")}
              </p>
              <p className="mt-1 font-mono text-3xl font-bold text-slate-900 dark:text-white">
                {data.spreadBps > 0 ? "+" : ""}{data.spreadBps} pb
              </p>
              <p className="mt-1 text-[11px] text-slate-500">{t("ratesFedCurveHint")}</p>
            </div>
          </div>

          <p className="mt-4 rounded-2xl bg-sky-50 px-4 py-3 text-sm font-medium leading-relaxed text-slate-700 ring-1 ring-sky-100 dark:bg-sky-950/30 dark:text-slate-300 dark:ring-sky-900/50">
            {data.interpretation}
          </p>

          {nextMeeting && (
            <div className="mt-5 flex flex-col gap-4 rounded-2xl bg-slate-950 p-5 text-white sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-7 w-7 text-cyan-300" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-cyan-200">
                    {t("ratesFedNextDecision")}
                  </p>
                  <p className="text-xl font-bold">{formatDate(nextMeeting.decisionDate)}</p>
                </div>
              </div>
              <div className="text-sm text-slate-300">
                {nextMeeting.hasPressConference && <p>{t("ratesFedPressConference")}</p>}
                {data.upcomingMeetings.length > 1 && (
                  <p className="mt-1 text-xs text-slate-400">
                    {t("ratesFedFollowing")}: {data.upcomingMeetings.slice(1).map((meeting) => formatDate(meeting.decisionDate)).join(" · ")}
                  </p>
                )}
              </div>
            </div>
          )}

          <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
            {t("ratesFedDisclaimer")}{" "}
            <a href={data.fedSourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-500">
              {t("ratesFedFedSource")}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}