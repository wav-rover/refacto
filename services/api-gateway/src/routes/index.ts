import { Router } from "express";

import { authRouter } from "./auth";
import { authV2Router } from "./authV2";
import { projectsRouter } from "./projects";
import { tasksRouter } from "./tasks";
import { notificationsRouter } from "./notifications";

const router = Router();

// Routes versionnées : exposées publiquement sous /api/v1/... par la gateway.
const v1 = Router();
v1.use("/auth", authRouter);
v1.use("/projects", projectsRouter);
v1.use("/tasks", tasksRouter);
v1.use("/notifications", notificationsRouter);

router.use("/v1", v1);

const v2 = Router();
v2.use("/auth", authV2Router);
router.use("/v2", v2);

export { router as apiRouter };
