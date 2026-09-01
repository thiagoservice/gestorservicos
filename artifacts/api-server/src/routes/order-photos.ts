import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, orderPhotosTable, ordersTable } from "@workspace/db";
import {
  AddOrderPhotoBody,
  AddOrderPhotoParams,
  AddOrderPhotoResponse,
  DeleteOrderPhotoParams,
  ListOrderPhotosParams,
  ListOrderPhotosResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function isStoredImageOrPublicUrl(value: string): boolean {
  if (value.startsWith("/objects/")) return true;
  if (value.startsWith("data:image/")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

router.get("/orders/:id/photos", async (req, res): Promise<void> => {
  const params = ListOrderPhotosParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const photos = await db.select().from(orderPhotosTable)
    .where(eq(orderPhotosTable.orderId, params.data.id))
    .orderBy(orderPhotosTable.createdAt);
  res.json(ListOrderPhotosResponse.parse(photos));
});

router.post("/orders/:id/photos", async (req, res): Promise<void> => {
  const params = AddOrderPhotoParams.safeParse(req.params);
  const parsed = AddOrderPhotoBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }
  const photoUrl = parsed.data.photoUrl.trim();
  if (!isStoredImageOrPublicUrl(photoUrl)) {
    res.status(400).json({ error: "Anexo de foto inválido" });
    return;
  }
  const [order] = await db.select({ id: ordersTable.id }).from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Ordem não encontrada" });
    return;
  }
  const [photo] = await db.insert(orderPhotosTable).values({
    orderId: params.data.id,
    photoUrl,
    caption: parsed.data.caption?.trim() || null,
  }).returning();
  res.status(201).json(AddOrderPhotoResponse.parse(photo));
});

router.delete("/orders/:id/photos/:photoId", async (req, res): Promise<void> => {
  const params = DeleteOrderPhotoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db.delete(orderPhotosTable)
    .where(and(
      eq(orderPhotosTable.id, params.data.photoId),
      eq(orderPhotosTable.orderId, params.data.id),
    ))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Foto não encontrada" });
    return;
  }
  res.sendStatus(204);
});

export default router;