import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, companyTable } from "@workspace/db";
import {
  GetCompanyResponse,
  UpdateCompanyBody,
  UpdateCompanyResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function isPublicUrl(value: string | null | undefined): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function getOrCreateCompany() {
  const [existing] = await db.select().from(companyTable).orderBy(companyTable.id).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(companyTable).values({ name: "" }).returning();
  return created;
}

router.get("/company", async (_req, res): Promise<void> => {
  const company = await getOrCreateCompany();
  res.json(GetCompanyResponse.parse(company));
});

router.put("/company", async (req, res): Promise<void> => {
  const parsed = UpdateCompanyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!isPublicUrl(parsed.data.logoUrl)) {
    res.status(400).json({ error: "Informe uma URL pública válida para o logo" });
    return;
  }

  const company = await getOrCreateCompany();
  const [updated] = await db.update(companyTable).set({
    name: parsed.data.name.trim(),
    address: parsed.data.address?.trim() || null,
    cnpj: parsed.data.cnpj?.trim() || null,
    logoUrl: parsed.data.logoUrl?.trim() || null,
  }).where(eq(companyTable.id, company.id)).returning();

  res.json(UpdateCompanyResponse.parse(updated ?? company));
});

export default router;