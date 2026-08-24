import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

// App users keyed by Clerk user id; stores Stripe references only.
// Stripe entities (customers, subscriptions, products, prices) live in the
// `stripe` schema managed by stripe-replit-sync — never duplicate them here.
export const usersTable = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user id
  email: text("email"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  // Referral program: who invited this user, and when the referrer's
  // 25%-off reward was granted (null = not granted yet).
  referredBy: text("referred_by"),
  referralRewardAt: timestamp("referral_reward_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
