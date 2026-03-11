import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ status: "tasks-router-ok" });
});

export { router as tasksRouter };
