import type { Request, Response } from 'express';
import type { EventBus } from '../ports/eventBus';
import type { TaskRepository } from '../ports/taskRepository';
import {
  createTask,
  updateTask,
  assignTask,
  unassignTask,
  completeTask,
  reopenTask,
  deleteTask,
} from '../use-cases';
import { requireCurrentUser } from '../middleware/currentUser';

function paramId(param: string | string[] | undefined): string {
  return Array.isArray(param) ? param[0] ?? '' : param ?? '';
}

function codeToStatus(code: string): number {
  switch (code) {
    case 'INVALID_INPUT':
      return 400;
    case 'NOT_FOUND':
      return 404;
    case 'FORBIDDEN':
      return 403;
    case 'CONFLICT':
      return 409;
    default:
      return 400;
  }
}

export function mountTaskRoutes(
  app: import('express').Express,
  repo: TaskRepository,
  eventBus: EventBus,
): void {
  // Créer une tâche
  app.post(
    '/tasks',
    requireCurrentUser,
    async (req: Request, res: Response): Promise<void> => {
      const currentUserId = req.currentUserId!;
      const { title, projectId, assignedTo, status, priority, dueDate } = req.body ?? {};

      const result = await createTask(repo, eventBus, {
        title,
        projectId,
        createdBy: currentUserId,
        assignedTo,
        status,
        priority,
        dueDate,
      });

      if (result.ok) {
        res.status(201).json(result.task);
        return;
      }
      res.status(codeToStatus(result.code)).json({
        error: result.code,
        message: result.message,
      });
    },
  );

  // Lister toutes les tâches
  app.get('/tasks', async (_req: Request, res: Response): Promise<void> => {
    const tasks = await repo.findAll();
    res.status(200).json(tasks);
  });

  // Lister les tâches d'un projet
  app.get('/tasks/project/:projectId', async (req: Request, res: Response): Promise<void> => {
    const projectId = paramId(req.params.projectId);
    const tasks = await repo.findByProjectId(projectId);
    res.status(200).json(tasks);
  });

  // Lister les tâches assignées à un utilisateur
  app.get('/tasks/user/:userId', async (req: Request, res: Response): Promise<void> => {
    const userId = paramId(req.params.userId);
    const tasks = await repo.findByAssignedTo(userId);
    res.status(200).json(tasks);
  });

  // Détail d'une tâche
  app.get('/tasks/:id', async (req: Request, res: Response): Promise<void> => {
    const id = paramId(req.params.id);
    const task = await repo.findById(id);
    if (!task) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Task not found' });
      return;
    }
    res.status(200).json(task);
  });

  // Mettre à jour une tâche
  app.patch(
    '/tasks/:id',
    requireCurrentUser,
    async (req: Request, res: Response): Promise<void> => {
      const id = paramId(req.params.id);
      const { title, status, priority, dueDate } = req.body ?? {};

      const result = await updateTask(repo, id, { title, status, priority, dueDate });

      if (result.ok) {
        res.status(200).json(result.task);
        return;
      }
      res.status(codeToStatus(result.code)).json({
        error: result.code,
        message: result.message,
      });
    },
  );

  // Assigner une tâche à un utilisateur
  app.post(
    '/tasks/:id/assign',
    requireCurrentUser,
    async (req: Request, res: Response): Promise<void> => {
      const currentUserId = req.currentUserId!;
      const id = paramId(req.params.id);
      const { userId } = req.body ?? {};

      if (typeof userId !== 'string' || userId.trim() === '') {
        res.status(400).json({ error: 'INVALID_INPUT', message: 'userId is required' });
        return;
      }

      const result = await assignTask(repo, eventBus, id, userId.trim(), currentUserId);

      if (result.ok) {
        res.status(200).json(result.task);
        return;
      }
      res.status(codeToStatus(result.code)).json({
        error: result.code,
        message: result.message,
      });
    },
  );

  // Désassigner une tâche
  app.post(
    '/tasks/:id/unassign',
    requireCurrentUser,
    async (req: Request, res: Response): Promise<void> => {
      const id = paramId(req.params.id);

      const result = await unassignTask(repo, id);

      if (result.ok) {
        res.status(200).json(result.task);
        return;
      }
      res.status(codeToStatus(result.code)).json({
        error: result.code,
        message: result.message,
      });
    },
  );

  // Terminer une tâche
  app.post(
    '/tasks/:id/complete',
    requireCurrentUser,
    async (req: Request, res: Response): Promise<void> => {
      const currentUserId = req.currentUserId!;
      const id = paramId(req.params.id);
      const { projectOwnerId } = req.body ?? {};

      const result = await completeTask(repo, eventBus, id, currentUserId, projectOwnerId ?? '');

      if (result.ok) {
        res.status(200).json(result.task);
        return;
      }
      res.status(codeToStatus(result.code)).json({
        error: result.code,
        message: result.message,
      });
    },
  );

  // Réouvrir une tâche
  app.post(
    '/tasks/:id/reopen',
    requireCurrentUser,
    async (req: Request, res: Response): Promise<void> => {
      const currentUserId = req.currentUserId!;
      const id = paramId(req.params.id);
      const { projectOwnerId } = req.body ?? {};

      const result = await reopenTask(repo, eventBus, id, currentUserId, projectOwnerId ?? '');

      if (result.ok) {
        res.status(200).json(result.task);
        return;
      }
      res.status(codeToStatus(result.code)).json({
        error: result.code,
        message: result.message,
      });
    },
  );

  // Supprimer une tâche
  app.delete(
    '/tasks/:id',
    requireCurrentUser,
    async (req: Request, res: Response): Promise<void> => {
      const currentUserId = req.currentUserId!;
      const id = paramId(req.params.id);
      const projectOwnerId = (req.query.projectOwnerId as string) ?? '';

      const result = await deleteTask(repo, eventBus, id, currentUserId, projectOwnerId);

      if (result.ok) {
        res.status(200).json({ success: true });
        return;
      }
      res.status(codeToStatus(result.code)).json({
        error: result.code,
        message: result.message,
      });
    },
  );
}
