import { afterEach, describe, expect, it, vi } from "vitest";
import { openai } from "@workspace/integrations-openai-ai-server";
import { getRecentStockNews } from "./news";

vi.mock("@workspace/integrations-openai-ai-server", () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.mocked(openai.chat.completions.create).mockReset();
});

describe("getRecentStockNews", () => {
  it("returns the three latest safe Finviz headlines", async () => {
    vi.stubEnv("FINVIZ_API_KEY", "test-key");
    const today = new Date().toISOString().slice(0, 10);
    const csv = [
      "Date,Title,Url",
      `${today} 09:00:00,First update,https://example.com/first`,
      `${today} 08:00:00,Second update,https://example.com/second`,
      `${today} 07:00:00,Third update,https://example.com/third`,
      `${today} 06:00:00,Fourth update,https://example.com/fourth`,
      `${today} 05:00:00,Unsafe update,javascript:alert(1)`,
    ].join("\n");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(csv, { status: 200 })));
    vi.mocked(openai.chat.completions.create).mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              items: [
                {
                  id: "headline-3",
                  sourceTitle: "Third update",
                  title: "Third update",
                  impact: "neutral",
                  reason: "The headline does not show a clearly favorable or unfavorable effect.",
                },
                {
                  id: "headline-1",
                  sourceTitle: "First update",
                  title: "First update",
                  impact: "positive",
                  reason: "The update is clearly favorable for the company.",
                },
                {
                  id: "headline-2",
                  sourceTitle: "Second update",
                  title: "Second update",
                  impact: "negative",
                  reason: "The update describes a clear setback for the company.",
                },
              ],
            }),
          },
        },
      ],
    } as never);

    await expect(getRecentStockNews("NEWS", "en")).resolves.toEqual([
      expect.objectContaining({
        title: "First update",
        url: "https://example.com/first",
        impact: "positive",
      }),
      expect.objectContaining({
        title: "Second update",
        url: "https://example.com/second",
        impact: "negative",
      }),
      expect.objectContaining({
        title: "Third update",
        url: "https://example.com/third",
        impact: "neutral",
      }),
    ]);
  });

  it("translates and classifies headlines when Spanish is selected", async () => {
    vi.stubEnv("FINVIZ_API_KEY", "test-key");
    const today = new Date().toISOString().slice(0, 10);
    const csv = [
      "Date,Title,Url",
      `${today} 09:00:00,Company raises guidance,https://example.com/guidance`,
    ].join("\n");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(csv, { status: 200 })));
    vi.mocked(openai.chat.completions.create).mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              items: [
                {
                  id: "headline-1",
                  sourceTitle: "Company raises guidance",
                  title: "La empresa eleva sus previsiones",
                  impact: "positive",
                  reason: "Elevar las previsiones indica mejores expectativas para el negocio.",
                },
              ],
            }),
          },
        },
      ],
    } as never);

    await expect(getRecentStockNews("SPANISH", "es")).resolves.toEqual([
      expect.objectContaining({
        title: "La empresa eleva sus previsiones",
        impact: "positive",
        impactReason: "Elevar las previsiones indica mejores expectativas para el negocio.",
      }),
    ]);
  });

  it("keeps source headlines visible with a neutral impact when analysis fails", async () => {
    vi.stubEnv("FINVIZ_API_KEY", "test-key");
    const today = new Date().toISOString().slice(0, 10);
    const csv = [
      "Date,Title,Url",
      `${today} 09:00:00,Company raises guidance,https://example.com/guidance`,
    ].join("\n");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(csv, { status: 200 })));
    vi.mocked(openai.chat.completions.create).mockRejectedValue(
      new Error("Translation temporarily unavailable"),
    );

    await expect(getRecentStockNews("SPANISH-FALLBACK", "es")).resolves.toEqual([
      expect.objectContaining({
        title: "Company raises guidance",
        impact: "neutral",
        impactReason:
          "El titular no aporta suficiente información para determinar un posible impacto.",
      }),
    ]);
  });

  it("falls back only the invalid item without blocking valid classifications", async () => {
    vi.stubEnv("FINVIZ_API_KEY", "test-key");
    const today = new Date().toISOString().slice(0, 10);
    const csv = [
      "Date,Title,Url",
      `${today} 09:00:00,Company misses estimates,https://example.com/miss`,
      `${today} 08:00:00,Company announces an event,https://example.com/event`,
    ].join("\n");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(csv, { status: 200 })));
    vi.mocked(openai.chat.completions.create).mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              items: [
                {
                  id: "headline-1",
                  sourceTitle: "Company misses estimates",
                  title: "Company misses estimates",
                  impact: "negative",
                  reason: "Missing estimates is a clearly unfavorable business result.",
                },
                {
                  id: "headline-2",
                  sourceTitle: "A different headline",
                  title: "Company announces an event",
                  impact: "positive",
                  reason: "The event is expected to benefit the company.",
                },
              ],
            }),
          },
        },
      ],
    } as never);

    await expect(getRecentStockNews("PARTIAL-FALLBACK", "en")).resolves.toEqual([
      expect.objectContaining({
        title: "Company misses estimates",
        impact: "negative",
      }),
      expect.objectContaining({
        title: "Company announces an event",
        impact: "neutral",
        impactReason:
          "The headline does not provide enough information to determine a possible impact.",
      }),
    ]);
  });

  it("rejects overlong or clearly wrong-language reasons", async () => {
    vi.stubEnv("FINVIZ_API_KEY", "test-key");
    const today = new Date().toISOString().slice(0, 10);
    const csv = [
      "Date,Title,Url",
      `${today} 09:00:00,Company raises outlook,https://example.com/outlook`,
      `${today} 08:00:00,Company opens a facility,https://example.com/facility`,
    ].join("\n");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(csv, { status: 200 })));
    vi.mocked(openai.chat.completions.create).mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              items: [
                {
                  id: "headline-1",
                  sourceTitle: "Company raises outlook",
                  title: "La empresa eleva sus perspectivas",
                  impact: "positive",
                  reason: "The company raised guidance.",
                },
                {
                  id: "headline-2",
                  sourceTitle: "Company opens a facility",
                  title: "La empresa abre una instalación",
                  impact: "positive",
                  reason: Array.from(
                    { length: 23 },
                    () => "favorable",
                  ).join(" "),
                },
              ],
            }),
          },
        },
      ],
    } as never);

    const news = await getRecentStockNews("INVALID-REASONS", "es");
    expect(news).toHaveLength(2);
    expect(news).toEqual([
      expect.objectContaining({
        impact: "neutral",
        impactReason:
          "El titular no aporta suficiente información para determinar un posible impacto.",
      }),
      expect.objectContaining({
        impact: "neutral",
        impactReason:
          "El titular no aporta suficiente información para determinar un posible impacto.",
      }),
    ]);
  });

  it("rejects a short Spanish reason when English is requested", async () => {
    vi.stubEnv("FINVIZ_API_KEY", "test-key");
    const today = new Date().toISOString().slice(0, 10);
    const csv = [
      "Date,Title,Url",
      `${today} 09:00:00,Company raises guidance,https://example.com/guidance`,
    ].join("\n");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(csv, { status: 200 })));
    vi.mocked(openai.chat.completions.create).mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              items: [
                {
                  id: "headline-1",
                  sourceTitle: "Company raises guidance",
                  title: "Company raises guidance",
                  impact: "positive",
                  reason: "La empresa elevó previsiones.",
                },
              ],
            }),
          },
        },
      ],
    } as never);

    await expect(getRecentStockNews("WRONG-LANG-EN", "en")).resolves.toEqual([
      expect.objectContaining({
        impact: "neutral",
        impactReason:
          "The headline does not provide enough information to determine a possible impact.",
      }),
    ]);
  });

  it("keeps cached English and Spanish news separated", async () => {
    vi.stubEnv("FINVIZ_API_KEY", "test-key");
    const today = new Date().toISOString().slice(0, 10);
    const csv = [
      "Date,Title,Url",
      `${today} 09:00:00,Company raises guidance,https://example.com/guidance`,
    ].join("\n");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(csv, { status: 200 })));
    vi.mocked(openai.chat.completions.create)
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                items: [
                  {
                    id: "headline-1",
                    sourceTitle: "Company raises guidance",
                    title: "Company raises guidance",
                    impact: "positive",
                    reason: "Higher guidance signals stronger expectations for the business.",
                  },
                ],
              }),
            },
          },
        ],
      } as never)
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                items: [
                  {
                    id: "headline-1",
                    sourceTitle: "Company raises guidance",
                    title: "La empresa eleva sus previsiones",
                    impact: "positive",
                    reason: "Elevar las previsiones indica mejores expectativas para el negocio.",
                  },
                ],
              }),
            },
          },
        ],
      } as never);

    const english = await getRecentStockNews("LANG-CACHE", "en");
    const spanish = await getRecentStockNews("LANG-CACHE", "es");

    expect(english[0]?.title).toBe("Company raises guidance");
    expect(spanish[0]?.title).toBe("La empresa eleva sus previsiones");
    expect(openai.chat.completions.create).toHaveBeenCalledTimes(2);
  });
});