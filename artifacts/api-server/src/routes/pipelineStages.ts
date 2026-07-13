import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, pipelineStagesTable } from "@workspace/db";
import {
  ListPipelineStagesResponse,
  CreatePipelineStageBody,
  CreatePipelineStageResponse,
  UpdatePipelineStageParams,
  UpdatePipelineStageBody,
  UpdatePipelineStageResponse,
  DeletePipelineStageParams,
} from "@workspace/api-zod";
import { requireOrg, type AuthedRequest } from "../middlewares/requireOrg";

const router: IRouter = Router();

router.use(requireOrg);

router.get("/pipeline-stages", async (req, res): Promise<void> => {
  const { organizationId } = req as unknown as AuthedRequest;

  const stages = await db
    .select()
    .from(pipelineStagesTable)
    .where(eq(pipelineStagesTable.organizationId, organizationId))
    .orderBy(pipelineStagesTable.order);

  res.json(ListPipelineStagesResponse.parse(stages));
});

router.post("/pipeline-stages", async (req, res): Promise<void> => {
  const { organizationId } = req as unknown as AuthedRequest;
  const parsed = CreatePipelineStageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [stage] = await db
    .insert(pipelineStagesTable)
    .values({ ...parsed.data, organizationId })
    .returning();

  res.status(201).json(CreatePipelineStageResponse.parse(stage));
});

router.patch("/pipeline-stages/:id", async (req, res): Promise<void> => {
  const { organizationId } = req as unknown as AuthedRequest;
  const params = UpdatePipelineStageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdatePipelineStageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [stage] = await db
    .update(pipelineStagesTable)
    .set(parsed.data)
    .where(
      and(
        eq(pipelineStagesTable.id, params.data.id),
        eq(pipelineStagesTable.organizationId, organizationId),
      ),
    )
    .returning();

  if (!stage) {
    res.status(404).json({ error: "Pipeline stage not found" });
    return;
  }

  res.json(UpdatePipelineStageResponse.parse(stage));
});

router.delete("/pipeline-stages/:id", async (req, res): Promise<void> => {
  const { organizationId } = req as unknown as AuthedRequest;
  const params = DeletePipelineStageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [stage] = await db
    .delete(pipelineStagesTable)
    .where(
      and(
        eq(pipelineStagesTable.id, params.data.id),
        eq(pipelineStagesTable.organizationId, organizationId),
      ),
    )
    .returning();

  if (!stage) {
    res.status(404).json({ error: "Pipeline stage not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
