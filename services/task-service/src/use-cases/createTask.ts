import type { TaskRepository } from '../ports/taskRepository';
import type { TaskPriority, TaskStatus } from '../domain/task';
import type { UseCaseResult } from './types';

export interface CreateTaskInput {
  title: string;
  projectId: string;
  createdBy: string;
  assignedTo?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
}

/**
 * Crée une nouvelle tâche liée à un projet.
 *
 * Règles métier :
 * - Le titre ne doit pas être vide.
 * - Le projectId doit être fourni (la vérification que le projet existe
 *   et est ouvert sera faite en phase 4 via événements ou read model).
 * - Si une affectation initiale est fournie, la règle "une seule tâche active
 *   par personne" est vérifiée.
 */
export async function createTask(
  repo: TaskRepository,
  input: CreateTaskInput,
): Promise<UseCaseResult> {
  const trimmedTitle = typeof input.title === 'string' ? input.title.trim() : '';
  if (trimmedTitle === '') {
    return { ok: false, code: 'INVALID_INPUT', message: 'Title is required' };
  }
  if (!input.projectId || typeof input.projectId !== 'string' || input.projectId.trim() === '') {
    return { ok: false, code: 'INVALID_INPUT', message: 'Project ID is required' };
  }
  if (!input.createdBy || typeof input.createdBy !== 'string' || input.createdBy.trim() === '') {
    return { ok: false, code: 'INVALID_INPUT', message: 'Creator ID is required' };
  }

  // Règle de capacité : une seule tâche active par personne
  if (input.assignedTo) {
    const userTasks = await repo.findByAssignedTo(input.assignedTo);
    const hasActiveTask = userTasks.some((t) => t.status !== 'done');
    if (hasActiveTask) {
      return {
        ok: false,
        code: 'CONFLICT',
        message: 'User already has an active task assigned',
      };
    }
  }

  const task = await repo.create({
    title: trimmedTitle,
    projectId: input.projectId.trim(),
    createdBy: input.createdBy.trim(),
    assignedTo: input.assignedTo?.trim() ?? null,
    status: input.status ?? 'todo',
    priority: input.priority ?? 'medium',
    dueDate: input.dueDate ?? null,
  });

  return { ok: true, task };
}
