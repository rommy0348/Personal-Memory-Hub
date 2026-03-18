import { Router, type IRouter } from "express";
import healthRouter from "./health";
import foldersRouter from "./folders";
import memoriesRouter from "./memories";
import aiRouter from "./ai";
import chatRouter from "./chat";
import conversationsRouter from "./conversations";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/folders", foldersRouter);
router.use("/memories", memoriesRouter);
router.use("/ai", aiRouter);
router.use("/chat", chatRouter);
router.use("/conversations", conversationsRouter);

export default router;
