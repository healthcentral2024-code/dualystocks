import Stripe from "stripe";
import { StripeSync } from "stripe-replit-sync";

/**
 * Fetches Stripe credentials from the Replit connection API.
 * Not cached -- tokens can rotate, so fetch fresh each time.
 */
async function getStripeCredentials(): Promise<{
  secretKey: string;
  webhookSecret?: string;
}> {
  const hostname = process.env["REPLIT_CONNECTORS_HOSTNAME"];
  const xReplitToken = process.env["REPL_IDENTITY"]
    ? "repl " + process.env["REPL_IDENTITY"]
    : process.env["WEB_REPL_RENEWAL"]
      ? "depl " + process.env["WEB_REPL_RENEWAL"]
      : null;

  if (!hostname || !xReplitToken) {
    throw new Error(
      "Missing Replit environment variables. " +
        "Ensure the Stripe integration is connected via the Integrations tab.",
    );
  }

  const resp = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=stripe`,
    {
      headers: { Accept: "application/json", X_REPLIT_TOKEN: xReplitToken },
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!resp.ok) {
    throw new Error(
      `Failed to fetch Stripe credentials: ${resp.status} ${resp.statusText}`,
    );
  }

  const data = (await resp.json()) as {
    items?: Array<{ settings?: Record<string, string> }>;
  };
  const items = data.items ?? [];

  // The connection can return both a sandbox (sk_test_) and a live (sk_live_)
  // credential set. Deployments must use the live key; the workspace uses the
  // sandbox key. Fall back to the first item if no prefixed match exists.
  const isDeployment =
    process.env["REPLIT_DEPLOYMENT"] === "1" ||
    process.env["NODE_ENV"] === "production";
  const wantedPrefix = isDeployment ? "sk_live_" : "sk_test_";
  const keyOf = (item?: { settings?: Record<string, string> }) =>
    item?.settings?.["secret_key"] ?? item?.settings?.["secret"];
  const preferred = items.find((item) =>
    keyOf(item)?.startsWith(wantedPrefix),
  );

  // Never fall back to a differently-prefixed key: a deployment must not
  // silently run on the sandbox, and the workspace must never touch live.
  if (!preferred) {
    throw new Error(
      `Stripe connection has no ${wantedPrefix}* credential set for this ` +
        `environment (${isDeployment ? "deployment" : "workspace"}). ` +
        "Reconnect the Stripe integration.",
    );
  }

  const settings = preferred.settings;
  const secretKey = settings?.["secret_key"] ?? settings?.["secret"];

  if (!secretKey) {
    throw new Error(
      "Stripe integration not connected or missing secret key. " +
        "Connect Stripe via the Integrations tab first.",
    );
  }

  return {
    secretKey,
    ...(settings?.["webhook_secret"]
      ? { webhookSecret: settings["webhook_secret"] }
      : {}),
  };
}

/**
 * Returns a fresh authenticated Stripe client.
 * Not cached -- fetches credentials on every call so rotated keys are picked up.
 */
export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getStripeCredentials();
  return new Stripe(secretKey);
}

/**
 * Returns a fresh StripeSync instance for webhook processing and data sync.
 */
export async function getStripeSync(): Promise<StripeSync> {
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const { secretKey, webhookSecret } = await getStripeCredentials();
  return new StripeSync({
    poolConfig: { connectionString: databaseUrl },
    stripeSecretKey: secretKey,
    stripeWebhookSecret: webhookSecret ?? "",
  });
}
