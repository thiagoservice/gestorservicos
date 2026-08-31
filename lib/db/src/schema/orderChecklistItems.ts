import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { ordersTable } from "./orders";
import { checklistTemplatesTable } from "./checklistTemplates";
import { checklistsTable } from "./checklists";

export const orderChecklistItemsTable = pgTable("order_checklist_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  templateId: integer("template_id").references(() => checklistTemplatesTable.id, { onDelete: "set null" }),
  checklistId: integer("checklist_id").references(() => checklistsTable.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  status: text("status"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type OrderChecklistItem = typeof orderChecklistItemsTable.$inferSelect;
