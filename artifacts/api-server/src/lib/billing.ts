import type { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { sql, eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { isAdmin, isAdminUser } from "./admin";

export const ACTIVE_STATUSES = ["active", "trialing"];

/** The first N (non-admin) registered users get the app for free, forever. */
export const FREE_FOUNDER_SLOTS = 3;

let founderCache: { ids: string[]; at: number } | null = null;

/** IDs of the founder users (first FREE_FOUNDER_SLOTS non-admin sign-ups). */
export async function getFounderIds(): Promise<string[]> {
  if (founderCache && Date.now() - founderCache.at < 60_000) return founderCache.ids;
  const { data } = await clerkClient.users.getUserList({
    orderBy: "+created_at",
    limit: 50,
  });
  const ids = data
    .filter((u) => !isAdminUser(u))
    .slice(0, FREE_FOUNDER_SLOTS)
    .map((u) => u.id);
  founderCache = { ids, at: Date.now() };
  return ids;
}

export async function isFounder(userId: string): Promise<boolean> {
  return (await getFounderIds()).includes(userId);
}

export async function ensureUser(
  userId: string,
): Promise<typeof usersTable.$inferSelect> {
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  if (existing) return existing;

  const clerkUser = await clerkClient.users.getUser(userId);
  const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
  const [created] = await db
    .insert(usersTable)
    .values({ id: userId, email })
    .onConflictDoNothing()
    .returning();
  if (created) return created;
  const [row] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  return row!;
}

export interface SubscriptionRow {
  id: string;
  status: string;
  cancel_at_period_end: boolean | null;
  current_period_end: string | number | null;
  trial_end: string | number | null;
}

/** Returns the user's most relevant subscription from the synced stripe schema. */
export async function findSubscription(
  customerId: string,
): Promise<SubscriptionRow | null> {
  const result = await db.execute(
    sql`SELECT id, status, cancel_at_period_end, current_period_end, trial_end
        FROM stripe.subscriptions
        WHERE customer = ${customerId}
        ORDER BY created DESC
        LIMIT 5`,
  );
  const rows = result.rows as unknown as SubscriptionRow[];
  return rows.find((r) => ACTIVE_STATUSES.includes(r.status)) ?? rows[0] ?? null;
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const user = await ensureUser(userId);
  if (!user.stripeCustomerId) return false;
  const sub = await findSubscription(user.stripeCustomerId);
  return sub !== null && ACTIVE_STATUSES.includes(sub.status);
}

/**
 * Express middleware: premium endpoints require a signed-in Clerk user with
 * an active (or trialing) subscription.
 */
export async function requireSubscription(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  try {
    // Admins and founder users (first sign-ups) always have full access.
    if ((await isAdmin(userId)) || (await isFounder(userId))) {
      next();
      return;
    }
    if (!(await hasActiveSubscription(userId))) {
      res.status(403).json({
        error: "Necesitas una suscripción activa",
        code: "SUBSCRIPTION_REQUIRED",
      });
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
}
