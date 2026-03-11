import { Router } from "express";

import { authRouter } from "./auth";
import { projectsRouter } from "./projects";
import { tasksRouter } from "./tasks";
import { notificationsRouter } from "./notifications";

const router = Router();

router.use("/auth", authRouter);
router.use("/projects", projectsRouter);
router.use("/tasks", tasksRouter);
router.use("/notifications", notificationsRouter);

export { router as apiRouter };
