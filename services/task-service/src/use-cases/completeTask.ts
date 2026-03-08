import type { EventBus } from '../ports/eventBus';
import type { TaskRepository, TaskId } from '../ports/taskRepository';
import type { UseCaseResult } from './types';

/**
 * Marque une tâche comme terminée.
 *
 * Règles métier :
 * - La tâche doit exister.
 * - La tâche passe en status=done et completed=true.
 */
export async function completeTask(
  repo: TaskRepository,
  eventBus: EventBus,
  id: TaskId,
  actionUserId: string,
  projectOwnerId: string,
): Promise<UseCaseResult> {
  const existing = await repo.findById(id);
  if (!existing) {
    return { ok: false, code: 'NOT_FOUND', message: 'Task not found' };
  }

  if (existing.status === 'done') {
    // Déjà terminée, on retourne l'état actuel
    return { ok: true, task: existing };
  }

  const task = await repo.update(id, { status: 'done', completed: true });
  if (!task) {
    return { ok: false, code: 'NOT_FOUND', message: 'Task not found' };
  }

  const payload: Record<string, unknown> = {
    taskId: task.id,
    projectId: task.projectId,
    actionUserId,
    projectOwnerId,
  };
  if (task.assignedTo) {
    payload.assignedTo = task.assignedTo;
  }
  await eventBus.publish('TaskCompleted', payload);

  return { ok: true, task };
}
