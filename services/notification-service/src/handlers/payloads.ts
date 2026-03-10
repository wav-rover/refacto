/**
 * Payload types for consumed events. Aligned with doc/architecture/contrat-evenements.md.
 */

export interface TaskAssignedPayload {
  taskId: string;
  projectId: string;
  actionUserId: string;
  assignedTo: string;
  title?: string;
}

export interface TaskCompletedPayload {
  taskId: string;
  projectId: string;
  actionUserId: string;
  projectOwnerId: string;
  assignedTo?: string;
}

export interface TaskReopenedPayload {
  taskId: string;
  projectId: string;
  actionUserId: string;
  projectOwnerId: string;
  assignedTo?: string;
}

export interface TaskDeletedPayload {
  taskId: string;
  projectId: string;
  actionUserId: string;
  projectOwnerId: string;
  assignedTo?: string;
}

export interface ProjectClosedPayload {
  projectId: string;
  closedAt: string;
  closedByUserId: string;
  memberIds: string[];
}

export type EventPayload =
  | TaskAssignedPayload
  | TaskCompletedPayload
  | TaskReopenedPayload
  | TaskDeletedPayload
  | ProjectClosedPayload;

export interface StreamMessage {
  type: string;
  payload: unknown;
  timestamp: string;
}
