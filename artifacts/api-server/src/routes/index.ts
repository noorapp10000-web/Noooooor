import { Router, type IRouter } from "express";
import healthRouter from "./health";
import downloadRouter from "./download";
import audioProxyRouter from "./audio-proxy";

const router: IRouter = Router();

router.use(healthRouter);
router.use(downloadRouter);
router.use(audioProxyRouter);

export default router;
