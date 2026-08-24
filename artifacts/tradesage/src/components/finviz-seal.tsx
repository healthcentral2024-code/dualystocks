import { BadgeCheck } from "lucide-react";
import { useLanguage } from "@/lib/language";

/**
 * "Powered by Finviz Elite" seal. `variant`:
 * - "seal": prominent card-like badge for registration pages
 * - "inline": compact strip for headers/footers inside the app
 * - "inline-dark": compact strip for dark backgrounds
 */
export function FinvizSeal({
  variant = "seal",
}: {
  variant?: "seal" | "inline" | "inline-dark";
}) {
  const { t } = useLanguage();
  const base = import.meta.env.BASE_URL;

  if (variant !== "seal") {
    const dark = variant === "inline-dark";
    return (
      <div
        data-testid="badge-finviz"
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${
          dark
            ? "border-white/20 bg-white/10 text-slate-200"
            : "border-border bg-card/80 text-muted-foreground"
        }`}
      >
        <BadgeCheck className={`h-4 w-4 ${dark ? "text-emerald-400" : "text-emerald-600"}`} />
        <span className="text-xs font-semibold whitespace-nowrap">{t("finvizPoweredBy")}</span>
        <img
          src={`${base}${dark ? "finviz-dark.svg" : "finviz-light.svg"}`}
          alt="Finviz"
          className="h-4 w-auto"
          loading="lazy"
        />
        <span
          className={`rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${
            dark ? "bg-amber-400/90 text-slate-900" : "bg-amber-400 text-slate-900"
          }`}
        >
          ELITE
        </span>
      </div>
    );
  }

  return (
    <div
      data-testid="seal-finviz"
      className="w-full max-w-md rounded-2xl border-2 border-emerald-200 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/40 dark:to-slate-900 p-4 shadow-md"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-700">
          <BadgeCheck className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              {t("finvizPoweredBy")}
            </span>
            <img
              src={`${base}finviz-light.svg`}
              alt="Finviz"
              className="h-5 w-auto dark:hidden"
              loading="lazy"
            />
            <img
              src={`${base}finviz-dark.svg`}
              alt="Finviz"
              className="h-5 w-auto hidden dark:block"
              loading="lazy"
            />
            <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-slate-900">
              ELITE
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-snug">
            {t("finvizSealNote")}
          </p>
        </div>
      </div>
    </div>
  );
}
