import type { TaskRepository, TaskId } from '../ports/taskRepository';
import type { UseCaseResult } from './types';

/**
 * Réouvre une tâche terminée.
 *
 * Règles métier :
 * - La tâche doit exister.
 * - Une tâche ne peut pas être réouverte si le projet est clôturé
 *   (vérifié en phase 4 via événements ou read model).
 * - La tâche passe en status=todo et completed=false.
 */
export async function reopenTask(
  repo: TaskRepository,
  id: TaskId,
  // projectClosed sera utilisé en phase 4 quand on aura le read model
  _projectClosed?: boolean,
): Promise<UseCaseResult> {
  const existing = await repo.findById(id);
  if (!existing) {
    return { ok: false, code: 'NOT_FOUND', message: 'Task not found' };
  }

  if (existing.status !== 'done') {
    // Pas terminée, rien à faire
    return { ok: true, task: existing };
  }

  // Phase 4 : vérifier si le projet est clôturé
  // if (projectClosed) {
  //   return { ok: false, code: 'CONFLICT', message: 'Cannot reopen task of a closed project' };
  // }

  const task = await repo.update(id, { status: 'todo', completed: false });
  if (!task) {
    return { ok: false, code: 'NOT_FOUND', message: 'Task not found' };
  }

  return { ok: true, task };
}
