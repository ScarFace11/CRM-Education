import { Router, type IRouter } from "express";
import healthRouter from "./health";
import meRouter from "./me";
import contactsRouter from "./contacts";
import pipelineStagesRouter from "./pipelineStages";
import dealsRouter from "./deals";
import tasksRouter from "./tasks";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(meRouter);
router.use(contactsRouter);
router.use(pipelineStagesRouter);
router.use(dealsRouter);
router.use(tasksRouter);
router.use(dashboardRouter);

export default router;
