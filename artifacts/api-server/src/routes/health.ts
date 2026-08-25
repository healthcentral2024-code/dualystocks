import { Router, type IRouter } from "express";
import { GetMobileConfigResponse, HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/mobile/config", (_req, res) => {
  const clerkPublishableKey = process.env.CLERK_PUBLISHABLE_KEY;

  if (!clerkPublishableKey) {
    return res.status(503).json({ error: "Mobile authentication is not configured" });
  }

  res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
  const data = GetMobileConfigResponse.parse({ clerkPublishableKey });
  return res.json(data);
});

export default router;
