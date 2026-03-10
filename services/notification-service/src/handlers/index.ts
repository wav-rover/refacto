import type { NotificationRepository } from '../ports/notificationRepository';
import type { EventBus } from '../ports/eventBus';
import { createNotificationIfAllowed } from '../use-cases/createNotificationIfAllowed';
import type {
  TaskAssignedPayload,
  TaskCompletedPayload,
  TaskDeletedPayload,
  ProjectClosedPayload,
} from './payloads';

const NOOP_EVENT_TYPES = ['MemberAddedToProject'] as const;

function hasRequiredTaskAssigned(p: unknown): p is TaskAssignedPayload {
  const q = p as Record<string, unknown>;
  return (
    typeof q?.actionUserId === 'string' &&
    typeof q?.assignedTo === 'string'
  );
}

function hasRequiredTaskCompletedOrReopenedOrDeleted(
  p: unknown,
): p is TaskCompletedPayload {
  const q = p as Record<string, unknown>;
  return (
    typeof q?.actionUserId === 'string' && typeof q?.projectOwnerId === 'string'
  );
}

function hasRequiredProjectClosed(p: unknown): p is ProjectClosedPayload {
  const q = p as Record<string, unknown>;
  return (
    typeof q?.closedByUserId === 'string' &&
    Array.isArray(q?.memberIds) &&
    (q.memberIds as unknown[]).every((id) => typeof id === 'string')
  );
}

async function handleTaskAssigned(
  repo: NotificationRepository,
  payload: unknown,
): Promise<void> {
  if (!hasRequiredTaskAssigned(payload)) return;
  const title = (payload as TaskAssignedPayload).title;
  const message = title
    ? `Task "${title}" was assigned to you`
    : 'A task was assigned to you';
  await createNotificationIfAllowed(repo, {
    actionUserId: payload.actionUserId,
    targetUserId: payload.assignedTo,
    message,
    type: 'TaskAssigned',
  });
}

async function handleTaskCompleted(
  repo: NotificationRepository,
  payload: unknown,
): Promise<void> {
  if (!hasRequiredTaskCompletedOrReopenedOrDeleted(payload)) return;
  const p = payload as TaskCompletedPayload;
  const message = 'A task was completed';
  await createNotificationIfAllowed(repo, {
    actionUserId: p.actionUserId,
    targetUserId: p.projectOwnerId,
    message,
    type: 'TaskCompleted',
  });
  if (p.assignedTo && p.assignedTo !== p.actionUserId) {
    await createNotificationIfAllowed(repo, {
      actionUserId: p.actionUserId,
      targetUserId: p.assignedTo,
      message,
      type: 'TaskCompleted',
    });
  }
}

async function handleTaskReopened(
  repo: NotificationRepository,
  payload: unknown,
): Promise<void> {
  if (!hasRequiredTaskCompletedOrReopenedOrDeleted(payload)) return;
  const p = payload as TaskCompletedPayload;
  const message = 'A task was reopened';
  await createNotificationIfAllowed(repo, {
    actionUserId: p.actionUserId,
    targetUserId: p.projectOwnerId,
    message,
    type: 'TaskReopened',
  });
  if (p.assignedTo && p.assignedTo !== p.actionUserId) {
    await createNotificationIfAllowed(repo, {
      actionUserId: p.actionUserId,
      targetUserId: p.assignedTo,
      message,
      type: 'TaskReopened',
    });
  }
}

async function handleTaskDeleted(
  repo: NotificationRepository,
  payload: unknown,
): Promise<void> {
  if (!hasRequiredTaskCompletedOrReopenedOrDeleted(payload)) return;
  const p = payload as TaskDeletedPayload;
  const message = 'A task was deleted';
  const actionUserId = p.actionUserId;
  await createNotificationIfAllowed(repo, {
    actionUserId,
    targetUserId: p.projectOwnerId,
    message,
    type: 'TaskDeleted',
  });
  if (p.assignedTo) {
    await createNotificationIfAllowed(repo, {
      actionUserId,
      targetUserId: p.assignedTo,
      message,
      type: 'TaskDeleted',
    });
  }
}

async function handleProjectClosed(
  repo: NotificationRepository,
  payload: unknown,
): Promise<void> {
  if (!hasRequiredProjectClosed(payload)) return;
  const p = payload as ProjectClosedPayload;
  const message = 'Project was closed';
  const actionUserId = p.closedByUserId;
  for (const memberId of p.memberIds) {
    await createNotificationIfAllowed(repo, {
      actionUserId,
      targetUserId: memberId,
      message,
      type: 'ProjectClosed',
    });
  }
}

/**
 * Enregistre les handlers par type d'événement sur l'EventBus.
 * Chaque handler appelle createNotificationIfAllowed (règle actionUserId !== targetUserId).
 */
export function registerHandlers(
  eventBus: EventBus,
  repo: NotificationRepository,
): void {
  eventBus.subscribe('TaskAssigned', (p) => handleTaskAssigned(repo, p));
  eventBus.subscribe('TaskCompleted', (p) => handleTaskCompleted(repo, p));
  eventBus.subscribe('TaskReopened', (p) => handleTaskReopened(repo, p));
  eventBus.subscribe('TaskDeleted', (p) => handleTaskDeleted(repo, p));
  eventBus.subscribe('ProjectClosed', (p) => handleProjectClosed(repo, p));

  for (const eventType of NOOP_EVENT_TYPES) {
    eventBus.subscribe(eventType, async () => {});
  }
}
