import { Router, type IRouter } from "express";
import healthRouter from "./health";
import openaiRouter from "./openai";
import memoriesRouter from "./memories";
import notesRouter from "./notes";
import settingsRouter from "./settings";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(openaiRouter);
router.use(memoriesRouter);
router.use(notesRouter);
router.use(settingsRouter);
router.use(dashboardRouter);

export default router;
