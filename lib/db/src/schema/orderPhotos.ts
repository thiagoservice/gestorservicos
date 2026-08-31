import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { ordersTable } from "./orders";

export const orderPhotosTable = pgTable("order_photos", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  photoUrl: text("photo_url").notNull(),
  caption: text("caption"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type OrderPhoto = typeof orderPhotosTable.$inferSelect;