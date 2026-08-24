import { Router, type IRouter, type Request } from "express";
import { getAuth } from "@clerk/express";
import { sql, eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { getUncachableStripeClient } from "../lib/stripeClient";
import {
  ACTIVE_STATUSES,
  ensureUser,
  findSubscription,
  isFounder,
} from "../lib/billing";
import { logger } from "../lib/logger";
import { isAdmin } from "../lib/admin";

const router: IRouter = Router();

// Only the DualyStocks Premium plan may be purchased. The priceId sent by the
// client is validated against the synced stripe schema (active recurring price
// of an active product) — never trusted blindly.
async function isAllowedPrice(priceId: string): Promise<boolean> {
  const result = await db.execute(
    sql`SELECT pr.id
        FROM stripe.prices pr
        JOIN stripe.products p ON p.id = pr.product
        WHERE pr.id = ${priceId}
          AND pr.active = true
          AND pr.recurring IS NOT NULL
          AND p.active = true`,
  );
  return result.rows.length > 0;
}

/** True if this customer ever had a subscription (used to grant the trial only once). */
async function hadAnySubscription(customerId: string): Promise<boolean> {
  const result = await db.execute(
    sql`SELECT 1 FROM stripe.subscriptions WHERE customer = ${customerId} LIMIT 1`,
  );
  return result.rows.length > 0;
}


/**
 * Public origin for redirect URLs. Behind the deployment proxy,
 * req.protocol/host resolve to http://localhost, so prefer the
 * forwarded headers set by the proxy.
 */
function getPublicOrigin(req: Request): string {
  const fwdHost = req.get("x-forwarded-host")?.split(",")[0]?.trim();
  const fwdProto = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const host = fwdHost || req.get("host");
  const proto = fwdProto || req.protocol;
  return `${proto}://${host}`;
}

// Available plans (product + prices) from the synced stripe schema
router.get("/billing/plans", async (_req, res) => {
  try {
    const result = await db.execute(
      sql`SELECT p.id as product_id, p.name, p.description,
                 pr.id as price_id, pr.unit_amount, pr.currency, pr.recurring
          FROM stripe.products p
          JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
          WHERE p.active = true
          ORDER BY pr.unit_amount`,
    );
    return res.json({ plans: result.rows });
  } catch (err) {
    logger.error({ err }, "Failed to list plans");
    return res.status(500).json({ error: "No se pudieron cargar los planes" });
  }
});

// ---------------------------------------------------------------------------
// Referral program: normal customers get a one-time 25% discount when someone
// they invited subscribes.
// ---------------------------------------------------------------------------

const REFERRAL_COUPON_ID = "REFERIDO25";

async function getReferralCouponId(): Promise<string> {
  const stripe = await getUncachableStripeClient();
  try {
    const existing = await stripe.coupons.retrieve(REFERRAL_COUPON_ID);
    if (existing.valid) return existing.id;
  } catch {
    // not found — create below
  }
  const coupon = await stripe.coupons.create({
    id: REFERRAL_COUPON_ID,
    percent_off: 25,
    duration: "once",
    name: "Recompensa por invitar (25%)",
  });
  return coupon.id;
}

/**
 * If this user was referred and is now a paying subscriber, grant the
 * referrer a one-time 25% discount on their subscription. Idempotent:
 * referralRewardAt marks the reward as granted.
 */
async function maybeGrantReferralReward(userId: string): Promise<void> {
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    if (!user?.referredBy || user.referralRewardAt) return;
    if (!user.stripeCustomerId) return;

    // The referred user must be actually paying (past the trial).
    const sub = await findSubscription(user.stripeCustomerId);
    if (!sub || sub.status !== "active") return;

    // The referrer must be a normal paying customer with a live subscription.
    const [referrer] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, user.referredBy));
    if (!referrer?.stripeCustomerId) return;
    const referrerSub = await findSubscription(referrer.stripeCustomerId);
    if (!referrerSub || !ACTIVE_STATUSES.includes(referrerSub.status)) return;

    const stripe = await getUncachableStripeClient();
    const couponId = await getReferralCouponId();
    await stripe.subscriptions.update(referrerSub.id, {
      discounts: [{ coupon: couponId }],
    });
    await db
      .update(usersTable)
      .set({ referralRewardAt: new Date() })
      .where(eq(usersTable.id, userId));
    logger.info(
      { referred: userId, referrer: referrer.id },
      "Referral reward granted (25% off once)",
    );
  } catch (err) {
    logger.error({ err, userId }, "Failed to grant referral reward");
  }
}

// Record who invited the current user. Safe to call repeatedly; only the
// first valid referral sticks, and self-referrals are rejected.
router.post("/billing/referral", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "No autenticado" });

  const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
  if (!code || code === userId) {
    return res.status(400).json({ error: "Código de invitación no válido" });
  }

  try {
    const user = await ensureUser(userId);
    if (user.referredBy) return res.json({ ok: true }); // already recorded
    // Referrals only count for brand-new users (before any subscription).
    if (user.stripeCustomerId && (await hadAnySubscription(user.stripeCustomerId))) {
      return res.json({ ok: false });
    }
    const [referrer] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, code));
    if (!referrer) return res.status(400).json({ error: "Código de invitación no válido" });

    await db
      .update(usersTable)
      .set({ referredBy: referrer.id })
      .where(eq(usersTable.id, userId));
    return res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Failed to record referral");
    return res.status(500).json({ error: "No se pudo registrar la invitación" });
  }
});

// Current user's subscription status
router.get("/billing/subscription", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "No autenticado" });

  try {
    // Admins have permanent free access.
    if (await isAdmin(userId)) {
      return res.json({ active: true, status: "admin", isAdmin: true });
    }
    // The first sign-ups get the app free forever.
    if (await isFounder(userId)) {
      return res.json({ active: true, status: "founder", founder: true });
    }
    const user = await ensureUser(userId);
    if (!user.stripeCustomerId) {
      return res.json({ active: false, status: null });
    }
    const sub = await findSubscription(user.stripeCustomerId);
    if (!sub) return res.json({ active: false, status: null });

    // If this user was invited and is now paying, reward the inviter (async).
    if (sub.status === "active") void maybeGrantReferralReward(userId);

    if (sub.id !== user.stripeSubscriptionId) {
      await db
        .update(usersTable)
        .set({ stripeSubscriptionId: sub.id })
        .where(eq(usersTable.id, userId));
    }

    return res.json({
      active: ACTIVE_STATUSES.includes(sub.status),
      status: sub.status,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
      currentPeriodEnd: sub.current_period_end,
      trialEnd: sub.trial_end,
    });
  } catch (err) {
    logger.error({ err }, "Failed to get subscription");
    return res.status(500).json({ error: "No se pudo consultar la suscripción" });
  }
});

// Create a Stripe Checkout session for a subscription (7-day free trial)
router.post("/billing/checkout", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "No autenticado" });

  const priceId = typeof req.body?.priceId === "string" ? req.body.priceId : null;
  if (!priceId) return res.status(400).json({ error: "Falta el plan (priceId)" });

  try {
    if (!(await isAllowedPrice(priceId))) {
      return res.status(400).json({ error: "Plan no válido" });
    }

    const stripe = await getUncachableStripeClient();
    const user = await ensureUser(userId);

    // Prevent duplicate subscriptions from repeated checkout clicks.
    if (user.stripeCustomerId) {
      const existing = await findSubscription(user.stripeCustomerId);
      if (existing && ACTIVE_STATUSES.includes(existing.status)) {
        return res
          .status(409)
          .json({ error: "Ya tienes una suscripción activa" });
      }
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { userId },
      });
      customerId = customer.id;
      await db
        .update(usersTable)
        .set({ stripeCustomerId: customerId })
        .where(eq(usersTable.id, userId));
    }

    // The 7-day free trial applies only to first-time subscribers.
    const eligibleForTrial = !(await hadAnySubscription(customerId));

    const origin = getPublicOrigin(req);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      // NOTE: do not pass payment_method_types — the live account uses
      // Stripe Managed Payments, which rejects that parameter.
      line_items: [{ price: priceId, quantity: 1 }],
      ...(eligibleForTrial
        ? { subscription_data: { trial_period_days: 7 } }
        : {}),
      allow_promotion_codes: true,
      success_url: `${origin}/suscripcion?estado=ok`,
      cancel_url: `${origin}/suscripcion?estado=cancelado`,
    });

    return res.json({ url: session.url });
  } catch (err) {
    logger.error({ err }, "Failed to create checkout session");
    return res.status(500).json({ error: "No se pudo iniciar el pago" });
  }
});

// Customer portal to manage/cancel the subscription
router.post("/billing/portal", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "No autenticado" });

  try {
    const user = await ensureUser(userId);
    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: "Aún no tienes suscripción" });
    }
    const stripe = await getUncachableStripeClient();
    const origin = getPublicOrigin(req);
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${origin}/suscripcion`,
    });
    return res.json({ url: session.url });
  } catch (err) {
    logger.error({ err }, "Failed to create portal session");
    return res.status(500).json({ error: "No se pudo abrir el portal de pagos" });
  }
});

export default router;
