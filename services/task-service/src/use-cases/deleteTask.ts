import type { EventBus } from '../ports/eventBus';
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
  eventBus: EventBus,
  id: TaskId,
  actionUserId: string,
  projectOwnerId: string,
): Promise<DeleteResult> {
  const existing = await repo.findById(id);
  if (!existing) {
    return { ok: false, code: 'NOT_FOUND', message: 'Task not found' };
  }

  const payload: Record<string, unknown> = {
    taskId: existing.id,
    projectId: existing.projectId,
    actionUserId,
    projectOwnerId,
  };
  if (existing.assignedTo) {
    payload.assignedTo = existing.assignedTo;
  }

  await repo.remove(id);
  await eventBus.publish('TaskDeleted', payload);

  return { ok: true };
}
