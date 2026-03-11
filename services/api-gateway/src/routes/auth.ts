import { Router } from "express";

import { getAuthServiceUrl } from "../config/authConfig";
import { forwardJson } from "../infra/httpClient";

const router = Router();

router.post("/register", async (req, res) => {
  const baseUrl = getAuthServiceUrl();

  const { status, headers, body } = await forwardJson({
    baseUrl,
    path: "/auth/register",
    method: "POST",
    headers: {
      cookie: req.header("cookie"),
      accept: req.header("accept") ?? "application/json",
      "user-agent": req.header("user-agent"),
    },
    body: req.body,
  });

  const setCookie = headers.get("set-cookie");
  if (setCookie) {
    res.setHeader("set-cookie", setCookie);
  }

  res.status(status).json(body);
});

router.post("/login", async (req, res) => {
  const baseUrl = getAuthServiceUrl();

  const { status, headers, body } = await forwardJson({
    baseUrl,
    path: "/auth/login",
    method: "POST",
    headers: {
      cookie: req.header("cookie"),
      accept: req.header("accept") ?? "application/json",
      "user-agent": req.header("user-agent"),
    },
    body: req.body,
  });

  const setCookie = headers.get("set-cookie");
  if (setCookie) {
    res.setHeader("set-cookie", setCookie);
  }

  res.status(status).json(body);
});

router.get("/me", async (req, res) => {
  const baseUrl = getAuthServiceUrl();

  const { status, headers, body } = await forwardJson({
    baseUrl,
    path: "/auth/me",
    method: "GET",
    headers: {
      cookie: req.header("cookie"),
      accept: req.header("accept") ?? "application/json",
      "user-agent": req.header("user-agent"),
    },
  });

  const setCookie = headers.get("set-cookie");
  if (setCookie) {
    res.setHeader("set-cookie", setCookie);
  }

  res.status(status).json(body);
});

export { router as authRouter };
