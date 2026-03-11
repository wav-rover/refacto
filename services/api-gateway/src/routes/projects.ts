import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ status: "projects-router-ok" });
});

export { router as projectsRouter };
