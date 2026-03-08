import type { EventBus } from '../ports/eventBus';
import type { ProjectRepository } from '../ports/projectRepository';
import type { UseCaseResult } from './types';

export async function closeProject(
  repo: ProjectRepository,
  eventBus: EventBus,
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

  const updated = await repo.update(projectId, { status: 'closed' });
  if (!updated) {
    return { ok: false, code: 'NOT_FOUND' };
  }

  const closedAt = new Date().toISOString();
  await eventBus.publish('ProjectClosed', {
    projectId: updated.id,
    closedAt,
    closedByUserId: currentUserId,
    memberIds: updated.memberIds,
  });
  return { ok: true, project: updated };
}
