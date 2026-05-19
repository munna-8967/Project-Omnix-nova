import { Router, type IRouter } from "express";
import conversationsRouter from "./conversations";

const router: IRouter = Router();

router.use("/openai", conversationsRouter);

export default router;
