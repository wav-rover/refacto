import type { Request, Response } from 'express';
import type { ProjectRepository } from '../ports/projectRepository';
import {
  createProject,
  addMember,
  removeMember,
  updateProject,
  closeProject,
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

export function mountProjectRoutes(
  app: import('express').Express,
  repo: ProjectRepository,
): void {
  app.post(
    '/projects',
    requireCurrentUser,
    async (req: Request, res: Response): Promise<void> => {
      const currentUserId = req.currentUserId!;
      const { name } = req.body ?? {};
      const result = await createProject(repo, name, currentUserId);
      if (result.ok) {
        res.status(201).json(result.project);
        return;
      }
      res.status(codeToStatus(result.code)).json({
        error: result.code,
        message: result.message,
      });
    },
  );

  app.get('/projects', async (_req: Request, res: Response): Promise<void> => {
    const projects = await repo.findAll();
    res.status(200).json(projects);
  });

  app.get('/projects/:id', async (req: Request, res: Response): Promise<void> => {
    const id = paramId(req.params.id);
    const project = await repo.findById(id);
    if (!project) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Project not found' });
      return;
    }
    res.status(200).json(project);
  });

  app.patch(
    '/projects/:id',
    requireCurrentUser,
    async (req: Request, res: Response): Promise<void> => {
      const currentUserId = req.currentUserId!;
      const id = paramId(req.params.id);
      const { name } = req.body ?? {};
      const result = await updateProject(repo, id, { name }, currentUserId);
      if (result.ok) {
        res.status(200).json(result.project);
        return;
      }
      res.status(codeToStatus(result.code)).json({
        error: result.code,
        message: result.message,
      });
    },
  );

  app.post(
    '/projects/:id/close',
    requireCurrentUser,
    async (req: Request, res: Response): Promise<void> => {
      const currentUserId = req.currentUserId!;
      const id = paramId(req.params.id);
      const result = await closeProject(repo, id, currentUserId);
      if (result.ok) {
        res.status(200).json(result.project);
        return;
      }
      res.status(codeToStatus(result.code)).json({
        error: result.code,
        message: result.message,
      });
    },
  );

  app.post(
    '/projects/:id/members',
    requireCurrentUser,
    async (req: Request, res: Response): Promise<void> => {
      const currentUserId = req.currentUserId!;
      const { userId } = req.body ?? {};
      if (typeof userId !== 'string' || userId.trim() === '') {
        res.status(400).json({ error: 'INVALID_INPUT', message: 'userId is required' });
        return;
      }
      const id = paramId(req.params.id);
      const result = await addMember(
        repo,
        id,
        userId.trim(),
        currentUserId,
      );
      if (result.ok) {
        res.status(200).json(result.project);
        return;
      }
      res.status(codeToStatus(result.code)).json({
        error: result.code,
        message: result.message,
      });
    },
  );

  app.delete(
    '/projects/:id/members/:userId',
    requireCurrentUser,
    async (req: Request, res: Response): Promise<void> => {
      const currentUserId = req.currentUserId!;
      const id = paramId(req.params.id);
      const memberUserId = paramId(req.params.userId);
      const result = await removeMember(
        repo,
        id,
        memberUserId,
        currentUserId,
      );
      if (result.ok) {
        res.status(200).json(result.project);
        return;
      }
      res.status(codeToStatus(result.code)).json({
        error: result.code,
        message: result.message,
      });
    },
  );
}
