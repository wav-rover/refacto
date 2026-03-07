import type { TaskRepository, TaskId } from '../ports/taskRepository';
import type { UseCaseResult } from './types';

/**
 * Affecte une tâche à un utilisateur.
 *
 * Règles métier :
 * - La tâche doit exister.
 * - L'utilisateur assigné doit être membre du projet (vérifié en phase 4).
 * - Règle de capacité : une seule tâche active par personne au global.
 * - Une tâche terminée ne peut pas être réassignée.
 */
export async function assignTask(
  repo: TaskRepository,
  id: TaskId,
  userId: string,
): Promise<UseCaseResult> {
  const existing = await repo.findById(id);
  if (!existing) {
    return { ok: false, code: 'NOT_FOUND', message: 'Task not found' };
  }

  if (existing.status === 'done') {
    return { ok: false, code: 'CONFLICT', message: 'Cannot assign a completed task' };
  }

  const trimmedUserId = userId?.trim();
  if (!trimmedUserId) {
    return { ok: false, code: 'INVALID_INPUT', message: 'User ID is required' };
  }

  // Déjà assigné au même utilisateur
  if (existing.assignedTo === trimmedUserId) {
    return { ok: true, task: existing };
  }

  // Règle de capacité : une seule tâche active par personne
  const userTasks = await repo.findByAssignedTo(trimmedUserId);
  const hasActiveTask = userTasks.some((t) => t.status !== 'done');
  if (hasActiveTask) {
    return {
      ok: false,
      code: 'CONFLICT',
      message: 'User already has an active task assigned',
    };
  }

  const task = await repo.update(id, { assignedTo: trimmedUserId });
  if (!task) {
    return { ok: false, code: 'NOT_FOUND', message: 'Task not found' };
  }

  return { ok: true, task };
}

/**
 * Désaffecte une tâche (retire l'utilisateur assigné).
 */
export async function unassignTask(
  repo: TaskRepository,
  id: TaskId,
): Promise<UseCaseResult> {
  const existing = await repo.findById(id);
  if (!existing) {
    return { ok: false, code: 'NOT_FOUND', message: 'Task not found' };
  }

  if (existing.status === 'done') {
    return { ok: false, code: 'CONFLICT', message: 'Cannot unassign a completed task' };
  }

  const task = await repo.update(id, { assignedTo: null });
  if (!task) {
    return { ok: false, code: 'NOT_FOUND', message: 'Task not found' };
  }

  return { ok: true, task };
}
