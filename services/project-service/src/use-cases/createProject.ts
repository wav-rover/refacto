import type { ProjectRepository } from '../ports/projectRepository';
import type { UseCaseResult } from './types';

export async function createProject(
  repo: ProjectRepository,
  name: string,
  ownerId: string,
): Promise<UseCaseResult> {
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (trimmedName === '') {
    return { ok: false, code: 'INVALID_INPUT', message: 'Name is required' };
  }
  if (!ownerId || typeof ownerId !== 'string' || ownerId.trim() === '') {
    return { ok: false, code: 'INVALID_INPUT', message: 'Owner is required' };
  }

  const project = await repo.create({
    name: trimmedName,
    ownerId: ownerId.trim(),
  });
  return { ok: true, project };
}
