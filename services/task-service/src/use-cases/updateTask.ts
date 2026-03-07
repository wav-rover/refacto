import type { TaskRepository, TaskId } from '../ports/taskRepository';
import type { TaskPriority, TaskStatus } from '../domain/task';
import type { UseCaseResult } from './types';

export interface UpdateTaskInput {
  title?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
}

/**
 * Met à jour une tâche existante (titre, statut, priorité, dueDate).
 *
 * Règles métier :
 * - La tâche doit exister.
 * - Le titre ne peut pas être vide si fourni.
 * - Les tâches avec status=done ou projet clôturé ne peuvent pas être modifiées
 *   (projet clôturé vérifié en phase 4).
 */
export async function updateTask(
  repo: TaskRepository,
  id: TaskId,
  input: UpdateTaskInput,
): Promise<UseCaseResult> {
  const existing = await repo.findById(id);
  if (!existing) {
    return { ok: false, code: 'NOT_FOUND', message: 'Task not found' };
  }

  // Interdire modification si la tâche est terminée
  if (existing.status === 'done') {
    return { ok: false, code: 'CONFLICT', message: 'Cannot update a completed task' };
  }

  if (input.title !== undefined) {
    const trimmedTitle = input.title.trim();
    if (trimmedTitle === '') {
      return { ok: false, code: 'INVALID_INPUT', message: 'Title cannot be empty' };
    }
  }

  const task = await repo.update(id, {
    title: input.title?.trim(),
    status: input.status,
    priority: input.priority,
    dueDate: input.dueDate,
  });

  if (!task) {
    return { ok: false, code: 'NOT_FOUND', message: 'Task not found' };
  }

  return { ok: true, task };
}
