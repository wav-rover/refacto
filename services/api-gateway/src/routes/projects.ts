import type { Request, Response } from "express";
import { Router } from "express";

import { getProjectServiceUrl } from "../config/projectConfig";
import { forwardJson } from "../infra/httpClient";
import { requireAuthGateway } from "../middlewares/requireAuthGateway";

const router = Router();

router.use(requireAuthGateway);

router.get("/", async (req: Request, res: Response): Promise<void> => {
  const baseUrl = getProjectServiceUrl();

  try {
    const { status, body } = await forwardJson({
      baseUrl,
      path: "/projects",
      method: "GET",
      headers: {
        accept: req.header("accept") ?? "application/json",
        "x-user-id": req.header("x-user-id"),
        "x-request-id": req.header("x-request-id"),
      },
    });

    res.status(status).json(body);
  } catch (error) {
    console.error(error);
    res.status(502).json({
      error: "UPSTREAM_UNAVAILABLE",
      message: "project-service unavailable",
    });
  }
});

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const baseUrl = getProjectServiceUrl();

  try {
    const { status, body } = await forwardJson({
      baseUrl,
      path: "/projects",
      method: "POST",
      headers: {
        accept: req.header("accept") ?? "application/json",
        "x-user-id": req.header("x-user-id"),
        "x-request-id": req.header("x-request-id"),
      },
      body: req.body,
    });

    res.status(status).json(body);
  } catch (error) {
    console.error(error);
    res.status(502).json({
      error: "UPSTREAM_UNAVAILABLE",
      message: "project-service unavailable",
    });
  }
});

router.patch(
  "/:projectId",
  async (req: Request, res: Response): Promise<void> => {
    const baseUrl = getProjectServiceUrl();

    try {
      const { status, body } = await forwardJson({
        baseUrl,
        path: `/projects/${req.params.projectId}`,
        method: "PATCH",
        headers: {
          accept: req.header("accept") ?? "application/json",
          "x-user-id": req.header("x-user-id"),
          "x-request-id": req.header("x-request-id"),
        },
        body: req.body,
      });

      res.status(status).json(body);
    } catch (error) {
      console.error(error);
      res.status(502).json({
        error: "UPSTREAM_UNAVAILABLE",
        message: "project-service unavailable",
      });
    }
  }
);

router.post(
  "/:projectId/close",
  async (req: Request, res: Response): Promise<void> => {
    const baseUrl = getProjectServiceUrl();

    try {
      const { status, body } = await forwardJson({
        baseUrl,
        path: `/projects/${req.params.projectId}/close`,
        method: "POST",
        headers: {
          accept: req.header("accept") ?? "application/json",
          "x-user-id": req.header("x-user-id"),
          "x-request-id": req.header("x-request-id"),
        },
      });

      res.status(status).json(body);
    } catch (error) {
      console.error(error);
      res.status(502).json({
        error: "UPSTREAM_UNAVAILABLE",
        message: "project-service unavailable",
      });
    }
  }
);

router.post(
  "/:projectId/members",
  async (req: Request, res: Response): Promise<void> => {
    const baseUrl = getProjectServiceUrl();

    try {
      const { status, body } = await forwardJson({
        baseUrl,
        path: `/projects/${req.params.projectId}/members`,
        method: "POST",
        headers: {
          accept: req.header("accept") ?? "application/json",
          "x-user-id": req.header("x-user-id"),
          "x-request-id": req.header("x-request-id"),
        },
        body: req.body,
      });

      res.status(status).json(body);
    } catch (error) {
      console.error(error);
      res.status(502).json({
        error: "UPSTREAM_UNAVAILABLE",
        message: "project-service unavailable",
      });
    }
  }
);

router.delete(
  "/:projectId/members/:userId",
  async (req: Request, res: Response): Promise<void> => {
    const baseUrl = getProjectServiceUrl();

    try {
      const { status, body } = await forwardJson({
        baseUrl,
        path: `/projects/${req.params.projectId}/members/${req.params.userId}`,
        method: "DELETE",
        headers: {
          accept: req.header("accept") ?? "application/json",
          "x-user-id": req.header("x-user-id"),
          "x-request-id": req.header("x-request-id"),
        },
      });

      res.status(status).json(body);
    } catch (error) {
      console.error(error);
      res.status(502).json({
        error: "UPSTREAM_UNAVAILABLE",
        message: "project-service unavailable",
      });
    }
  }
);

export { router as projectsRouter };

