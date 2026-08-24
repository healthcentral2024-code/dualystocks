import { describe, it, expect } from "vitest";
import { buildFilters } from "./screener";
import { GetScreenerQueryParams } from "@workspace/api-zod";

const parse = (q: Record<string, string>) => GetScreenerQueryParams.parse(q);
const parts = (f: string) => f.split(",").filter(Boolean).sort();

describe("buildFilters — preset 'estrategia' (Mi Estrategia)", () => {
  it("applies cap > $500M and +50% upside by default (countries open)", () => {
    const f = buildFilters(parse({ preset: "estrategia" }));
    expect(parts(f)).toEqual(["cap_o0.5", "targetprice_a50"]);
  });

  it("keeps strategy defaults when the UI re-sends the same values", () => {
    const f = buildFilters(
      parse({ preset: "estrategia", cap: "over500", country: "all", targetUpside: "a50" }),
    );
    expect(parts(f)).toEqual(["cap_o0.5", "targetprice_a50"]);
    // No duplicated family codes
    expect(f.split(",").length).toBe(new Set(f.split(",")).size);
  });

  it("maps recom=holdworse to an_recom_holdworse", () => {
    const f = buildFilters(parse({ preset: "estrategia", recom: "holdworse" }));
    expect(parts(f)).toContain("an_recom_holdworse");
  });

  it("replaces a strategy criterion when the user picks another value", () => {
    const f = buildFilters(
      parse({ preset: "estrategia", cap: "over1000", country: "europe", targetUpside: "a30" }),
    );
    expect(parts(f)).toEqual(["cap_o1", "geo_europe", "targetprice_a30"]);
  });

  it("removes a strategy criterion when the user selects 'all', and applies a chosen country", () => {
    const f = buildFilters(
      parse({ preset: "estrategia", cap: "all", country: "usa", targetUpside: "a50" }),
    );
    expect(parts(f)).toEqual(["geo_usa", "targetprice_a50"]);
  });

  it("removes every strategy criterion on Limpiar (all three set to 'all')", () => {
    const f = buildFilters(
      parse({ preset: "estrategia", cap: "all", country: "all", targetUpside: "all" }),
    );
    expect(f).toBe("");
  });
});

describe("buildFilters — other presets keep their built-in constraints", () => {
  it("'valor' preset is untouched when no overrides are sent", () => {
    const f = buildFilters(parse({ preset: "valor" }));
    expect(f).toContain("cap_midover");
    expect(f).toContain("fa_pe_u20");
  });

  it("cap override replaces the preset's cap family only", () => {
    const f = buildFilters(parse({ preset: "valor", cap: "over500" }));
    expect(f).not.toContain("cap_midover");
    expect(f).toContain("cap_o0.5");
    expect(f).toContain("fa_pe_u20");
  });
});
