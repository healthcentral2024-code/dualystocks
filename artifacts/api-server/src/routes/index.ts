import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analysisRouter from "./analysis";
import screenerRouter from "./screener";
import billingRouter from "./billing";
import adminRouter from "./admin";
import favoritesRouter from "./favorites";
import sectorsRouter from "./sectors";
import topPicksRouter from "./top-picks";
import supportRouter from "./support";
import marketRouter from "./market";
import { requireSubscription } from "../lib/billing";

const router: IRouter = Router();

router.use(healthRouter);
// Premium data requires a signed-in user with an active subscription.
// "/recent" (teaser list on the home page) stays public.
// "/market/pulse" (today's market pulse on the home page) is public too.
router.use(["/analysis", "/screener", "/favorites", "/sectors", "/top-picks"], requireSubscription);
router.use(marketRouter);
router.use(favoritesRouter);
router.use(topPicksRouter);
router.use(sectorsRouter);
router.use(analysisRouter);
router.use(screenerRouter);
router.use(supportRouter);
router.use(billingRouter);
router.use(adminRouter);

export default router;
