export type NotificationId = string;

export type NotificationType =
  | 'TaskAssigned'
  | 'TaskCompleted'
  | 'TaskReopened'
  | 'TaskDeleted'
  | 'ProjectClosed'
  | 'MemberAddedToProject';

export interface Notification {
  id: NotificationId;
  userId: string;
  message: string;
  type: NotificationType;
  createdAt: string;
}

export interface NewNotification {
  userId: string;
  message: string;
  type: NotificationType;
}
