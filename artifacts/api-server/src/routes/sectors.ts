import { Router, type IRouter } from "express";
import { GetSectorTrendResponse } from "@workspace/api-zod";
import { fetchSectorPerformance, sectorLabel, type Lang } from "../lib/finviz";

const router: IRouter = Router();

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
let cache: { at: number; data: Awaited<ReturnType<typeof fetchSectorPerformance>> } | null = null;
let inFlight: Promise<Awaited<ReturnType<typeof fetchSectorPerformance>>> | null = null;

async function loadSectors(): Promise<{ at: number; data: Awaited<ReturnType<typeof fetchSectorPerformance>> }> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache;
  if (!inFlight) {
    inFlight = fetchSectorPerformance().finally(() => {
      inFlight = null;
    });
  }
  const data = await inFlight;
  // An empty list means a transient Finviz failure: keep the previous cache
  // (if any) and treat it as an upstream error instead of showing 0 sectors.
  if (data.length === 0) {
    if (cache) return cache;
    throw new Error("Finviz devolvió una lista de sectores vacía");
  }
  cache = { at: Date.now(), data };
  return cache;
}

router.get("/sectors/trend", async (req, res) => {
  const lang: Lang = req.query["lang"] === "en" ? "en" : "es";
  try {
    const { at, data: raw } = await loadSectors();
    const sectors = [...raw]
      .sort((a, b) => b.perfMonth - a.perfMonth)
      .map((s) => ({ ...s, label: sectorLabel(s.name, lang) }));
    const top = sectors.slice(0, 3).map((s) => s.label);
    const message =
      lang === "en"
        ? `Strongest sectors this month: ${top.join(", ")}. A rising sector is a tailwind for the stocks inside it.`
        : `Los sectores más fuertes este mes: ${top.join(", ")}. Un sector en alza es viento a favor para las acciones que lo componen.`;
    res.json(
      GetSectorTrendResponse.parse({
        sectors,
        updatedAt: new Date(at).toISOString(),
        message,
      }),
    );
  } catch (err) {
    res.status(502).json({
      error:
        lang === "en"
          ? "Could not load sector data right now. Try again in a minute."
          : "No se pudieron cargar los datos de sectores ahora mismo. Intenta de nuevo en un minuto.",
    });
  }
});

export default router;
