import type { TaskRepository, TaskId } from '../ports/taskRepository';

export type DeleteResult =
  | { ok: true }
  | { ok: false; code: 'NOT_FOUND' | 'CONFLICT'; message?: string };

/**
 * Supprime une tâche.
 *
 * Règles métier :
 * - La tâche doit exister.
 * - Le projet doit être ouvert (vérifié en phase 4).
 * - Suppression physique (pas de soft delete).
 */
export async function deleteTask(
  repo: TaskRepository,
  id: TaskId,
  // projectClosed sera utilisé en phase 4 quand on aura le read model
  _projectClosed?: boolean,
): Promise<DeleteResult> {
  const existing = await repo.findById(id);
  if (!existing) {
    return { ok: false, code: 'NOT_FOUND', message: 'Task not found' };
  }

  // Phase 4 : vérifier si le projet est clôturé
  // if (projectClosed) {
  //   return { ok: false, code: 'CONFLICT', message: 'Cannot delete task of a closed project' };
  // }

  await repo.remove(id);
  return { ok: true };
}
