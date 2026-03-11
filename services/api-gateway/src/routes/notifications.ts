import { Router } from "express";

import { requireAuthGateway } from "../middlewares/requireAuthGateway";

const router = Router();

router.use(requireAuthGateway);

router.get("/health", (_req, res) => {
  res.status(200).json({ status: "notifications-router-ok" });
});

export { router as notificationsRouter };
