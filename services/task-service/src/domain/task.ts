export type TaskId = string;

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: TaskId;
  title: string;
  projectId: string;
  createdBy: string;
  assignedTo: string | null;
  completed: boolean;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
}

export interface NewTask {
  title: string;
  projectId: string;
  createdBy: string;
  assignedTo?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
}

export interface TaskUpdate {
  title?: string;
  assignedTo?: string | null;
  completed?: boolean;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
}
