import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, tasksTable, contactsTable } from "@workspace/db";
import {
  ListTasksQueryParams,
  ListTasksResponse,
  CreateTaskBody,
  CreateTaskResponse,
  UpdateTaskParams,
  UpdateTaskBody,
  UpdateTaskResponse,
  DeleteTaskParams,
} from "@workspace/api-zod";
import { requireOrg, type AuthedRequest } from "../middlewares/requireOrg";

const router: IRouter = Router();

router.use(requireOrg);

router.get("/tasks", async (req, res): Promise<void> => {
  const { organizationId } = req as unknown as AuthedRequest;
  const query = ListTasksQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [eq(tasksTable.organizationId, organizationId)];
  if (query.data.completed !== undefined) {
    conditions.push(eq(tasksTable.completed, query.data.completed));
  }
  if (query.data.contactId !== undefined) {
    conditions.push(eq(tasksTable.contactId, query.data.contactId));
  }
  if (query.data.dealId !== undefined) {
    conditions.push(eq(tasksTable.dealId, query.data.dealId));
  }

  const rows = await db
    .select({
      id: tasksTable.id,
      title: tasksTable.title,
      dueDate: tasksTable.dueDate,
      completed: tasksTable.completed,
      contactId: tasksTable.contactId,
      dealId: tasksTable.dealId,
      contactName: contactsTable.name,
      createdAt: tasksTable.createdAt,
    })
    .from(tasksTable)
    .leftJoin(contactsTable, eq(tasksTable.contactId, contactsTable.id))
    .where(and(...conditions))
    .orderBy(tasksTable.dueDate);

  res.json(ListTasksResponse.parse(rows));
});

router.post("/tasks", async (req, res): Promise<void> => {
  const { organizationId } = req as unknown as AuthedRequest;
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [task] = await db
    .insert(tasksTable)
    .values({ ...parsed.data, organizationId })
    .returning();

  if (!task) {
    res.status(500).json({ error: "Failed to create task" });
    return;
  }

  let contactName: string | null = null;
  if (task.contactId) {
    const [contact] = await db
      .select()
      .from(contactsTable)
      .where(eq(contactsTable.id, task.contactId));
    contactName = contact?.name ?? null;
  }

  res.status(201).json(CreateTaskResponse.parse({ ...task, contactName }));
});

router.patch("/tasks/:id", async (req, res): Promise<void> => {
  const { organizationId } = req as unknown as AuthedRequest;
  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [task] = await db
    .update(tasksTable)
    .set(parsed.data)
    .where(
      and(
        eq(tasksTable.id, params.data.id),
        eq(tasksTable.organizationId, organizationId),
      ),
    )
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  let contactName: string | null = null;
  if (task.contactId) {
    const [contact] = await db
      .select()
      .from(contactsTable)
      .where(eq(contactsTable.id, task.contactId));
    contactName = contact?.name ?? null;
  }

  res.json(UpdateTaskResponse.parse({ ...task, contactName }));
});

router.delete("/tasks/:id", async (req, res): Promise<void> => {
  const { organizationId } = req as unknown as AuthedRequest;
  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [task] = await db
    .delete(tasksTable)
    .where(
      and(
        eq(tasksTable.id, params.data.id),
        eq(tasksTable.organizationId, organizationId),
      ),
    )
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
