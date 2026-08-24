import { Router, type IRouter } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db, supportMessagesTable } from "@workspace/db";
import { PostSupportMessageBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Simple per-user rate limit: at most MAX_PER_WINDOW messages per window.
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const recentByUser = new Map<string, number[]>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const times = (recentByUser.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (times.length >= MAX_PER_WINDOW) {
    recentByUser.set(userId, times);
    return true;
  }
  times.push(now);
  recentByUser.set(userId, times);
  // Keep the map from growing unbounded.
  if (recentByUser.size > 5000) {
    for (const [k, v] of recentByUser) {
      if (v.every((t) => now - t >= RATE_WINDOW_MS)) recentByUser.delete(k);
    }
  }
  return false;
}

// In-app customer service: any signed-in user can write to the team.
router.post("/support/messages", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "No autenticado" });

  if (isRateLimited(userId)) {
    return res.status(429).json({
      error: "Has enviado varios mensajes seguidos. Espera unos minutos e inténtalo de nuevo.",
    });
  }

  const parsed = PostSupportMessageBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Mensaje inválido" });
  }
  const subject = parsed.data.subject.trim();
  const message = parsed.data.message.trim();
  if (!subject || !message) {
    return res.status(400).json({ error: "Escribe un asunto y un mensaje" });
  }

  try {
    // Best-effort sender identity from Clerk so the admin knows who wrote.
    let email: string | null = null;
    let name: string | null = null;
    try {
      const user = await clerkClient.users.getUser(userId);
      email = user.primaryEmailAddress?.emailAddress ?? null;
      name = [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
    } catch (err) {
      logger.warn({ err, userId }, "Could not resolve Clerk user for support message");
    }

    const [row] = await db
      .insert(supportMessagesTable)
      .values({ userId, email, name, subject, message })
      .returning({ id: supportMessagesTable.id, createdAt: supportMessagesTable.createdAt });
    if (!row) throw new Error("Insert returned no row");
    return res.status(201).json({ id: row.id, createdAt: row.createdAt.toISOString() });
  } catch (err) {
    logger.error({ err }, "Failed to store support message");
    return res.status(500).json({ error: "No se pudo enviar el mensaje. Inténtalo de nuevo." });
  }
});

export default router;
