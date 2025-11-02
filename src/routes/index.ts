import { Router } from "express";
import demoAppRouter from "./demoApp.route";
import adminRouter from "./admin.route";
import authRouter from "./auth.route";
import { zeroTrustGuard } from "@middlewares/accessGuard";
const indexRouter = Router();

indexRouter.use("/auth", authRouter);

indexRouter.use("/api", zeroTrustGuard);

indexRouter.use("/api", demoAppRouter);
indexRouter.use("/api/admin", adminRouter);

export default indexRouter;
