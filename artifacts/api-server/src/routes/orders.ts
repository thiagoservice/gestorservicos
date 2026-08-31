import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, ordersTable, clientsTable, orderServiceItemsTable, orderMaterialItemsTable, servicesTable, materialsTable } from "@workspace/db";
import {
  CreateOrderBody,
  CreateOrderResponse,
  GetOrderParams,
  GetOrderResponse,
  UpdateOrderParams,
  UpdateOrderBody,
  UpdateOrderResponse,
  DeleteOrderParams,
  ListOrdersResponse,
  AddOrderServiceItemParams,
  AddOrderServiceItemBody,
  AddOrderServiceItemResponse,
  DeleteOrderServiceItemParams,
  AddOrderMaterialItemParams,
  AddOrderMaterialItemBody,
  AddOrderMaterialItemResponse,
  DeleteOrderMaterialItemParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function generateOrderNumber(): Promise<string> {
  const [row] = await db
    .select({ max: sql<string | null>`max(cast(number as integer))` })
    .from(ordersTable);
  const next = (Number(row?.max ?? 0) + 1);
  return String(next).padStart(5, "0");
}

async function recalcOrderTotal(orderId: number): Promise<void> {
  const serviceTotal = await db
    .select({ total: sql<string>`coalesce(sum(total_price), 0)` })
    .from(orderServiceItemsTable)
    .where(eq(orderServiceItemsTable.orderId, orderId));
  const materialTotal = await db
    .select({ total: sql<string>`coalesce(sum(total_price), 0)` })
    .from(orderMaterialItemsTable)
    .where(eq(orderMaterialItemsTable.orderId, orderId));
  const total = Number(serviceTotal[0]?.total ?? 0) + Number(materialTotal[0]?.total ?? 0);
  await db.update(ordersTable).set({ totalPrice: String(total) }).where(eq(ordersTable.id, orderId));
}

function parseOrder(o: typeof ordersTable.$inferSelect & { clientName: string }) {
  return { ...o, totalPrice: Number(o.totalPrice) };
}

router.get("/orders", async (_req, res): Promise<void> => {
  const orders = await db
    .select({
      id: ordersTable.id,
      number: ordersTable.number,
      clientId: ordersTable.clientId,
      checklistId: ordersTable.checklistId,
      address: ordersTable.address,
      clientName: clientsTable.name,
      title: ordersTable.title,
      description: ordersTable.description,
      serviceDate: ordersTable.serviceDate,
      status: ordersTable.status,
      totalPrice: ordersTable.totalPrice,
      createdAt: ordersTable.createdAt,
      updatedAt: ordersTable.updatedAt,
    })
    .from(ordersTable)
    .innerJoin(clientsTable, eq(ordersTable.clientId, clientsTable.id))
    .orderBy(ordersTable.createdAt);
  res.json(ListOrdersResponse.parse(orders.map(o => ({ ...o, totalPrice: Number(o.totalPrice) }))));
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, parsed.data.clientId));
  if (!client) {
    res.status(404).json({ error: "Cliente não encontrado" });
    return;
  }
  const number = await generateOrderNumber();
  const [order] = await db.insert(ordersTable).values({
    number,
    clientId: parsed.data.clientId,
    address: parsed.data.address ?? null,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    status: parsed.data.status ?? "pending",
  }).returning();
  res.status(201).json(CreateOrderResponse.parse({ ...order, clientName: client.name, totalPrice: Number(order.totalPrice) }));
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [order] = await db
    .select({
      id: ordersTable.id,
      number: ordersTable.number,
      clientId: ordersTable.clientId,
      checklistId: ordersTable.checklistId,
      address: ordersTable.address,
      clientName: clientsTable.name,
      title: ordersTable.title,
      description: ordersTable.description,
      serviceDate: ordersTable.serviceDate,
      status: ordersTable.status,
      totalPrice: ordersTable.totalPrice,
      createdAt: ordersTable.createdAt,
      updatedAt: ordersTable.updatedAt,
    })
    .from(ordersTable)
    .innerJoin(clientsTable, eq(ordersTable.clientId, clientsTable.id))
    .where(eq(ordersTable.id, params.data.id));

  if (!order) {
    res.status(404).json({ error: "Ordem não encontrada" });
    return;
  }

  const serviceItems = await db
    .select({
      id: orderServiceItemsTable.id,
      orderId: orderServiceItemsTable.orderId,
      serviceId: orderServiceItemsTable.serviceId,
      serviceName: servicesTable.name,
      quantity: orderServiceItemsTable.quantity,
      unitPrice: orderServiceItemsTable.unitPrice,
      totalPrice: orderServiceItemsTable.totalPrice,
    })
    .from(orderServiceItemsTable)
    .innerJoin(servicesTable, eq(orderServiceItemsTable.serviceId, servicesTable.id))
    .where(eq(orderServiceItemsTable.orderId, params.data.id));

  const materialItems = await db
    .select({
      id: orderMaterialItemsTable.id,
      orderId: orderMaterialItemsTable.orderId,
      materialId: orderMaterialItemsTable.materialId,
      materialName: materialsTable.name,
      quantity: orderMaterialItemsTable.quantity,
      unitPrice: orderMaterialItemsTable.unitPrice,
      totalPrice: orderMaterialItemsTable.totalPrice,
    })
    .from(orderMaterialItemsTable)
    .innerJoin(materialsTable, eq(orderMaterialItemsTable.materialId, materialsTable.id))
    .where(eq(orderMaterialItemsTable.orderId, params.data.id));

  res.json(GetOrderResponse.parse({
    ...order,
    totalPrice: Number(order.totalPrice),
    serviceItems: serviceItems.map(i => ({
      ...i,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
    })),
    materialItems: materialItems.map(i => ({
      ...i,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
    })),
  }));
});

router.patch("/orders/:id", async (req, res): Promise<void> => {
  const params = UpdateOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  if (parsed.data.address !== undefined) updateData.address = parsed.data.address || null;
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.serviceDate !== undefined) updateData.serviceDate = parsed.data.serviceDate || null;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;

  const [order] = await db.update(ordersTable).set(updateData).where(eq(ordersTable.id, params.data.id)).returning();
  if (!order) {
    res.status(404).json({ error: "Ordem não encontrada" });
    return;
  }
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, order.clientId));
  res.json(UpdateOrderResponse.parse({ ...order, clientName: client?.name ?? "", totalPrice: Number(order.totalPrice) }));
});

router.delete("/orders/:id", async (req, res): Promise<void> => {
  const params = DeleteOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db.delete(ordersTable).where(eq(ordersTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Ordem não encontrada" });
    return;
  }
  res.sendStatus(204);
});

// Service items
router.post("/orders/:id/service-items", async (req, res): Promise<void> => {
  const params = AddOrderServiceItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AddOrderServiceItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Ordem não encontrada" });
    return;
  }
  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, parsed.data.serviceId));
  if (!service) {
    res.status(404).json({ error: "Serviço não encontrado" });
    return;
  }
  const unitPrice = parsed.data.unitPrice;
  const totalPrice = unitPrice * parsed.data.quantity;
  const [item] = await db.insert(orderServiceItemsTable).values({
    orderId: params.data.id,
    serviceId: parsed.data.serviceId,
    quantity: String(parsed.data.quantity),
    unitPrice: String(unitPrice),
    totalPrice: String(totalPrice),
  }).returning();
  await recalcOrderTotal(params.data.id);
  res.status(201).json(AddOrderServiceItemResponse.parse({
    ...item,
    serviceName: service.name,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    totalPrice: Number(item.totalPrice),
  }));
});

router.delete("/orders/:id/service-items/:itemId", async (req, res): Promise<void> => {
  const params = DeleteOrderServiceItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db.delete(orderServiceItemsTable)
    .where(eq(orderServiceItemsTable.id, params.data.itemId))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Item não encontrado" });
    return;
  }
  await recalcOrderTotal(params.data.id);
  res.sendStatus(204);
});

// Material items
router.post("/orders/:id/material-items", async (req, res): Promise<void> => {
  const params = AddOrderMaterialItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AddOrderMaterialItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Ordem não encontrada" });
    return;
  }
  const [material] = await db.select().from(materialsTable).where(eq(materialsTable.id, parsed.data.materialId));
  if (!material) {
    res.status(404).json({ error: "Material não encontrado" });
    return;
  }
  const unitPrice = parsed.data.unitPrice;
  const totalPrice = unitPrice * parsed.data.quantity;
  const [item] = await db.insert(orderMaterialItemsTable).values({
    orderId: params.data.id,
    materialId: parsed.data.materialId,
    quantity: String(parsed.data.quantity),
    unitPrice: String(unitPrice),
    totalPrice: String(totalPrice),
  }).returning();
  await recalcOrderTotal(params.data.id);
  res.status(201).json(AddOrderMaterialItemResponse.parse({
    ...item,
    materialName: material.name,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    totalPrice: Number(item.totalPrice),
  }));
});

router.delete("/orders/:id/material-items/:itemId", async (req, res): Promise<void> => {
  const params = DeleteOrderMaterialItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db.delete(orderMaterialItemsTable)
    .where(eq(orderMaterialItemsTable.id, params.data.itemId))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Item não encontrado" });
    return;
  }
  await recalcOrderTotal(params.data.id);
  res.sendStatus(204);
});

export default router;
