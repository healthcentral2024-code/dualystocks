import { useState, useMemo, useEffect, KeyboardEvent } from "react";
import { Calculator, TrendingDown, TrendingUp, AlertCircle, Target, AlertTriangle, Plus, Trash2, Trophy, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/lib/language";
import { useQueries } from "@tanstack/react-query";
import { getGetAnalysisQueryOptions } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

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
  ticker?: string;
  currentPrice: number;
  analystTargetPrice?: number | null;
}

interface StoredComparisonState {
  investment: string;
  symbols: string[];
  targets: Record<string, string>;
}

function readStoredComparison(initialTicker?: string): StoredComparisonState {
  const fallback = {
    investment: "1000",
    symbols: initialTicker ? [initialTicker] : [],
    targets: {},
  };
  if (!initialTicker) return fallback;
  try {
    const parsed = JSON.parse(
      sessionStorage.getItem(`dualy-comparison-${initialTicker}`) ?? "null",
    ) as Partial<StoredComparisonState> | null;
    if (!parsed || !Array.isArray(parsed.symbols)) return fallback;
    const symbols = parsed.symbols
      .filter((symbol): symbol is string => typeof symbol === "string" && /^[A-Z][A-Z0-9.-]{0,9}$/.test(symbol))
      .slice(0, 5);
    if (!symbols.includes(initialTicker)) symbols.unshift(initialTicker);
    return {
      investment: typeof parsed.investment === "string" ? parsed.investment : "1000",
      symbols: symbols.slice(0, 5),
      targets: parsed.targets && typeof parsed.targets === "object" ? parsed.targets : {},
    };
  } catch {
    return fallback;
  }
}

export function TradeCalculator(props: TradeCalculatorProps) {
  const { t } = useLanguage();
  const modeStorageKey = `dualy-calculator-mode-${props.ticker ?? "default"}`;
  const [activeMode, setActiveMode] = useState<"single" | "compare">(() =>
    sessionStorage.getItem(modeStorageKey) === "compare" ? "compare" : "single",
  );

  useEffect(() => {
    sessionStorage.setItem(modeStorageKey, activeMode);
  }, [activeMode, modeStorageKey]);

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both rounded-3xl border-2 border-emerald-300/70 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/60 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-950/20 p-6 md:p-8 shadow-lg space-y-6" data-testid="section-trade-calculator">
      <div className="flex items-center justify-between flex-wrap gap-4">
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
      </div>

      <Tabs
        value={activeMode}
        onValueChange={(value) => setActiveMode(value === "compare" ? "compare" : "single")}
        className="w-full"
      >
        <TabsList className="mb-6 grid w-full max-w-md grid-cols-2 bg-emerald-100/50 dark:bg-emerald-950/50 p-1 border border-emerald-200/50 dark:border-emerald-900/50 rounded-xl">
          <TabsTrigger value="single" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/80 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300 font-bold data-[state=active]:shadow-sm transition-all" data-testid="tab-calc-single">
            {t("calcTabSingle")}
          </TabsTrigger>
          <TabsTrigger value="compare" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/80 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300 font-bold data-[state=active]:shadow-sm transition-all" data-testid="tab-calc-compare">
            {t("calcTabCompare")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="focus-visible:outline-none focus-visible:ring-0">
          <SingleCalculator {...props} />
        </TabsContent>

        <TabsContent value="compare" className="focus-visible:outline-none focus-visible:ring-0">
          <CompareCalculator {...props} />
        </TabsContent>
      </Tabs>
    </section>
  );
}

function SingleCalculator({ currentPrice, analystTargetPrice }: TradeCalculatorProps) {
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
  );
}

function CompareCalculator({ ticker: initialTicker }: TradeCalculatorProps) {
  const { t, locale, lang } = useLanguage();
  const initialState = useMemo(() => readStoredComparison(initialTicker), [initialTicker]);
  const [globalInvestmentStr, setGlobalInvestmentStr] = useState(initialState.investment);
  const [symbols, setSymbols] = useState<string[]>(initialState.symbols);
  const [newSymbol, setNewSymbol] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [targetOverrides, setTargetOverrides] = useState<Record<string, string>>(initialState.targets);

  const investment = parseFloat(globalInvestmentStr) || 0;

  useEffect(() => {
    if (!initialTicker) return;
    sessionStorage.setItem(
      `dualy-comparison-${initialTicker}`,
      JSON.stringify({
        investment: globalInvestmentStr,
        symbols,
        targets: targetOverrides,
      } satisfies StoredComparisonState),
    );
  }, [globalInvestmentStr, initialTicker, symbols, targetOverrides]);

  const queries = useQueries({
    queries: symbols.map((sym) => {
      const opts = getGetAnalysisQueryOptions(sym, { lang });
      return {
        ...opts,
        retry: false,
        staleTime: Infinity,
      };
    })
  });

  const handleAddSymbol = () => {
    const sym = newSymbol.trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(sym)) {
      setAddError(t("calcCompareInvalid"));
      return;
    }
    if (symbols.length >= 5) {
      setAddError(t("calcCompareMaxReached"));
      return;
    }
    if (symbols.includes(sym)) {
      setAddError(t("calcCompareDuplicate"));
      return;
    }
    setSymbols([...symbols, sym]);
    setNewSymbol("");
    setAddError(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSymbol();
    }
  };

  const handleRemoveSymbol = (sym: string) => {
    if (symbols.length <= 1) return;
    setSymbols(symbols.filter(s => s !== sym));
    const nextOverrides = { ...targetOverrides };
    delete nextOverrides[sym];
    setTargetOverrides(nextOverrides);
  };

  // Compute stats for each loaded symbol
  const computedStats = useMemo(() => {
    return symbols.map((sym, i) => {
      const query = queries[i];
      if (!query.data || query.isError) {
        return { sym, isLoading: query.isLoading, isError: query.isError, data: null };
      }
      const data = query.data;
      const entry = data.price;
      const defaultTarget = (data.targetPrice && data.targetPrice > entry) 
        ? data.targetPrice 
        : entry * 1.05;
      
      const targetStr = targetOverrides[sym] ?? defaultTarget.toFixed(2);
      const target = parseFloat(targetStr);

      let totalProfit = 0;
      let finalValue = 0;
      let profitPerShare = 0;
      let returnPercent = 0;
      let cashLeft = 0;
      let shares = 0;
      let valid = true;
      let invalidReason = "";

      if (investment > 0 && entry > 0 && target > entry) {
        shares = Math.floor(investment / entry);
        if (shares >= 1) {
          profitPerShare = target - entry;
          totalProfit = shares * profitPerShare;
          finalValue = investment + totalProfit;
          returnPercent = (profitPerShare / entry) * 100;
          cashLeft = investment - (shares * entry);
        } else {
          valid = false;
          invalidReason = t("calcInsufficientFunds");
        }
      } else {
        valid = false;
        invalidReason = t("calcInvalid");
      }

      return {
        sym,
        isLoading: false,
        isError: false,
        data,
        targetStr,
        shares,
        profitPerShare,
        totalProfit,
        finalValue,
        returnPercent,
        cashLeft,
        valid,
        invalidReason,
      };
    });
  }, [symbols, queries, investment, targetOverrides, t]);

  const validProfits = computedStats.filter(c => c.valid && c.data).map(c => c.totalProfit as number);
  const maxProfit = validProfits.length > 0 ? Math.max(...validProfits) : 0;

  // Don't sort the rows to avoid aggressive reordering while user is typing.
  // Instead, compute the rank for each valid stat and display it.
  const rankedValidStats = [...computedStats]
    .filter(c => c.valid && c.data)
    .sort((a, b) => (b.totalProfit as number) - (a.totalProfit as number));

  const getRank = (sym: string) => {
    const idx = rankedValidStats.findIndex(c => c.sym === sym);
    return idx >= 0 ? idx + 1 : null;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500" data-testid="calc-compare-mode">
      <div className="bg-white/60 dark:bg-slate-950/40 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 grid grid-cols-1 md:grid-cols-12 gap-6 items-end">

        <div className="md:col-span-4 space-y-2">
          <Label htmlFor="calc-global-investment" className="text-slate-700 dark:text-slate-300 font-bold">
            {t("calcCompareGlobalInvestment")}
          </Label>
          <Input 
            id="calc-global-investment" 
            type="number" 
            min="1" 
            step="1"
            value={globalInvestmentStr} 
            onChange={(e) => setGlobalInvestmentStr(e.target.value)} 
            className="bg-white dark:bg-slate-900 font-mono font-bold text-lg"
            data-testid="input-compare-investment"
          />
        </div>
        
        <div className="md:col-span-8 flex flex-col md:flex-row gap-3 items-end">
          <div className="space-y-2 flex-1 w-full">
            <Label htmlFor="calc-add-symbol" className="text-slate-700 dark:text-slate-300 font-bold">
              {t("calcCompareAddTicker")}
            </Label>
            <Input
              id="calc-add-symbol"
              placeholder={t("calcComparePlaceholder")}
              value={newSymbol}
              onChange={(e) => {
                setNewSymbol(e.target.value);
                setAddError(null);
              }}
              onKeyDown={handleKeyDown}
              className="bg-white dark:bg-slate-900 uppercase"
              disabled={symbols.length >= 5}
              aria-invalid={!!addError}
              data-testid="input-compare-add"
            />
            {addError && (
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400" data-testid="status-compare-add-error">
                {addError}
              </p>
            )}
          </div>
          <Button 
            onClick={handleAddSymbol}
            disabled={symbols.length >= 5 || !newSymbol.trim()}
            className="gap-2 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold w-full md:w-auto"
            data-testid="btn-compare-add"
          >
            <Plus className="w-4 h-4" />
            {t("calcCompareAdd")}
          </Button>
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium px-2">
        {t("calcCompareHelp")} {symbols.length >= 5 && <span className="text-rose-500 font-bold ml-2">({t("calcCompareMaxReached")})</span>}
      </p>

      <div className="space-y-4">
        {computedStats.map((stat) => {
          const rank = getRank(stat.sym);
          const isWinner = rank === 1;
          const progressVal = maxProfit > 0 && stat.valid ? (stat.totalProfit / maxProfit) * 100 : 0;

          return (
            <div 
              key={stat.sym} 
              className={cn(
                "relative overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-2xl border transition-all",
                isWinner 
                  ? "border-amber-300 dark:border-amber-500/50 shadow-md ring-1 ring-amber-100 dark:ring-amber-900/30" 
                  : "border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-200 dark:hover:border-emerald-800/50"
              )}
              data-testid={`compare-row-${stat.sym}`}
            >
              {isWinner ? (
                <div className="absolute top-0 right-0 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1.5">
                  <Trophy className="w-3 h-3" />
                  {t("calcCompareHighest")}
                </div>
              ) : rank !== null && (
                <div className="absolute top-0 right-0 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1.5">
                  {t("calcCompareRank")} {rank}
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-6 md:items-center">
                {/* Info & Inputs */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">{stat.sym}</h3>
                        {stat.data && (
                          <span className="text-sm font-mono text-slate-500 dark:text-slate-400">
                            {fmtUsd(stat.data.price, locale)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{stat.data?.companyName}</p>
                    </div>

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveSymbol(stat.sym)}
                      disabled={symbols.length <= 1}
                      className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 -mt-1 -mr-2"
                      title={t("calcCompareRemove")}
                      data-testid={`btn-compare-remove-${stat.sym}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {stat.isLoading ? (
                    <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("calcCompareLoading")}
                    </div>
                  ) : stat.isError ? (
                    <div className="flex items-center gap-2 text-sm text-rose-500">
                      <AlertCircle className="w-4 h-4" />
                      {t("calcCompareError")}
                    </div>
                  ) : stat.data && (
                    <div className="flex items-center gap-3">
                      <Label htmlFor={`target-${stat.sym}`} className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">
                        {t("calcCompareTarget")}
                      </Label>
                      <Input
                        id={`target-${stat.sym}`}
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={stat.targetStr}
                        onChange={(e) => setTargetOverrides({ ...targetOverrides, [stat.sym]: e.target.value })}
                        className="h-8 w-24 px-2 font-mono text-sm bg-slate-50 dark:bg-slate-950"
                        data-testid={`input-compare-target-${stat.sym}`}
                      />
                    </div>
                  )}
                </div>

                {/* Results visualization */}
                {stat.data && (
                  <div className="flex-1 bg-slate-50 dark:bg-slate-950/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                    {stat.valid ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-0.5">
                              {t("calcCompareProfit")}
                            </p>
                            <p className="font-display font-bold text-2xl text-slate-900 dark:text-white leading-none flex items-baseline gap-2">
                              +{fmtUsd(stat.totalProfit, locale)}
                              <span className="text-sm text-emerald-600 dark:text-emerald-400 font-sans">({fmtPct(stat.returnPercent, locale)})</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                              {t("calcCompareFinalValue")}
                            </p>
                            <p className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                              {fmtUsd(stat.finalValue, locale)}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Progress 
                            value={progressVal} 
                            className={cn(
                              "h-2.5", 
                              isWinner ? "[&>div]:bg-amber-400 dark:[&>div]:bg-amber-500 bg-amber-100 dark:bg-amber-950/50" : "[&>div]:bg-emerald-500 bg-emerald-100 dark:bg-emerald-950/50"
                            )} 
                          />
                          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            <span>{stat.shares} {t("calcCompareShares").toLowerCase()} • {t("calcCashLeft")}: {fmtUsd(stat.cashLeft, locale)}</span>
                            <span>{fmtUsd(stat.profitPerShare, locale)} {t("calcComparePerShare")}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                       <div className="flex items-center justify-center h-full text-sm text-rose-500 font-medium px-4 text-center">
                         <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
                         <span>{stat.invalidReason}</span>
                       </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
