import { pgTable, serial, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { ordersTable } from "./orders";
import { servicesTable } from "./services";
import { materialsTable } from "./materials";

export const orderServiceItemsTable = pgTable("order_service_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  serviceId: integer("service_id").notNull().references(() => servicesTable.id),
  quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
});

export const orderMaterialItemsTable = pgTable("order_material_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  materialId: integer("material_id").notNull().references(() => materialsTable.id),
  quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
});

export const insertOrderServiceItemSchema = createInsertSchema(orderServiceItemsTable).omit({ id: true });
export type InsertOrderServiceItem = z.infer<typeof insertOrderServiceItemSchema>;
export type OrderServiceItem = typeof orderServiceItemsTable.$inferSelect;

export const insertOrderMaterialItemSchema = createInsertSchema(orderMaterialItemsTable).omit({ id: true });
export type InsertOrderMaterialItem = z.infer<typeof insertOrderMaterialItemSchema>;
export type OrderMaterialItem = typeof orderMaterialItemsTable.$inferSelect;
