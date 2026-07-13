import { Router, type IRouter } from "express";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import {
  db,
  contactsTable,
  dealsTable,
  pipelineStagesTable,
  tasksTable,
} from "@workspace/db";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";
import { requireOrg, type AuthedRequest } from "../middlewares/requireOrg";

const router: IRouter = Router();

router.use(requireOrg);

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const { organizationId } = req as unknown as AuthedRequest;

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [contactCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contactsTable)
    .where(eq(contactsTable.organizationId, organizationId));

  const [openDealsRow] = await db
    .select({
      count: sql<number>`count(*)::int`,
      value: sql<string>`coalesce(sum(${dealsTable.value}), 0)`,
    })
    .from(dealsTable)
    .where(
      and(
        eq(dealsTable.organizationId, organizationId),
        eq(dealsTable.status, "open"),
      ),
    );

  const [wonThisMonthRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(dealsTable)
    .where(
      and(
        eq(dealsTable.organizationId, organizationId),
        eq(dealsTable.status, "won"),
        gte(dealsTable.updatedAt, startOfMonth),
      ),
    );

  const [tasksDueTodayRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(tasksTable)
    .where(
      and(
        eq(tasksTable.organizationId, organizationId),
        eq(tasksTable.completed, false),
        gte(tasksTable.dueDate, startOfToday),
        lt(tasksTable.dueDate, startOfTomorrow),
      ),
    );

  const [tasksOverdueRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(tasksTable)
    .where(
      and(
        eq(tasksTable.organizationId, organizationId),
        eq(tasksTable.completed, false),
        lt(tasksTable.dueDate, startOfToday),
      ),
    );

  const dealsByStageRows = await db
    .select({
      stageId: pipelineStagesTable.id,
      stageName: pipelineStagesTable.name,
      count: sql<number>`count(${dealsTable.id})::int`,
      value: sql<string>`coalesce(sum(${dealsTable.value}), 0)`,
    })
    .from(pipelineStagesTable)
    .leftJoin(
      dealsTable,
      and(
        eq(dealsTable.stageId, pipelineStagesTable.id),
        eq(dealsTable.status, "open"),
      ),
    )
    .where(eq(pipelineStagesTable.organizationId, organizationId))
    .groupBy(pipelineStagesTable.id, pipelineStagesTable.name)
    .orderBy(pipelineStagesTable.order);

  res.json(
    GetDashboardSummaryResponse.parse({
      totalContacts: contactCountRow?.count ?? 0,
      openDeals: openDealsRow?.count ?? 0,
      totalPipelineValue: Number(openDealsRow?.value ?? 0),
      dealsWonThisMonth: wonThisMonthRow?.count ?? 0,
      tasksDueToday: tasksDueTodayRow?.count ?? 0,
      tasksOverdue: tasksOverdueRow?.count ?? 0,
      dealsByStage: dealsByStageRows.map((row) => ({
        stageId: row.stageId,
        stageName: row.stageName,
        count: row.count,
        value: Number(row.value),
      })),
    }),
  );
});

export default router;
