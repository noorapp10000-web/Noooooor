import { Router, type IRouter } from "express";
import { rateLimit } from "express-rate-limit";
import healthRouter from "./health";
import downloadRouter from "./download";
import audioProxyRouter from "./audio-proxy";

const router: IRouter = Router();

const mediaLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

router.use(healthRouter);
router.use(mediaLimiter, downloadRouter);
router.use(mediaLimiter, audioProxyRouter);

export default router;
