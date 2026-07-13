import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, dealsTable, contactsTable } from "@workspace/db";
import {
  ListDealsQueryParams,
  ListDealsResponse,
  CreateDealBody,
  GetDealResponse,
  GetDealParams,
  UpdateDealParams,
  UpdateDealBody,
  UpdateDealResponse,
  DeleteDealParams,
} from "@workspace/api-zod";
import { requireOrg, type AuthedRequest } from "../middlewares/requireOrg";

const router: IRouter = Router();

router.use(requireOrg);

function toDealResponse(row: {
  id: number;
  title: string;
  value: string;
  status: string;
  stageId: number;
  contactId: number;
  contactName: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...row,
    value: Number(row.value),
  };
}

router.get("/deals", async (req, res): Promise<void> => {
  const { organizationId } = req as unknown as AuthedRequest;
  const query = ListDealsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [eq(dealsTable.organizationId, organizationId)];
  if (query.data.stageId !== undefined) {
    conditions.push(eq(dealsTable.stageId, query.data.stageId));
  }
  if (query.data.status !== undefined) {
    conditions.push(eq(dealsTable.status, query.data.status));
  }

  const rows = await db
    .select({
      id: dealsTable.id,
      title: dealsTable.title,
      value: dealsTable.value,
      status: dealsTable.status,
      stageId: dealsTable.stageId,
      contactId: dealsTable.contactId,
      contactName: contactsTable.name,
      createdAt: dealsTable.createdAt,
      updatedAt: dealsTable.updatedAt,
    })
    .from(dealsTable)
    .leftJoin(contactsTable, eq(dealsTable.contactId, contactsTable.id))
    .where(and(...conditions))
    .orderBy(dealsTable.createdAt);

  res.json(ListDealsResponse.parse(rows.map(toDealResponse)));
});

router.post("/deals", async (req, res): Promise<void> => {
  const { organizationId } = req as unknown as AuthedRequest;
  const parsed = CreateDealBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [contact] = await db
    .select()
    .from(contactsTable)
    .where(
      and(
        eq(contactsTable.id, parsed.data.contactId),
        eq(contactsTable.organizationId, organizationId),
      ),
    );

  if (!contact) {
    res.status(400).json({ error: "Contact not found" });
    return;
  }

  const [deal] = await db
    .insert(dealsTable)
    .values({
      ...parsed.data,
      value: parsed.data.value.toString(),
      organizationId,
    })
    .returning();

  if (!deal) {
    res.status(500).json({ error: "Failed to create deal" });
    return;
  }

  res
    .status(201)
    .json(GetDealResponse.parse(toDealResponse({ ...deal, contactName: contact.name })));
});

router.get("/deals/:id", async (req, res): Promise<void> => {
  const { organizationId } = req as unknown as AuthedRequest;
  const params = GetDealParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({
      id: dealsTable.id,
      title: dealsTable.title,
      value: dealsTable.value,
      status: dealsTable.status,
      stageId: dealsTable.stageId,
      contactId: dealsTable.contactId,
      contactName: contactsTable.name,
      createdAt: dealsTable.createdAt,
      updatedAt: dealsTable.updatedAt,
    })
    .from(dealsTable)
    .leftJoin(contactsTable, eq(dealsTable.contactId, contactsTable.id))
    .where(
      and(
        eq(dealsTable.id, params.data.id),
        eq(dealsTable.organizationId, organizationId),
      ),
    );

  if (!row) {
    res.status(404).json({ error: "Deal not found" });
    return;
  }

  res.json(GetDealResponse.parse(toDealResponse(row)));
});

router.patch("/deals/:id", async (req, res): Promise<void> => {
  const { organizationId } = req as unknown as AuthedRequest;
  const params = UpdateDealParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateDealBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.contactId !== undefined) {
    const [contact] = await db
      .select()
      .from(contactsTable)
      .where(
        and(
          eq(contactsTable.id, parsed.data.contactId),
          eq(contactsTable.organizationId, organizationId),
        ),
      );
    if (!contact) {
      res.status(400).json({ error: "Contact not found" });
      return;
    }
  }

  const { value, ...rest } = parsed.data;
  const updateValues: Record<string, unknown> = { ...rest };
  if (value !== undefined) {
    updateValues.value = value.toString();
  }

  const [updated] = await db
    .update(dealsTable)
    .set(updateValues)
    .where(
      and(
        eq(dealsTable.id, params.data.id),
        eq(dealsTable.organizationId, organizationId),
      ),
    )
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Deal not found" });
    return;
  }

  const [contact] = await db
    .select()
    .from(contactsTable)
    .where(eq(contactsTable.id, updated.contactId));

  res.json(
    UpdateDealResponse.parse(
      toDealResponse({ ...updated, contactName: contact?.name ?? null }),
    ),
  );
});

router.delete("/deals/:id", async (req, res): Promise<void> => {
  const { organizationId } = req as unknown as AuthedRequest;
  const params = DeleteDealParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deal] = await db
    .delete(dealsTable)
    .where(
      and(
        eq(dealsTable.id, params.data.id),
        eq(dealsTable.organizationId, organizationId),
      ),
    )
    .returning();

  if (!deal) {
    res.status(404).json({ error: "Deal not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
