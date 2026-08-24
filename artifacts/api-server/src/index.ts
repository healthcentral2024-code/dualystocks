import { runMigrations } from "stripe-replit-sync";
import app from "./app";
import { logger } from "./lib/logger";
import { getStripeSync } from "./lib/stripeClient";

/**
 * Initialize Stripe schema, managed webhook, and data sync on startup.
 */
async function initStripe() {
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for Stripe integration.");
  }

  // 1. Create stripe schema and tables (idempotent)
  await runMigrations({ databaseUrl });

  // 2. StripeSync instance (after migrations)
  const stripeSync = await getStripeSync();

  // 3. Managed webhook
  const webhookBaseUrl = `https://${process.env["REPLIT_DOMAINS"]?.split(",")[0]}`;
  await stripeSync.findOrCreateManagedWebhook(
    `${webhookBaseUrl}/api/stripe/webhook`,
  );

  // 4. Sync existing Stripe data in the background
  stripeSync
    .syncBackfill()
    .then(() => logger.info("Stripe data synced"))
    .catch((err) => logger.error({ err }, "Error syncing Stripe data"));
}

try {
  await initStripe();
  logger.info("Stripe initialized");
} catch (err) {
  logger.error({ err }, "Failed to initialize Stripe");
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
