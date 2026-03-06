import type { ProjectRepository } from '../ports/projectRepository';
import type { UseCaseResult } from './types';

export async function closeProject(
  repo: ProjectRepository,
  projectId: string,
  currentUserId: string,
): Promise<UseCaseResult> {
  const project = await repo.findById(projectId);
  if (!project) {
    return { ok: false, code: 'NOT_FOUND', message: 'Project not found' };
  }
  if (currentUserId !== project.ownerId) {
    return { ok: false, code: 'FORBIDDEN', message: 'Only the project owner can close the project' };
  }
  if (project.status === 'closed') {
    return { ok: false, code: 'CONFLICT', message: 'Project is already closed' };
  }

  // Phase 3: no check for "all tasks done"; will be wired in phase 4 via port/event
  const updated = await repo.update(projectId, { status: 'closed' });
  return updated ? { ok: true, project: updated } : { ok: false, code: 'NOT_FOUND' };
}
