import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "wouter";
import { Check, Crown, Home, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { Button } from "@/components/ui/button";

const API = `${import.meta.env.BASE_URL}api`;

interface Plan {
  product_id: string;
  name: string;
  description: string | null;
  price_id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string } | null;
}

interface SubscriptionStatus {
  active: boolean;
  status: string | null;
  isAdmin?: boolean;
  founder?: boolean;
  cancelAtPeriodEnd?: boolean;
  trialEnd?: number | string | null;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export function useSubscription() {
  return useQuery<SubscriptionStatus>({
    queryKey: ["billing", "subscription"],
    queryFn: () => fetchJson(`${API}/billing/subscription`),
    staleTime: 60_000,
  });
}

export default function Subscribe() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const estado = searchParams.get("estado");
  const [redirecting, setRedirecting] = useState<string | null>(null);

  const { data: sub } = useSubscription();
  const { data: plansData, isLoading } = useQuery<{ plans: Plan[] }>({
    queryKey: ["billing", "plans"],
    queryFn: () => fetchJson(`${API}/billing/plans`),
  });

  const plans = (plansData?.plans ?? []).filter((p) => p.recurring);

  const startCheckout = async (priceId: string) => {
    setRedirecting(priceId);
    try {
      const { url } = await fetchJson<{ url: string }>(`${API}/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      window.location.href = url;
    } catch {
      setRedirecting(null);
    }
  };

  const openPortal = async () => {
    setRedirecting("portal");
    try {
      const { url } = await fetchJson<{ url: string }>(`${API}/billing/portal`, {
        method: "POST",
      });
      window.location.href = url;
    } catch {
      setRedirecting(null);
    }
  };

  return (
    <div className="min-h-screen px-4 py-12 flex flex-col items-center">
      <div className="max-w-3xl w-full text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-4 py-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-4">
          <Crown className="h-4 w-4" />
          DualyStocks Premium
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
          {t("subTitle")}
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mb-2">{t("subSubtitle")}</p>
        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-8">
          {t("subTrialNote")}
        </p>

        {estado === "ok" && (
          <div className="mb-8 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 dark:border-emerald-700 px-4 py-3 text-emerald-800 dark:text-emerald-200 font-medium">
            {t("subSuccessMsg")}
          </div>
        )}
        {estado === "cancelado" && (
          <div className="mb-8 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/30 dark:border-amber-700 px-4 py-3 text-amber-800 dark:text-amber-200 font-medium">
            {t("subCancelledMsg")}
          </div>
        )}

        {sub?.active ? (
          <div className="rounded-2xl border bg-white dark:bg-slate-900 p-8 shadow-sm">
            <p className="text-lg font-semibold mb-1">{t("subActiveTitle")}</p>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              {sub.status === "trialing" ? t("subActiveTrial") : t("subActiveBody")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                asChild
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                data-testid="button-back-home"
              >
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  {t("subBackHomeBtn")}
                </Link>
              </Button>
              <Button onClick={openPortal} disabled={redirecting !== null} variant="outline">
                {redirecting === "portal" && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t("subManageBtn")}
              </Button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {plans.map((plan) => {
              const yearly = plan.recurring?.interval === "year";
              const amount = plan.unit_amount / 100;
              return (
                <div
                  key={plan.price_id}
                  className={`rounded-2xl border p-8 text-left shadow-sm bg-white dark:bg-slate-900 ${yearly ? "border-emerald-500 ring-2 ring-emerald-500/30 relative" : ""}`}
                >
                  {yearly && (
                    <span className="absolute -top-3 left-6 rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-bold text-white">
                      {t("subBestValue")}
                    </span>
                  )}
                  <p className="font-semibold mb-1">
                    {yearly ? t("subYearlyPlan") : t("subMonthlyPlan")}
                  </p>
                  <p className="text-4xl font-extrabold mb-1">
                    ${amount}
                    <span className="text-base font-medium text-slate-500">
                      /{yearly ? t("subPerYear") : t("subPerMonth")}
                    </span>
                  </p>
                  <p className="text-sm text-slate-500 mb-6">
                    {yearly ? t("subYearlySavings") : t("subMonthlyHint")}
                  </p>
                  <ul className="space-y-2 mb-6 text-sm">
                    {[t("subFeature1"), t("subFeature2"), t("subFeature3")].map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={redirecting !== null}
                    onClick={() => startCheckout(plan.price_id)}
                  >
                    {redirecting === plan.price_id && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    {t("subStartTrialBtn")}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-8 text-xs text-slate-500">{t("subFinePrint")}</p>
      </div>
    </div>
  );
}
