import { Router, type IRouter } from "express";
import { and, eq, ilike, or } from "drizzle-orm";
import { db, contactsTable } from "@workspace/db";
import {
  ListContactsQueryParams,
  ListContactsResponse,
  CreateContactBody,
  GetContactResponse,
  GetContactParams,
  UpdateContactParams,
  UpdateContactBody,
  UpdateContactResponse,
  DeleteContactParams,
} from "@workspace/api-zod";
import { requireOrg, type AuthedRequest } from "../middlewares/requireOrg";

const router: IRouter = Router();

router.use(requireOrg);

router.get("/contacts", async (req, res): Promise<void> => {
  const { organizationId } = req as unknown as AuthedRequest;
  const query = ListContactsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [eq(contactsTable.organizationId, organizationId)];
  if (query.data.search) {
    const term = `%${query.data.search}%`;
    conditions.push(
      or(
        ilike(contactsTable.name, term),
        ilike(contactsTable.email, term),
        ilike(contactsTable.phone, term),
      )!,
    );
  }

  const contacts = await db
    .select()
    .from(contactsTable)
    .where(and(...conditions))
    .orderBy(contactsTable.name);

  res.json(ListContactsResponse.parse(contacts));
});

router.post("/contacts", async (req, res): Promise<void> => {
  const { organizationId } = req as unknown as AuthedRequest;
  const parsed = CreateContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [contact] = await db
    .insert(contactsTable)
    .values({ ...parsed.data, organizationId })
    .returning();

  res.status(201).json(GetContactResponse.parse(contact));
});

router.get("/contacts/:id", async (req, res): Promise<void> => {
  const { organizationId } = req as unknown as AuthedRequest;
  const params = GetContactParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [contact] = await db
    .select()
    .from(contactsTable)
    .where(
      and(
        eq(contactsTable.id, params.data.id),
        eq(contactsTable.organizationId, organizationId),
      ),
    );

  if (!contact) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }

  res.json(GetContactResponse.parse(contact));
});

router.patch("/contacts/:id", async (req, res): Promise<void> => {
  const { organizationId } = req as unknown as AuthedRequest;
  const params = UpdateContactParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [contact] = await db
    .update(contactsTable)
    .set(parsed.data)
    .where(
      and(
        eq(contactsTable.id, params.data.id),
        eq(contactsTable.organizationId, organizationId),
      ),
    )
    .returning();

  if (!contact) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }

  res.json(UpdateContactResponse.parse(contact));
});

router.delete("/contacts/:id", async (req, res): Promise<void> => {
  const { organizationId } = req as unknown as AuthedRequest;
  const params = DeleteContactParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [contact] = await db
    .delete(contactsTable)
    .where(
      and(
        eq(contactsTable.id, params.data.id),
        eq(contactsTable.organizationId, organizationId),
      ),
    )
    .returning();

  if (!contact) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
