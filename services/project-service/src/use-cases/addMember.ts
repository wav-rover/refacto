import type { ProjectRepository } from '../ports/projectRepository';
import type { UseCaseResult } from './types';

export async function addMember(
  repo: ProjectRepository,
  projectId: string,
  userId: string,
  currentUserId: string,
): Promise<UseCaseResult> {
  const project = await repo.findById(projectId);
  if (!project) {
    return { ok: false, code: 'NOT_FOUND', message: 'Project not found' };
  }
  if (currentUserId !== project.ownerId) {
    return { ok: false, code: 'FORBIDDEN', message: 'Only the project owner can add members' };
  }
  if (project.memberIds.includes(userId)) {
    return { ok: false, code: 'CONFLICT', message: 'User is already a member' };
  }

  const updated = await repo.addMember(projectId, userId);
  return updated ? { ok: true, project: updated } : { ok: false, code: 'NOT_FOUND' };
}
