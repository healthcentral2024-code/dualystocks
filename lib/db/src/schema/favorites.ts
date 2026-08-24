import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";

// A user's watchlist of favorite tickers (Clerk user id + ticker).
export const favoritesTable = pgTable(
  "favorites",
  {
    userId: text("user_id").notNull(),
    ticker: text("ticker").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.ticker] })],
);

export type Favorite = typeof favoritesTable.$inferSelect;
