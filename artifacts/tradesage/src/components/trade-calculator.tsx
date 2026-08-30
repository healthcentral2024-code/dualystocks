import { useState, useMemo } from "react";
import { Calculator, TrendingDown, TrendingUp, AlertCircle, Target, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/language";

function fmtUsd(n: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: n < 1 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtPct(n: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: "always",
  }).format(n / 100);
}

interface TradeCalculatorProps {
  currentPrice: number;
  analystTargetPrice?: number | null;
}

export function TradeCalculator({ currentPrice, analystTargetPrice }: TradeCalculatorProps) {
  const { t, locale } = useLanguage();

  const defaultTarget = (analystTargetPrice && analystTargetPrice > currentPrice)
    ? analystTargetPrice
    : currentPrice * 1.05;

  const [investmentStr, setInvestmentStr] = useState("1000");
  const [entryPriceStr, setEntryPriceStr] = useState(currentPrice.toString());
  const [targetPriceStr, setTargetPriceStr] = useState(defaultTarget.toFixed(2));
  const [stopLossStr, setStopLossStr] = useState("");

  const results = useMemo(() => {
    const investment = parseFloat(investmentStr);
    const entry = parseFloat(entryPriceStr);
    const target = parseFloat(targetPriceStr);
    const stopLoss = stopLossStr ? parseFloat(stopLossStr) : null;

    if (isNaN(investment) || investment <= 0 || isNaN(entry) || entry <= 0 || isNaN(target) || target <= 0) {
      return { error: t("calcInvalid") } as const;
    }

    if (target <= entry) {
      return { error: t("calcInvalid") } as const;
    }

    if (stopLoss !== null && (isNaN(stopLoss) || stopLoss <= 0 || stopLoss >= entry)) {
      return { error: t("calcInvalidStopLoss") } as const;
    }

    const shares = Math.floor(investment / entry);
    if (shares < 1) {
      return { error: t("calcInsufficientFunds") } as const;
    }
    const investedAmount = shares * entry;
    const cashLeft = investment - investedAmount;

    const profitPerShare = target - entry;
    const totalProfit = shares * profitPerShare;
    const finalValue = investment + totalProfit;
    const returnPercent = (profitPerShare / entry) * 100;

    let lossData = null;
    if (stopLoss !== null) {
      const lossPerShare = entry - stopLoss;
      const totalLoss = shares * lossPerShare;
      const lossPercent = (lossPerShare / entry) * 100;
      const rewardRisk = profitPerShare / lossPerShare;

      lossData = {
        lossPerShare,
        totalLoss,
        lossPercent: -lossPercent,
        rewardRisk,
      };
    }

    return {
      shares,
      cashLeft,
      profitPerShare,
      totalProfit,
      finalValue,
      returnPercent,
      lossData,
    };
  }, [investmentStr, entryPriceStr, targetPriceStr, stopLossStr, t]);

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both rounded-3xl border-2 border-emerald-300/70 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/60 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-950/20 p-6 md:p-8 shadow-lg space-y-6" data-testid="section-trade-calculator">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl shadow-sm border border-emerald-200 dark:border-emerald-800/50">
          <Calculator className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-display font-bold text-slate-900 dark:text-white">
            {t("calcTitle")}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
            {t("calcSubtitle")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Inputs */}
        <div className="lg:col-span-5 space-y-5 bg-white/60 dark:bg-slate-950/40 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
          <div className="space-y-2">
            <Label htmlFor="calc-investment" className="text-slate-700 dark:text-slate-300 font-bold">{t("calcInvestment")}</Label>
            <Input 
              id="calc-investment" 
              type="number" 
              min="1" 
              step="1"
              value={investmentStr} 
              onChange={(e) => setInvestmentStr(e.target.value)} 
              className="bg-white dark:bg-slate-900 font-mono font-bold text-lg"
              data-testid="input-calc-investment"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calc-entry" className="text-slate-700 dark:text-slate-300 font-bold">{t("calcEntryPrice")}</Label>
              <Input 
                id="calc-entry" 
                type="number" 
                min="0.01" 
                step="0.01"
                value={entryPriceStr} 
                onChange={(e) => setEntryPriceStr(e.target.value)} 
                className="bg-white dark:bg-slate-900 font-mono"
                data-testid="input-calc-entry"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calc-target" className="text-slate-700 dark:text-slate-300 font-bold text-emerald-700 dark:text-emerald-400">{t("calcTargetPrice")}</Label>
              <Input 
                id="calc-target" 
                type="number" 
                min="0.01" 
                step="0.01"
                value={targetPriceStr} 
                onChange={(e) => setTargetPriceStr(e.target.value)} 
                className="bg-white dark:bg-slate-900 border-emerald-300 focus-visible:ring-emerald-500 font-mono"
                data-testid="input-calc-target"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-emerald-100 dark:border-emerald-800/30">
            <Label htmlFor="calc-stoploss" className="text-slate-700 dark:text-slate-300 font-bold">{t("calcStopLoss")}</Label>
            <Input 
              id="calc-stoploss" 
              type="number" 
              min="0.01" 
              step="0.01"
              placeholder={t("calcStopLossPlaceholder")}
              value={stopLossStr} 
              onChange={(e) => setStopLossStr(e.target.value)} 
              className="bg-white dark:bg-slate-900 font-mono"
              data-testid="input-calc-stoploss"
            />
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          {"error" in results ? (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 h-full min-h-[200px]">
              <AlertCircle className="w-8 h-8 text-rose-500" />
              <p className="text-rose-700 dark:text-rose-400 font-medium">
                {results.error}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Shares & Cash */}
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50 px-4 py-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                <span className="flex items-center gap-1.5" data-testid="calc-result-shares">
                  <Target className="w-4 h-4 text-slate-400" />
                  {t("calcShares")}: <strong className="text-slate-900 dark:text-white">{results.shares}</strong>
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span data-testid="calc-result-cash">
                  {t("calcCashLeft")}: <strong className="text-slate-900 dark:text-white font-mono">{fmtUsd(results.cashLeft, locale)}</strong>
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 items-stretch">
                {/* Good Outcome */}
                <div className="bg-emerald-600 dark:bg-emerald-500/20 text-white rounded-2xl p-5 shadow-md border border-transparent dark:border-emerald-500/30 relative overflow-hidden flex flex-col justify-between" data-testid="calc-card-profit">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 dark:bg-emerald-400/10 rounded-full blur-2xl -z-10 translate-x-1/2 -translate-y-1/2" />
                  
                  <h3 className="text-emerald-100 dark:text-emerald-400 font-bold uppercase tracking-widest text-[11px] mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    {t("calcGoodOutcome")}
                  </h3>
                  
                  <div className="space-y-3 relative z-10">
                    <div>
                      <p className="text-emerald-100/80 dark:text-emerald-200/60 text-xs mb-1">{t("calcTotalProfit")}</p>
                      <p className="text-3xl font-display font-bold text-white drop-shadow-sm flex items-baseline gap-2">
                        +{fmtUsd(results.totalProfit, locale)}
                        <span className="text-lg text-emerald-200 dark:text-emerald-300">({fmtPct(results.returnPercent, locale)})</span>
                      </p>
                    </div>
                    <div className="pt-3 border-t border-emerald-500/50 dark:border-emerald-500/30 flex justify-between items-end">
                      <div>
                        <p className="text-emerald-100/80 dark:text-emerald-200/60 text-[11px] uppercase tracking-wide">{t("calcFinalValue")}</p>
                        <p className="font-mono font-bold text-lg mt-0.5">{fmtUsd(results.finalValue, locale)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-100/80 dark:text-emerald-200/60 text-[11px] uppercase tracking-wide">{t("calcProfitPerShare")}</p>
                        <p className="font-mono font-bold text-sm mt-0.5">+{fmtUsd(results.profitPerShare, locale)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bad Outcome (Stop Loss) */}
                {results.lossData ? (
                  <div className="bg-white dark:bg-slate-900 border-2 border-rose-200 dark:border-rose-900/50 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between" data-testid="calc-card-loss">
                    <div className="absolute bottom-0 right-0 w-24 h-24 bg-rose-50 dark:bg-rose-900/10 rounded-full blur-xl -z-10 translate-x-1/3 translate-y-1/3" />
                    
                    <h3 className="text-rose-600 dark:text-rose-400 font-bold uppercase tracking-widest text-[11px] mb-4 flex items-center gap-2">
                      <TrendingDown className="w-4 h-4" />
                      {t("calcBadOutcome")}
                    </h3>
                    
                    <div className="space-y-3 relative z-10">
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">{t("calcTotalLoss")}</p>
                        <p className="text-2xl font-display font-bold text-slate-900 dark:text-white flex items-baseline gap-2">
                          -{fmtUsd(results.lossData.totalLoss, locale)}
                          <span className="text-base text-rose-500">({fmtPct(results.lossData.lossPercent, locale)})</span>
                        </p>
                      </div>
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end">
                        <div>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wide">{t("calcRewardRisk")}</p>
                          <p className="font-mono font-bold text-slate-700 dark:text-slate-300 text-base mt-0.5">{results.lossData.rewardRisk.toFixed(2)}x</p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wide">{t("calcLossPerShare")}</p>
                          <p className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm mt-0.5">-{fmtUsd(results.lossData.lossPerShare, locale)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-full shadow-sm">
                      <AlertTriangle className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-[200px]">
                      {t("calcAddStopLoss")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
