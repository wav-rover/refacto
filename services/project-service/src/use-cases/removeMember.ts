import type { ProjectRepository } from '../ports/projectRepository';
import type { UseCaseResult } from './types';

export async function removeMember(
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
    return { ok: false, code: 'FORBIDDEN', message: 'Only the project owner can remove members' };
  }
  if (userId === project.ownerId) {
    return { ok: false, code: 'FORBIDDEN', message: 'Cannot remove the project owner' };
  }
  if (!project.memberIds.includes(userId)) {
    return { ok: false, code: 'NOT_FOUND', message: 'User is not a member' };
  }

  // Phase 3: no check for "member has assigned tasks"; will be wired in phase 4 via port/event
  const updated = await repo.removeMember(projectId, userId);
  return updated ? { ok: true, project: updated } : { ok: false, code: 'NOT_FOUND' };
}
