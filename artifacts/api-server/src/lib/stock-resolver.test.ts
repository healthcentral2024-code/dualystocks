import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveStockTicker } from "./stock-resolver";

function searchResponse(quotes: unknown[]): Response {
  return new Response(JSON.stringify({ quotes }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("resolveStockTicker", () => {
  it("resolves a company name that could otherwise look like a ticker", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        searchResponse([
          {
            symbol: "AAPL",
            quoteType: "EQUITY",
            exchange: "NMS",
            shortname: "Apple Inc.",
            longname: "Apple Inc.",
          },
        ]),
      ),
    );

    await expect(resolveStockTicker("Apple")).resolves.toBe("AAPL");
  });

  it("keeps an exact ticker match", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        searchResponse([
          {
            symbol: "MSFT",
            quoteType: "EQUITY",
            exchange: "NMS",
            shortname: "Microsoft Corporation",
          },
        ]),
      ),
    );

    await expect(resolveStockTicker("MSFT")).resolves.toBe("MSFT");
  });

  it("keeps a valid ticker available when name search is rate limited", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 429 })));

    await expect(resolveStockTicker("NVDA")).resolves.toBe("NVDA");
  });
});