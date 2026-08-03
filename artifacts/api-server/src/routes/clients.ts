import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, clientsTable, equipmentsTable } from "@workspace/db";
import {
  CreateClientBody,
  CreateClientResponse,
  GetClientParams,
  GetClientResponse,
  UpdateClientParams,
  UpdateClientBody,
  UpdateClientResponse,
  DeleteClientParams,
  ListClientsResponse,
  ListEquipmentsParams,
  ListEquipmentsResponse,
  CreateEquipmentParams,
  CreateEquipmentBody,
  CreateEquipmentResponse,
  UpdateEquipmentParams,
  UpdateEquipmentBody,
  UpdateEquipmentResponse,
  DeleteEquipmentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function generateClientCode(): Promise<string> {
  const [row] = await db
    .select({ maxCode: sql<string | null>`max(cast(code as integer))` })
    .from(clientsTable);
  const next = row?.maxCode != null ? Number(row.maxCode) + 1 : 1;
  return String(next).padStart(6, "0");
}

// Clients
router.get("/clients", async (_req, res): Promise<void> => {
  const clients = await db.select().from(clientsTable).orderBy(clientsTable.createdAt);
  res.json(ListClientsResponse.parse(clients));
});

router.post("/clients", async (req, res): Promise<void> => {
  const parsed = CreateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const code = await generateClientCode();
  const [client] = await db.insert(clientsTable).values({ ...parsed.data, code }).returning();
  res.status(201).json(CreateClientResponse.parse(client));
});

router.get("/clients/:id", async (req, res): Promise<void> => {
  const params = GetClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, params.data.id));
  if (!client) { res.status(404).json({ error: "Cliente não encontrado" }); return; }
  res.json(GetClientResponse.parse(client));
});

router.patch("/clients/:id", async (req, res): Promise<void> => {
  const params = UpdateClientParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateClientBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [client] = await db.update(clientsTable).set(parsed.data).where(eq(clientsTable.id, params.data.id)).returning();
  if (!client) { res.status(404).json({ error: "Cliente não encontrado" }); return; }
  res.json(UpdateClientResponse.parse(client));
});

router.delete("/clients/:id", async (req, res): Promise<void> => {
  const params = DeleteClientParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [deleted] = await db.delete(clientsTable).where(eq(clientsTable.id, params.data.id)).returning();
  if (!deleted) { res.status(404).json({ error: "Cliente não encontrado" }); return; }
  res.sendStatus(204);
});

// Equipments
router.get("/clients/:id/equipments", async (req, res): Promise<void> => {
  const params = ListEquipmentsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const items = await db.select().from(equipmentsTable).where(eq(equipmentsTable.clientId, params.data.id)).orderBy(equipmentsTable.createdAt);
  res.json(ListEquipmentsResponse.parse(items));
});

router.post("/clients/:id/equipments", async (req, res): Promise<void> => {
  const params = CreateEquipmentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = CreateEquipmentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, params.data.id));
  if (!client) { res.status(404).json({ error: "Cliente não encontrado" }); return; }
  const [equip] = await db.insert(equipmentsTable).values({ ...parsed.data, clientId: params.data.id }).returning();
  res.status(201).json(CreateEquipmentResponse.parse(equip));
});

router.patch("/clients/:id/equipments/:equipId", async (req, res): Promise<void> => {
  const params = UpdateEquipmentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateEquipmentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [equip] = await db.update(equipmentsTable).set(parsed.data).where(eq(equipmentsTable.id, params.data.equipId)).returning();
  if (!equip) { res.status(404).json({ error: "Equipamento não encontrado" }); return; }
  res.json(UpdateEquipmentResponse.parse(equip));
});

router.delete("/clients/:id/equipments/:equipId", async (req, res): Promise<void> => {
  const params = DeleteEquipmentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [deleted] = await db.delete(equipmentsTable).where(eq(equipmentsTable.id, params.data.equipId)).returning();
  if (!deleted) { res.status(404).json({ error: "Equipamento não encontrado" }); return; }
  res.sendStatus(204);
});

export default router;
