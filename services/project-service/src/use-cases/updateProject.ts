import type { ProjectRepository } from '../ports/projectRepository';
import type { ProjectUpdate } from '../domain/project';
import type { UseCaseResult } from './types';

export async function updateProject(
  repo: ProjectRepository,
  projectId: string,
  update: ProjectUpdate,
  currentUserId: string,
): Promise<UseCaseResult> {
  const project = await repo.findById(projectId);
  if (!project) {
    return { ok: false, code: 'NOT_FOUND', message: 'Project not found' };
  }
  if (currentUserId !== project.ownerId) {
    return { ok: false, code: 'FORBIDDEN', message: 'Only the project owner can update the project' };
  }
  if (project.status === 'closed') {
    return { ok: false, code: 'CONFLICT', message: 'Cannot update a closed project' };
  }

  if (update.name !== undefined) {
    const trimmed = typeof update.name === 'string' ? update.name.trim() : '';
    if (trimmed === '') {
      return { ok: false, code: 'INVALID_INPUT', message: 'Name is required' };
    }
  }

  const updated = await repo.update(projectId, update);
  return updated ? { ok: true, project: updated } : { ok: false, code: 'NOT_FOUND' };
}
