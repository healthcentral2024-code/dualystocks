import { Router, type IRouter } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { desc, eq } from "drizzle-orm";
import { db, usersTable, supportMessagesTable } from "@workspace/db";
import { requireAdmin, isAdminUser } from "../lib/admin";
import { findSubscription, ACTIVE_STATUSES, getFounderIds } from "../lib/billing";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// All admin endpoints require an authenticated Clerk admin.
router.use("/admin", requireAdmin);

// List users with their subscription status
router.get("/admin/users", async (_req, res) => {
  try {
    const { data: clerkUsers } = await clerkClient.users.getUserList({
      limit: 100,
      orderBy: "-created_at",
    });
    const localUsers = await db.select().from(usersTable);
    const localById = new Map(localUsers.map((u) => [u.id, u]));
    const founderIds = await getFounderIds();

    const users = await Promise.all(
      clerkUsers.map(async (u) => {
        const local = localById.get(u.id);
        let subscriptionStatus: string | null = null;
        if (local?.stripeCustomerId) {
          const sub = await findSubscription(local.stripeCustomerId);
          subscriptionStatus = sub?.status ?? null;
        }
        return {
          id: u.id,
          email: u.primaryEmailAddress?.emailAddress ?? null,
          name: [u.firstName, u.lastName].filter(Boolean).join(" ") || null,
          imageUrl: u.imageUrl,
          createdAt: u.createdAt,
          lastActiveAt: u.lastActiveAt,
          isAdmin: isAdminUser(u),
          isFounder: founderIds.includes(u.id),
          subscriptionStatus,
          subscriptionActive:
            isAdminUser(u) ||
            founderIds.includes(u.id) ||
            (subscriptionStatus !== null && ACTIVE_STATUSES.includes(subscriptionStatus)),
        };
      }),
    );
    return res.json({ users });
  } catch (err) {
    logger.error({ err }, "Admin: failed to list users");
    return res.status(500).json({ error: "No se pudo obtener la lista de usuarios" });
  }
});

// Delete a user (cannot delete yourself)
router.delete("/admin/users/:id", async (req, res) => {
  const { userId } = getAuth(req);
  const targetId = req.params.id;
  if (targetId === userId) {
    return res.status(400).json({ error: "No puedes eliminar tu propia cuenta" });
  }
  try {
    await clerkClient.users.deleteUser(targetId);
  } catch (err: any) {
    // Already gone in Clerk? Treat as success and continue with local cleanup.
    if (err?.status !== 404) {
      logger.error({ err }, "Admin: failed to delete user in Clerk");
      return res.status(500).json({ error: "No se pudo eliminar el usuario" });
    }
  }
  try {
    await db.delete(usersTable).where(eq(usersTable.id, targetId));
  } catch (err) {
    // The Clerk account is already deleted; log the stale local row but
    // don't report failure for an account that no longer exists.
    logger.error({ err, targetId }, "Admin: user deleted in Clerk but local cleanup failed");
  }
  return res.json({ ok: true });
});

// List invitations
router.get("/admin/invitations", async (_req, res) => {
  try {
    const { data } = await clerkClient.invitations.getInvitationList({ limit: 100 });
    return res.json({
      invitations: data.map((i) => ({
        id: i.id,
        email: i.emailAddress,
        status: i.status,
        createdAt: i.createdAt,
      })),
    });
  } catch (err) {
    logger.error({ err }, "Admin: failed to list invitations");
    return res.status(500).json({ error: "No se pudieron obtener las invitaciones" });
  }
});

// Create an invitation (Clerk sends the email)
router.post("/admin/invitations", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Correo electrónico no válido" });
  }
  try {
    const invitation = await clerkClient.invitations.createInvitation({
      emailAddress: email,
      notify: true,
      ignoreExisting: false,
    });
    return res.status(201).json({
      invitation: {
        id: invitation.id,
        email: invitation.emailAddress,
        status: invitation.status,
        createdAt: invitation.createdAt,
      },
    });
  } catch (err: any) {
    const clerkMsg = err?.errors?.[0]?.message;
    logger.error({ err }, "Admin: failed to create invitation");
    return res
      .status(err?.status === 400 || err?.status === 422 ? 400 : 500)
      .json({ error: clerkMsg ?? "No se pudo crear la invitación" });
  }
});

// List support messages (newest first)
router.get("/admin/support-messages", async (_req, res) => {
  try {
    const messages = await db
      .select()
      .from(supportMessagesTable)
      .orderBy(desc(supportMessagesTable.createdAt))
      .limit(200);
    return res.json({ messages });
  } catch (err) {
    logger.error({ err }, "Admin: failed to list support messages");
    return res.status(500).json({ error: "No se pudieron obtener los mensajes" });
  }
});

// Toggle a support message between open and resolved
router.post("/admin/support-messages/:id/status", async (req, res) => {
  const id = Number(req.params.id);
  const status = req.body?.status;
  if (!Number.isInteger(id) || (status !== "open" && status !== "resolved")) {
    return res.status(400).json({ error: "Solicitud no válida" });
  }
  try {
    const [row] = await db
      .update(supportMessagesTable)
      .set({ status })
      .where(eq(supportMessagesTable.id, id))
      .returning({ id: supportMessagesTable.id });
    if (!row) return res.status(404).json({ error: "Mensaje no encontrado" });
    return res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Admin: failed to update support message");
    return res.status(500).json({ error: "No se pudo actualizar el mensaje" });
  }
});

// Revoke a pending invitation
router.post("/admin/invitations/:id/revoke", async (req, res) => {
  try {
    await clerkClient.invitations.revokeInvitation(req.params.id);
    return res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Admin: failed to revoke invitation");
    return res.status(500).json({ error: "No se pudo revocar la invitación" });
  }
});

export default router;
