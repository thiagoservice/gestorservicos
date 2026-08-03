import { Router, type IRouter } from "express";
import { sql, eq } from "drizzle-orm";
import { db, ordersTable, clientsTable, servicesTable, materialsTable } from "@workspace/db";
import { GetSummaryResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/summary", async (_req, res): Promise<void> => {
  const [[totalClients], [totalServices], [totalMaterials], [totalOrders]] = await Promise.all([
    db.select({ count: sql<string>`count(*)` }).from(clientsTable),
    db.select({ count: sql<string>`count(*)` }).from(servicesTable),
    db.select({ count: sql<string>`count(*)` }).from(materialsTable),
    db.select({ count: sql<string>`count(*)` }).from(ordersTable),
  ]);

  const statusCounts = await db
    .select({ status: ordersTable.status, count: sql<string>`count(*)` })
    .from(ordersTable)
    .groupBy(ordersTable.status);

  const statusMap: Record<string, number> = {};
  for (const row of statusCounts) {
    statusMap[row.status] = Number(row.count);
  }

  const [revenueRow] = await db
    .select({ total: sql<string>`coalesce(sum(total_price), 0)` })
    .from(ordersTable)
    .where(eq(ordersTable.status, "completed"));

  res.json(GetSummaryResponse.parse({
    totalClients: Number(totalClients?.count ?? 0),
    totalServices: Number(totalServices?.count ?? 0),
    totalMaterials: Number(totalMaterials?.count ?? 0),
    totalOrders: Number(totalOrders?.count ?? 0),
    pendingOrders: statusMap["pending"] ?? 0,
    inProgressOrders: statusMap["in_progress"] ?? 0,
    completedOrders: statusMap["completed"] ?? 0,
    cancelledOrders: statusMap["cancelled"] ?? 0,
    totalRevenue: Number(revenueRow?.total ?? 0),
  }));
});

export default router;
