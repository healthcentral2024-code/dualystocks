import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// In-app customer-service messages: a user writes to the admin (Santiago).
export const supportMessagesTable = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Clerk user id
  email: text("email"), // sender's email at time of writing
  name: text("name"), // sender's display name at time of writing
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("open"), // "open" | "resolved"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SupportMessage = typeof supportMessagesTable.$inferSelect;
