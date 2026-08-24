import {
  pgTable,
  text,
  serial,
  doublePrecision,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const analysesTable = pgTable("analyses", {
  id: serial("id").primaryKey(),
  ticker: text("ticker").notNull().unique(),
  companyName: text("company_name").notNull(),
  overallScore: doublePrecision("overall_score").notNull(),
  overallVerdict: text("overall_verdict").notNull(),
  price: doublePrecision("price").notNull(),
  changePercent: doublePrecision("change_percent").notNull(),
  payload: jsonb("payload").notNull(),
  analyzedAt: timestamp("analyzed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertAnalysisSchema = createInsertSchema(analysesTable).omit({
  id: true,
});
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analysesTable.$inferSelect;
