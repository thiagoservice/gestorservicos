import { Router, type IRouter } from "express";
import { and, eq, inArray, isNull } from "drizzle-orm";
import {
  checklistsTable,
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
  ListChecklistsResponse,
  CreateChecklistBody,
  CreateChecklistResponse,
  UpdateChecklistParams,
  UpdateChecklistBody,
  UpdateChecklistResponse,
  DeleteChecklistParams,
  ApplyChecklistToOrderParams,
  ApplyChecklistToOrderBody,
  ApplyChecklistToOrderResponse,
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

async function migrateLegacyTemplates(): Promise<void> {
  const legacyItems = await db.select().from(checklistTemplatesTable)
    .where(isNull(checklistTemplatesTable.checklistId));
  if (legacyItems.length === 0) return;
  await db.transaction(async (tx) => {
    const [checklist] = await tx.insert(checklistsTable).values({ name: "Checklist geral" }).returning();
    await Promise.all(legacyItems.map((item, index) => tx.update(checklistTemplatesTable)
      .set({ checklistId: checklist.id, sortOrder: index })
      .where(eq(checklistTemplatesTable.id, item.id))));
  });
}

async function getChecklist(id: number) {
  const [checklist] = await db.select().from(checklistsTable).where(eq(checklistsTable.id, id));
  if (!checklist) return null;
  const items = await db.select().from(checklistTemplatesTable)
    .where(eq(checklistTemplatesTable.checklistId, id))
    .orderBy(checklistTemplatesTable.sortOrder);
  return { ...checklist, items };
}

router.get("/checklists", async (_req, res): Promise<void> => {
  await migrateLegacyTemplates();
  const checklists = await db.select().from(checklistsTable).orderBy(checklistsTable.createdAt);
  const ids = checklists.map((checklist) => checklist.id);
  const items = ids.length
    ? await db.select().from(checklistTemplatesTable)
      .where(inArray(checklistTemplatesTable.checklistId, ids))
      .orderBy(checklistTemplatesTable.sortOrder)
    : [];
  res.json(ListChecklistsResponse.parse(checklists.map((checklist) => ({
    ...checklist,
    items: items.filter((item) => item.checklistId === checklist.id),
  }))));
});

router.post("/checklists", async (req, res): Promise<void> => {
  const parsed = CreateChecklistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const result = await db.transaction(async (tx) => {
    const [checklist] = await tx.insert(checklistsTable).values({ name: parsed.data.name.trim() }).returning();
    const items = await tx.insert(checklistTemplatesTable).values(parsed.data.items.map((name, index) => ({
      checklistId: checklist.id,
      name: name.trim(),
      sortOrder: index,
    }))).returning();
    return { ...checklist, items };
  });
  res.status(201).json(CreateChecklistResponse.parse(result));
});

router.patch("/checklists/:id", async (req, res): Promise<void> => {
  const params = UpdateChecklistParams.safeParse(req.params);
  const parsed = UpdateChecklistBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }
  const current = await getChecklist(params.data.id);
  if (!current) {
    res.status(404).json({ error: "Checklist não encontrado" });
    return;
  }
  const result = await db.transaction(async (tx) => {
    const [checklist] = await tx.update(checklistsTable)
      .set({ name: parsed.data.name.trim() })
      .where(eq(checklistsTable.id, params.data.id))
      .returning();
    await tx.delete(checklistTemplatesTable).where(eq(checklistTemplatesTable.checklistId, params.data.id));
    const items = await tx.insert(checklistTemplatesTable).values(parsed.data.items.map((name, index) => ({
      checklistId: params.data.id,
      name: name.trim(),
      sortOrder: index,
    }))).returning();
    return { ...checklist, items };
  });
  res.json(UpdateChecklistResponse.parse(result));
});

router.delete("/checklists/:id", async (req, res): Promise<void> => {
  const params = DeleteChecklistParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db.delete(checklistsTable).where(eq(checklistsTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Checklist não encontrado" });
    return;
  }
  res.sendStatus(204);
});

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

router.put("/orders/:id/checklist/apply", async (req, res): Promise<void> => {
  const params = ApplyChecklistToOrderParams.safeParse(req.params);
  const parsed = ApplyChecklistToOrderBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  const checklist = await getChecklist(parsed.data.checklistId);
  if (!order || !checklist) {
    res.status(404).json({ error: !order ? "Ordem não encontrada" : "Checklist não encontrado" });
    return;
  }
  const appliedItems = await db.transaction(async (tx) => {
    await tx.delete(orderChecklistItemsTable).where(eq(orderChecklistItemsTable.orderId, params.data.id));
    await tx.update(ordersTable).set({ checklistId: checklist.id }).where(eq(ordersTable.id, params.data.id));
    if (checklist.items.length === 0) return [];
    return tx.insert(orderChecklistItemsTable).values(checklist.items.map((item) => ({
      orderId: params.data.id,
      templateId: item.id,
      name: item.name,
    }))).returning();
  });
  res.json(ApplyChecklistToOrderResponse.parse(appliedItems));
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