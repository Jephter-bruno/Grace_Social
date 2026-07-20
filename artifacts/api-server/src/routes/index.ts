import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import followsRouter from "./follows";
import testimoniesRouter from "./testimonies";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(followsRouter);
router.use(testimoniesRouter);

export default router;
