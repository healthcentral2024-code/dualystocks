import { useEffect, useRef, useState, useMemo } from 'react';
import { createChart, ColorType, CrosshairMode, LineStyle, IChartApi, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/language';
import { cn } from '@/lib/utils';

interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradingChartProps {
  candles: Candle[];
  supportLevel?: number | null;
  resistanceLevel?: number | null;
}

type RangeOption = '1M' | '6M' | '1A' | '5A';

export function TradingChart({ candles, supportLevel, resistanceLevel }: TradingChartProps) {
  const { t } = useLanguage();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [range, setRange] = useState<RangeOption>('1A');

  // Compute SMAs
  const sma50Data = useMemo(() => computeSMA(candles, 50), [candles]);
  const sma200Data = useMemo(() => computeSMA(candles, 200), [candles]);

  useEffect(() => {
    if (!chartContainerRef.current || candles.length === 0) return;

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8', // slate-400
      },
      grid: {
        vertLines: { color: 'rgba(148, 163, 184, 0.1)' },
        horzLines: { color: 'rgba(148, 163, 184, 0.1)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: 'rgba(148, 163, 184, 0.2)',
      },
      timeScale: {
        borderColor: 'rgba(148, 163, 184, 0.2)',
        timeVisible: false,
      },
      autoSize: true,
    });
    chartRef.current = chart;

    // Candlestick Series
    const mainSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', // Emerald 500
      downColor: '#f43f5e', // Rose 500
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
    });

    const candleData = candles.map(c => ({
      time: c.date,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    mainSeries.setData(candleData);

    // Support / Resistance
    if (supportLevel !== undefined && supportLevel !== null) {
      mainSeries.createPriceLine({
        price: supportLevel,
        color: '#10b981',
        lineWidth: 2,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: t('chartSupport'),
      });
    }
    if (resistanceLevel !== undefined && resistanceLevel !== null) {
      mainSeries.createPriceLine({
        price: resistanceLevel,
        color: '#f43f5e',
        lineWidth: 2,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: t('chartResistance'),
      });
    }

    // Volume Series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // set as an overlay
    });
    chart.priceScale('').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    
    const volumeData = candles.map(c => ({
      time: c.date,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)',
    }));
    volumeSeries.setData(volumeData);

    // SMAs
    if (sma50Data.length > 0) {
      const sma50Series = chart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 1, title: 'SMA 50' });
      sma50Series.setData(sma50Data);
    }
    if (sma200Data.length > 0) {
      const sma200Series = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 1, title: 'SMA 200' });
      sma200Series.setData(sma200Data);
    }

    // ResizeObserver
    const ro = new ResizeObserver(handleResize);
    ro.observe(chartContainerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [candles, supportLevel, resistanceLevel, sma50Data, sma200Data, t]);

  // Handle Range Selection
  useEffect(() => {
    if (!chartRef.current || candles.length === 0) return;
    
    const chart = chartRef.current;
    const lastDate = new Date(candles[candles.length - 1].date);
    const startDate = new Date(lastDate);

    if (range === '1M') startDate.setMonth(startDate.getMonth() - 1);
    else if (range === '6M') startDate.setMonth(startDate.getMonth() - 6);
    else if (range === '1A') startDate.setFullYear(startDate.getFullYear() - 1);
    else if (range === '5A') startDate.setFullYear(startDate.getFullYear() - 5);

    const startString = startDate.toISOString().split('T')[0];
    const endString = lastDate.toISOString().split('T')[0];

    chart.timeScale().setVisibleRange({
      from: startString,
      to: endString,
    });
  }, [range, candles]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 items-center justify-between mb-2">
        <div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          {t('chartPriceEvolution')}
        </div>
        <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-xl shadow-inner border border-slate-200 dark:border-slate-700/50">
          {(['1M', '6M', '1A', '5A'] as const).map(r => (
            <Button
              key={r}
              variant={range === r ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setRange(r)}
              className={cn(
                "h-8 px-4 text-xs font-bold rounded-lg transition-all",
                range === r 
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/20 hover:bg-emerald-500" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-white hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-white"
              )}
            >
              {r}
            </Button>
          ))}
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full h-[400px]" />
    </div>
  );
}

function computeSMA(candles: Candle[], period: number) {
  const result = [];
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += candles[i - j].close;
    }
    result.push({ time: candles[i].date, value: sum / period });
  }
  return result;
}