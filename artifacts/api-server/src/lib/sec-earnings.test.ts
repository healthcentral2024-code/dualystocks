import { afterEach, describe, expect, it, vi } from "vitest";
import { getLastEarningsDate } from "./sec-earnings";
import { parseNextEarningsDate } from "./finviz";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getLastEarningsDate", () => {
  it("returns the latest SEC 8-K Item 2.02 filing date", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            0: { cik_str: 320193, ticker: "AAPL", title: "Apple Inc." },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            filings: {
              recent: {
                form: ["4", "8-K", "8-K"],
                items: ["", "2.02,9.01", "5.02,9.01"],
                filingDate: ["2026-08-20", "2026-07-30", "2026-06-01"],
              },
            },
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getLastEarningsDate("AAPL")).resolves.toBe("2026-07-30");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("parseNextEarningsDate", () => {
  it("converts a Finviz earnings date to an ISO date", () => {
    expect(
      parseNextEarningsDate("Oct 30 AMC", new Date("2026-08-24T12:00:00Z")),
    ).toBe("2026-10-30");
  });

  it("accepts Finviz numeric dates too", () => {
    expect(parseNextEarningsDate("08/27/2026 AMC")).toBe("2026-08-27");
  });
});