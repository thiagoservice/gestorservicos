import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, materialsTable } from "@workspace/db";
import {
  CreateMaterialBody,
  CreateMaterialResponse,
  GetMaterialParams,
  GetMaterialResponse,
  UpdateMaterialParams,
  UpdateMaterialBody,
  UpdateMaterialResponse,
  DeleteMaterialParams,
  ListMaterialsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseMaterial(m: typeof materialsTable.$inferSelect) {
  return {
    ...m,
    unitPrice: Number(m.unitPrice),
    stockQuantity: Number(m.stockQuantity),
  };
}

router.get("/materials", async (_req, res): Promise<void> => {
  const materials = await db.select().from(materialsTable).orderBy(materialsTable.createdAt);
  res.json(ListMaterialsResponse.parse(materials.map(parseMaterial)));
});

router.post("/materials", async (req, res): Promise<void> => {
  const parsed = CreateMaterialBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [material] = await db.insert(materialsTable).values({
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    unitPrice: String(parsed.data.unitPrice),
    unit: parsed.data.unit,
    stockQuantity: String(parsed.data.stockQuantity ?? 0),
  }).returning();
  res.status(201).json(CreateMaterialResponse.parse(parseMaterial(material)));
});

router.get("/materials/:id", async (req, res): Promise<void> => {
  const params = GetMaterialParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [material] = await db.select().from(materialsTable).where(eq(materialsTable.id, params.data.id));
  if (!material) {
    res.status(404).json({ error: "Material não encontrado" });
    return;
  }
  res.json(GetMaterialResponse.parse(parseMaterial(material)));
});

router.patch("/materials/:id", async (req, res): Promise<void> => {
  const params = UpdateMaterialParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateMaterialBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.unitPrice !== undefined) updateData.unitPrice = String(parsed.data.unitPrice);
  if (parsed.data.unit !== undefined) updateData.unit = parsed.data.unit;
  if (parsed.data.stockQuantity !== undefined) updateData.stockQuantity = String(parsed.data.stockQuantity);

  const [material] = await db.update(materialsTable).set(updateData).where(eq(materialsTable.id, params.data.id)).returning();
  if (!material) {
    res.status(404).json({ error: "Material não encontrado" });
    return;
  }
  res.json(UpdateMaterialResponse.parse(parseMaterial(material)));
});

router.delete("/materials/:id", async (req, res): Promise<void> => {
  const params = DeleteMaterialParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db.delete(materialsTable).where(eq(materialsTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Material não encontrado" });
    return;
  }
  res.sendStatus(204);
});

export default router;
