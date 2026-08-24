import { getUncachableStripeClient } from "./stripeClient";

/**
 * Creates the DualyStocks Premium product and its prices in Stripe.
 * Idempotent: skips creation if the product already exists.
 *
 * Run with: pnpm --filter @workspace/scripts exec tsx src/seed-products.ts
 */
async function createProducts() {
  try {
    const stripe = await getUncachableStripeClient();

    const existing = await stripe.products.search({
      query: "name:'DualyStocks Premium' AND active:'true'",
    });
    if (existing.data.length > 0) {
      console.log("DualyStocks Premium already exists:", existing.data[0]!.id);
      return;
    }

    const product = await stripe.products.create({
      name: "DualyStocks Premium",
      description:
        "Acceso completo al análisis de acciones y a las ideas de inversión de DualyStocks. Incluye 7 días de prueba gratis.",
    });
    console.log("Created product:", product.id);

    const monthly = await stripe.prices.create({
      product: product.id,
      unit_amount: 1500, // $15.00 / month
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { plan: "monthly" },
    });
    console.log("Created monthly price $15/mo:", monthly.id);

    const yearly = await stripe.prices.create({
      product: product.id,
      unit_amount: 15000, // $150.00 / year (2 months free)
      currency: "usd",
      recurring: { interval: "year" },
      metadata: { plan: "yearly" },
    });
    console.log("Created yearly price $150/yr:", yearly.id);

    console.log("✓ Done. Webhooks will sync the data to the database.");
  } catch (error) {
    console.error("Error creating products:", (error as Error).message);
    process.exit(1);
  }
}

createProducts();
