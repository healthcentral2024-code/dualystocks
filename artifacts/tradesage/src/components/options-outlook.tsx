import { useState } from "react";
import type {
  OptionsHistoricalOutlook,
  OptionsHorizonOutlookHorizon,
  OptionsDirectionalOutlookReasonsItem,
} from "@workspace/api-client-react";
import { Activity, AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language";
import type { TranslationKey } from "@/lib/translations";
import { cn } from "@/lib/utils";

const reasonKeys: Record<OptionsDirectionalOutlookReasonsItem, TranslationKey> = {
  bullish_trend: "optionsReasonBullishTrend",
  bearish_trend: "optionsReasonBearishTrend",
  sideways_trend: "optionsReasonSidewaysTrend",
  rsi_overbought: "optionsReasonRsiOverbought",
  rsi_oversold: "optionsReasonRsiOversold",
  rsi_balanced: "optionsReasonRsiBalanced",
  room_to_resistance: "optionsReasonRoomResistance",
  limited_room_to_resistance: "optionsReasonLimitedResistance",
  room_to_support: "optionsReasonRoomSupport",
  limited_room_to_support: "optionsReasonLimitedSupport",
  elevated_historical_volatility: "optionsReasonHighVolatility",
  normal_historical_volatility: "optionsReasonNormalVolatility",
};

const horizonKeys: Record<OptionsHorizonOutlookHorizon, TranslationKey> = {
  week: "optionsWeek",
  two_weeks: "optionsTwoWeeks",
  month: "optionsMonth",
};

interface OptionsOutlookProps {
  outlook: OptionsHistoricalOutlook;
}

export function OptionsOutlook({ outlook }: OptionsOutlookProps) {
  const { t, locale } = useLanguage();
  const [selectedHorizon, setSelectedHorizon] =
    useState<OptionsHorizonOutlookHorizon>("week");
  const selected =
    outlook.horizons.find((item) => item.horizon === selectedHorizon) ??
    outlook.horizons[0];
  const money = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <section
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900 md:p-8"
      data-testid="section-options-outlook"
    >
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <div className="mb-2 flex items-center gap-3">
            <span className="rounded-xl bg-violet-100 p-2 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
              <Activity className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
              {t("optionsTitle")}
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {t("optionsSubtitle")}
          </p>
        </div>
        {outlook.available && (
          <div
            className="flex w-full gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 md:w-auto"
            data-testid="options-horizon-selector"
          >
            {outlook.horizons.map((item) => (
              <Button
                key={item.horizon}
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setSelectedHorizon(item.horizon)}
                className={cn(
                  "min-w-0 flex-1 rounded-lg px-2 text-xs md:flex-none md:px-3",
                  selected?.horizon === item.horizon
                    ? "bg-white font-bold text-slate-900 shadow-sm hover:bg-white dark:bg-slate-700 dark:text-white dark:hover:bg-slate-700"
                    : "text-slate-500 dark:text-slate-300",
                )}
                data-testid={`button-options-${item.horizon}`}
              >
                {t(horizonKeys[item.horizon])}
              </Button>
            ))}
          </div>
        )}
      </div>

      {!outlook.available || !selected ? (
        <div
          className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
          data-testid="options-insufficient"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm leading-relaxed">{t("optionsInsufficient")}</p>
        </div>
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {t("optionsExpectedRange")}
              </p>
              <p className="mt-1 font-mono text-lg font-bold text-slate-900 dark:text-white">
                {money(selected.lowerPrice)} – {money(selected.upperPrice)}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {t("optionsTypicalMove")}
              </p>
              <p className="mt-1 font-mono text-lg font-bold text-slate-900 dark:text-white">
                ±{money(selected.expectedMove)} ({selected.expectedMovePercent.toFixed(1)}%)
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {t("optionsHistoricalVolatility")}
              </p>
              <p className="mt-1 font-mono text-lg font-bold text-slate-900 dark:text-white">
                {outlook.realizedVolatilityPercent?.toFixed(1) ?? "—"}%
              </p>
              {outlook.volatilityPercentile !== null && (
                <p className="mt-1 text-xs text-slate-500">
                  {t("optionsVolatilityPercentile")} {outlook.volatilityPercentile.toFixed(0)}%
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {(["call", "put"] as const).map((side) => {
              const reading = selected[side];
              const favorable = reading.status === "favorable";
              const Icon = side === "call" ? ArrowUp : ArrowDown;
              return (
                <article
                  key={side}
                  className={cn(
                    "rounded-2xl border-2 p-5",
                    favorable
                      ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/35"
                      : "border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/35",
                  )}
                  data-testid={`card-options-${side}`}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          favorable ? "text-emerald-600" : "text-rose-600",
                        )}
                      />
                      <h3 className="text-lg font-black uppercase text-slate-900 dark:text-white">
                        {side === "call" ? t("optionsCall") : t("optionsPut")}
                      </h3>
                    </div>
                    <Badge
                      className={cn(
                        "border-0",
                        favorable
                          ? "bg-emerald-600 text-white"
                          : "bg-rose-600 text-white",
                      )}
                      data-testid={`status-options-${side}`}
                    >
                      {favorable ? (
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="mr-1 h-3.5 w-3.5" />
                      )}
                      {favorable ? t("optionsFavorable") : t("optionsUnfavorable")}
                    </Badge>
                  </div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                    {t("optionsHistoricalScore")}: {reading.score}/100
                  </p>
                  <ul className="space-y-2">
                    {reading.reasons.map((reason) => (
                      <li
                        key={reason}
                        className="flex gap-2 text-sm leading-snug text-slate-700 dark:text-slate-200"
                      >
                        <span className="mt-1 text-xs">•</span>
                        <span>{t(reasonKeys[reason])}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </>
      )}

      <p className="mt-5 border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:text-slate-400">
        {t("optionsDisclaimer")}
      </p>
    </section>
  );
}