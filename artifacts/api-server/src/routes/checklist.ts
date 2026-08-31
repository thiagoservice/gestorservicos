import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import {
  checklistTemplatesTable,
  db,
  orderChecklistItemsTable,
  ordersTable,
} from "@workspace/db";
import {
  CreateChecklistTemplateBody,
  CreateChecklistTemplateResponse,
  CreateOrderChecklistItemBody,
  CreateOrderChecklistItemParams,
  CreateOrderChecklistItemResponse,
  DeleteChecklistTemplateParams,
  DeleteOrderChecklistItemParams,
  ListChecklistTemplatesResponse,
  ListOrderChecklistItemsParams,
  ListOrderChecklistItemsResponse,
  UpdateChecklistTemplateBody,
  UpdateChecklistTemplateParams,
  UpdateChecklistTemplateResponse,
  UpdateOrderChecklistItemBody,
  UpdateOrderChecklistItemParams,
  UpdateOrderChecklistItemResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const VALID_STATUSES = new Set(["conforme", "nao_conforme", "nao_se_aplica"]);

function isPublicUrl(value: string | null | undefined): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

router.get("/checklist-templates", async (_req, res): Promise<void> => {
  const templates = await db.select().from(checklistTemplatesTable).orderBy(checklistTemplatesTable.createdAt);
  res.json(ListChecklistTemplatesResponse.parse(templates));
});

router.post("/checklist-templates", async (req, res): Promise<void> => {
  const parsed = CreateChecklistTemplateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [template] = await db.insert(checklistTemplatesTable).values({
    name: parsed.data.name.trim(),
  }).returning();
  res.status(201).json(CreateChecklistTemplateResponse.parse(template));
});

router.patch("/checklist-templates/:id", async (req, res): Promise<void> => {
  const params = UpdateChecklistTemplateParams.safeParse(req.params);
  const parsed = UpdateChecklistTemplateBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }
  const [template] = await db.update(checklistTemplatesTable)
    .set({ name: parsed.data.name.trim() })
    .where(eq(checklistTemplatesTable.id, params.data.id))
    .returning();
  if (!template) {
    res.status(404).json({ error: "Item de checklist não encontrado" });
    return;
  }
  res.json(UpdateChecklistTemplateResponse.parse(template));
});

router.delete("/checklist-templates/:id", async (req, res): Promise<void> => {
  const params = DeleteChecklistTemplateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db.delete(checklistTemplatesTable)
    .where(eq(checklistTemplatesTable.id, params.data.id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Item de checklist não encontrado" });
    return;
  }
  res.sendStatus(204);
});

router.get("/orders/:id/checklist", async (req, res): Promise<void> => {
  const params = ListOrderChecklistItemsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const items = await db.select().from(orderChecklistItemsTable)
    .where(eq(orderChecklistItemsTable.orderId, params.data.id))
    .orderBy(orderChecklistItemsTable.createdAt);
  res.json(ListOrderChecklistItemsResponse.parse(items));
});

router.post("/orders/:id/checklist", async (req, res): Promise<void> => {
  const params = CreateOrderChecklistItemParams.safeParse(req.params);
  const parsed = CreateOrderChecklistItemBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Ordem não encontrada" });
    return;
  }
  const [template] = await db.select().from(checklistTemplatesTable)
    .where(eq(checklistTemplatesTable.id, parsed.data.templateId));
  if (!template) {
    res.status(404).json({ error: "Item de checklist não encontrado" });
    return;
  }
  const [item] = await db.insert(orderChecklistItemsTable).values({
    orderId: params.data.id,
    templateId: template.id,
    name: template.name,
  }).returning();
  res.status(201).json(CreateOrderChecklistItemResponse.parse(item));
});

router.patch("/orders/:id/checklist/:itemId", async (req, res): Promise<void> => {
  const params = UpdateOrderChecklistItemParams.safeParse(req.params);
  const parsed = UpdateOrderChecklistItemBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }
  if (parsed.data.status && !VALID_STATUSES.has(parsed.data.status)) {
    res.status(400).json({ error: "Situação inválida" });
    return;
  }
  if (!isPublicUrl(parsed.data.photoUrl)) {
    res.status(400).json({ error: "Informe uma URL pública válida para a foto" });
    return;
  }
  const updateData: { status?: string; photoUrl?: string | null } = {};
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.photoUrl !== undefined) updateData.photoUrl = parsed.data.photoUrl.trim() || null;

  const [item] = await db.update(orderChecklistItemsTable)
    .set(updateData)
    .where(and(
      eq(orderChecklistItemsTable.id, params.data.itemId),
      eq(orderChecklistItemsTable.orderId, params.data.id),
    ))
    .returning();
  if (!item) {
    res.status(404).json({ error: "Item da ordem não encontrado" });
    return;
  }
  res.json(UpdateOrderChecklistItemResponse.parse(item));
});

router.delete("/orders/:id/checklist/:itemId", async (req, res): Promise<void> => {
  const params = DeleteOrderChecklistItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db.delete(orderChecklistItemsTable)
    .where(and(
      eq(orderChecklistItemsTable.id, params.data.itemId),
      eq(orderChecklistItemsTable.orderId, params.data.id),
    ))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Item da ordem não encontrado" });
    return;
  }
  res.sendStatus(204);
});

export default router;