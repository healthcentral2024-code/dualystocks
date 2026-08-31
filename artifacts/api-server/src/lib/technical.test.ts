import { describe, expect, it } from "vitest";
import {
  buildTechnicalReading,
  computeOptionsHistoricalOutlook,
  type Candle,
} from "./technical";

function candlesFromCloses(closes: number[]): Candle[] {
  return closes.map((close, index) => ({
    date: `2026-01-${String(index + 1).padStart(2, "0")}`,
    open: close,
    high: close * 1.01,
    low: close * 0.99,
    close,
    volume: 1_000_000,
  }));
}

describe("computeOptionsHistoricalOutlook", () => {
  it("returns insufficient data rather than inventing a signal", () => {
    const candles = candlesFromCloses(Array.from({ length: 40 }, (_, i) => 100 + i));
    const result = computeOptionsHistoricalOutlook(
      candles,
      buildTechnicalReading(candles),
    );
    expect(result.available).toBe(false);
    expect(result.horizons).toEqual([]);
  });

  it("marks only CALL favorable in a clear rising trend", () => {
    const candles = candlesFromCloses(
      Array.from({ length: 252 }, (_, i) => 80 + i * 0.2 + Math.sin(i / 3)),
    );
    const result = computeOptionsHistoricalOutlook(
      candles,
      buildTechnicalReading(candles),
    );
    expect(result.available).toBe(true);
    expect(result.horizons).toHaveLength(3);
    for (const horizon of result.horizons) {
      expect(horizon.call.status).toBe("favorable");
      expect(horizon.put.status).toBe("unfavorable");
      expect(horizon.lowerPrice).toBeLessThan(horizon.upperPrice);
    }
  });

  it("marks only PUT favorable in a clear falling trend", () => {
    const candles = candlesFromCloses(
      Array.from({ length: 252 }, (_, i) => 180 - i * 0.25 + Math.sin(i / 3)),
    );
    const result = computeOptionsHistoricalOutlook(
      candles,
      buildTechnicalReading(candles),
    );
    expect(result.available).toBe(true);
    for (const horizon of result.horizons) {
      expect(horizon.call.status).toBe("unfavorable");
      expect(horizon.put.status).toBe("favorable");
    }
  });

  it("never marks both directions favorable for the same horizon", () => {
    const candles = candlesFromCloses(
      Array.from({ length: 252 }, (_, i) => 100 + Math.sin(i / 2) * 3),
    );
    const result = computeOptionsHistoricalOutlook(
      candles,
      buildTechnicalReading(candles),
    );
    for (const horizon of result.horizons) {
      expect(
        horizon.call.status === "favorable" &&
          horizon.put.status === "favorable",
      ).toBe(false);
    }
  });
});