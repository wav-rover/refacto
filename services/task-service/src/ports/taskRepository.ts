import type {
  NewTask,
  Task,
  TaskId,
  TaskUpdate,
} from '../domain/task';

export type { NewTask, Task, TaskId, TaskUpdate };

export interface TaskRepository {
  init(): Promise<void>;
  teardown(): Promise<void>;
  create(task: NewTask): Promise<Task>;
  findById(id: TaskId): Promise<Task | null>;
  findAll(): Promise<Task[]>;
  findByProjectId(projectId: string): Promise<Task[]>;
  findByAssignedTo(userId: string): Promise<Task[]>;
  update(id: TaskId, update: TaskUpdate): Promise<Task | null>;
  remove(id: TaskId): Promise<boolean>;
}
