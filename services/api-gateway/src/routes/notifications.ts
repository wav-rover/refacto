import { Router } from "express";

import { getNotificationServiceUrl } from "../config/notificationConfig";
import { forwardJson } from "../infra/httpClient";
import { requireAuthGateway } from "../middlewares/requireAuthGateway";

const router = Router();

router.use(requireAuthGateway);

router.get("/", async (req, res) => {
  const baseUrl = getNotificationServiceUrl();

  const { status, body } = await forwardJson({
    baseUrl,
    path: "/notifications",
    method: "GET",
    headers: {
      accept: req.header("accept") ?? "application/json",
      "user-agent": req.header("user-agent"),
      cookie: req.header("cookie"),
      "x-user-id": req.auth?.userId,
    },
  });

  res.status(status).json(body);
});

export { router as notificationsRouter };
