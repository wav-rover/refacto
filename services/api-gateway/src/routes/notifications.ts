import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ status: "notifications-router-ok" });
});

export { router as notificationsRouter };
