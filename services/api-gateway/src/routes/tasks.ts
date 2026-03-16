import type { Request, Response } from "express";
import { Router } from "express";

import { getTaskServiceUrl } from "../config/taskConfig";
import { forwardJson } from "../infra/httpClient";
import { requireAuthGateway } from "../middlewares/requireAuthGateway";

const router = Router();

// GET /api/tasks - Liste toutes les tâches (public)
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const baseUrl = getTaskServiceUrl();

  try {
    const { status, body } = await forwardJson({
      baseUrl,
      path: "/tasks",
      method: "GET",
      headers: {
        accept: req.header("accept") ?? "application/json",
        "x-request-id": req.header("x-request-id"),
      },
    });

    res.status(status).json(body);
  } catch (error) {
    console.error(error);
    res.status(502).json({
      error: "UPSTREAM_UNAVAILABLE",
      message: "task-service unavailable",
    });
  }
});

// GET /api/tasks/project/:projectId - Tâches d'un projet (public)
router.get(
  "/project/:projectId",
  async (req: Request, res: Response): Promise<void> => {
    const baseUrl = getTaskServiceUrl();

    try {
      const { status, body } = await forwardJson({
        baseUrl,
        path: `/tasks/project/${req.params.projectId}`,
        method: "GET",
        headers: {
          accept: req.header("accept") ?? "application/json",
          "x-request-id": req.header("x-request-id"),
        },
      });

      res.status(status).json(body);
    } catch (error) {
      console.error(error);
      res.status(502).json({
        error: "UPSTREAM_UNAVAILABLE",
        message: "task-service unavailable",
      });
    }
  }
);

// GET /api/tasks/user/:userId - Tâches assignées à un utilisateur (public)
router.get(
  "/user/:userId",
  async (req: Request, res: Response): Promise<void> => {
    const baseUrl = getTaskServiceUrl();

    try {
      const { status, body } = await forwardJson({
        baseUrl,
        path: `/tasks/user/${req.params.userId}`,
        method: "GET",
        headers: {
          accept: req.header("accept") ?? "application/json",
          "x-request-id": req.header("x-request-id"),
        },
      });

      res.status(status).json(body);
    } catch (error) {
      console.error(error);
      res.status(502).json({
        error: "UPSTREAM_UNAVAILABLE",
        message: "task-service unavailable",
      });
    }
  }
);

// GET /api/tasks/:id - Détail d'une tâche (public)
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const baseUrl = getTaskServiceUrl();

  try {
    const { status, body } = await forwardJson({
      baseUrl,
      path: `/tasks/${req.params.id}`,
      method: "GET",
      headers: {
        accept: req.header("accept") ?? "application/json",
        "x-request-id": req.header("x-request-id"),
      },
    });

    res.status(status).json(body);
  } catch (error) {
    console.error(error);
    res.status(502).json({
      error: "UPSTREAM_UNAVAILABLE",
      message: "task-service unavailable",
    });
  }
});

// Routes protégées (auth requise)
router.use(requireAuthGateway);

// POST /api/tasks - Créer une tâche
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const baseUrl = getTaskServiceUrl();

  try {
    const { status, body } = await forwardJson({
      baseUrl,
      path: "/tasks",
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
      message: "task-service unavailable",
    });
  }
});

// PATCH /api/tasks/:id - Mettre à jour une tâche
router.patch("/:id", async (req: Request, res: Response): Promise<void> => {
  const baseUrl = getTaskServiceUrl();

  try {
    const { status, body } = await forwardJson({
      baseUrl,
      path: `/tasks/${req.params.id}`,
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
      message: "task-service unavailable",
    });
  }
});

// POST /api/tasks/:id/assign - Assigner une tâche
router.post(
  "/:id/assign",
  async (req: Request, res: Response): Promise<void> => {
    const baseUrl = getTaskServiceUrl();

    try {
      const { status, body } = await forwardJson({
        baseUrl,
        path: `/tasks/${req.params.id}/assign`,
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
        message: "task-service unavailable",
      });
    }
  }
);

// POST /api/tasks/:id/unassign - Désassigner une tâche
router.post(
  "/:id/unassign",
  async (req: Request, res: Response): Promise<void> => {
    const baseUrl = getTaskServiceUrl();

    try {
      const { status, body } = await forwardJson({
        baseUrl,
        path: `/tasks/${req.params.id}/unassign`,
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
        message: "task-service unavailable",
      });
    }
  }
);

// POST /api/tasks/:id/complete - Marquer une tâche comme terminée
router.post(
  "/:id/complete",
  async (req: Request, res: Response): Promise<void> => {
    const baseUrl = getTaskServiceUrl();

    try {
      const { status, body } = await forwardJson({
        baseUrl,
        path: `/tasks/${req.params.id}/complete`,
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
        message: "task-service unavailable",
      });
    }
  }
);

// POST /api/tasks/:id/reopen - Rouvrir une tâche terminée
router.post(
  "/:id/reopen",
  async (req: Request, res: Response): Promise<void> => {
    const baseUrl = getTaskServiceUrl();

    try {
      const { status, body } = await forwardJson({
        baseUrl,
        path: `/tasks/${req.params.id}/reopen`,
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
        message: "task-service unavailable",
      });
    }
  }
);

// DELETE /api/tasks/:id - Supprimer une tâche
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const baseUrl = getTaskServiceUrl();
  const projectOwnerId = req.query.projectOwnerId as string | undefined;
  const queryString = projectOwnerId ? `?projectOwnerId=${projectOwnerId}` : "";

  try {
    const { status, body } = await forwardJson({
      baseUrl,
      path: `/tasks/${req.params.id}${queryString}`,
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
      message: "task-service unavailable",
    });
  }
});

export { router as tasksRouter };
