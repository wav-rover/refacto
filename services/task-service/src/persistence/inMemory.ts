import crypto from 'crypto';
import type { NewTask, Task, TaskId, TaskUpdate } from '../domain/task';
import type { TaskRepository } from '../ports/taskRepository';

const byId = new Map<TaskId, Task>();

async function init(): Promise<void> {
  byId.clear();
}

async function teardown(): Promise<void> {
  byId.clear();
}

async function create(task: NewTask): Promise<Task> {
  const id: TaskId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const created: Task = {
    id,
    title: task.title.trim(),
    projectId: task.projectId,
    createdBy: task.createdBy,
    assignedTo: task.assignedTo ?? null,
    completed: false,
    status: task.status ?? 'todo',
    priority: task.priority ?? 'medium',
    dueDate: task.dueDate ?? null,
    createdAt,
  };
  byId.set(id, created);
  return created;
}

async function findById(id: TaskId): Promise<Task | null> {
  return byId.get(id) ?? null;
}

async function findAll(): Promise<Task[]> {
  return Array.from(byId.values());
}

async function findByProjectId(projectId: string): Promise<Task[]> {
  return Array.from(byId.values()).filter((t) => t.projectId === projectId);
}

async function findByAssignedTo(userId: string): Promise<Task[]> {
  return Array.from(byId.values()).filter((t) => t.assignedTo === userId);
}

async function update(id: TaskId, upd: TaskUpdate): Promise<Task | null> {
  const task = byId.get(id);
  if (!task) return null;

  if (upd.title !== undefined) task.title = upd.title.trim();
  if (upd.assignedTo !== undefined) task.assignedTo = upd.assignedTo;
  if (upd.completed !== undefined) task.completed = upd.completed;
  if (upd.status !== undefined) task.status = upd.status;
  if (upd.priority !== undefined) task.priority = upd.priority;
  if (upd.dueDate !== undefined) task.dueDate = upd.dueDate;

  return task;
}

async function remove(id: TaskId): Promise<boolean> {
  return byId.delete(id);
}

const inMemoryRepository: TaskRepository = {
  init,
  teardown,
  create,
  findById,
  findAll,
  findByProjectId,
  findByAssignedTo,
  update,
  remove,
};

export default inMemoryRepository;
