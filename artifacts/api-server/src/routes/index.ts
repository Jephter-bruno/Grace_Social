import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import followsRouter from "./follows";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(followsRouter);

export default router;
