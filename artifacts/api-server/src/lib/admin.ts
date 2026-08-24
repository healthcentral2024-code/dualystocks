import type { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import type { User } from "@clerk/express";

/**
 * Emails that are always admins, in every environment (dev and production).
 * Clerk keeps separate user stores per environment, so role metadata set in
 * development does not exist in production — the email allowlist does.
 */
const ADMIN_EMAILS = new Set([
  "samachadoc31usa@gmail.com",
  "samachador31usa@gmail.com",
]);

/** Admins: publicMetadata.role === "admin" OR a VERIFIED email in the allowlist. */
export function isAdminUser(user: User): boolean {
  if (user.publicMetadata?.role === "admin") return true;
  return user.emailAddresses.some(
    (e) =>
      e.verification?.status === "verified" &&
      ADMIN_EMAILS.has(e.emailAddress.toLowerCase()),
  );
}

export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const user = await clerkClient.users.getUser(userId);
    return isAdminUser(user);
  } catch {
    return false;
  }
}

/** Express middleware: only signed-in Clerk admins pass. */
export async function requireAdmin(
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
    if (!(await isAdmin(userId))) {
      res.status(403).json({ error: "Solo administradores", code: "ADMIN_REQUIRED" });
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
}
