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

router.get("/materials", async (_req, res): Promise<void> => {
  const materials = await db.select().from(materialsTable).orderBy(materialsTable.createdAt);
  res.json(ListMaterialsResponse.parse(materials));
});

router.post("/materials", async (req, res): Promise<void> => {
  const parsed = CreateMaterialBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [material] = await db.insert(materialsTable).values({
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    unit: parsed.data.unit,
  }).returning();
  res.status(201).json(CreateMaterialResponse.parse(material));
});

router.get("/materials/:id", async (req, res): Promise<void> => {
  const params = GetMaterialParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [material] = await db.select().from(materialsTable).where(eq(materialsTable.id, params.data.id));
  if (!material) { res.status(404).json({ error: "Material não encontrado" }); return; }
  res.json(GetMaterialResponse.parse(material));
});

router.patch("/materials/:id", async (req, res): Promise<void> => {
  const params = UpdateMaterialParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateMaterialBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [material] = await db.update(materialsTable).set(parsed.data).where(eq(materialsTable.id, params.data.id)).returning();
  if (!material) { res.status(404).json({ error: "Material não encontrado" }); return; }
  res.json(UpdateMaterialResponse.parse(material));
});

router.delete("/materials/:id", async (req, res): Promise<void> => {
  const params = DeleteMaterialParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [deleted] = await db.delete(materialsTable).where(eq(materialsTable.id, params.data.id)).returning();
  if (!deleted) { res.status(404).json({ error: "Material não encontrado" }); return; }
  res.sendStatus(204);
});

export default router;
