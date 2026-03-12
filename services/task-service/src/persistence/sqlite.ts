import fs from 'fs';
import path from 'path';
import sqlite3Pkg from 'sqlite3';
import crypto from 'crypto';
import type { NewTask, Task, TaskId, TaskUpdate } from '../domain/task';
import type { TaskRepository } from '../ports/taskRepository';

const sqlite3 = sqlite3Pkg.verbose();

const getDatabaseLocation = (): string =>
  process.env.TASK_SQLITE_DB_LOCATION ??
  path.join(
    path.resolve(__dirname, '..', '..', '..', '..'),
    'data',
    'task-service.db',
  );

type Database = sqlite3Pkg.Database;

interface TaskRow {
  id: string;
  title: string;
  projectId: string;
  createdBy: string;
  assignedTo: string | null;
  completed: number;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
}

let db: Database | null = null;

function mapRow(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    projectId: row.projectId,
    createdBy: row.createdBy,
    assignedTo: row.assignedTo ?? null,
    completed: row.completed === 1,
    status: (row.status ?? 'todo') as Task['status'],
    priority: (row.priority ?? 'medium') as Task['priority'],
    dueDate: row.dueDate ?? null,
    createdAt: row.createdAt,
  };
}

function init(): Promise<void> {
  const location = getDatabaseLocation();
  const dirName = path.dirname(location);
  if (location !== ':memory:' && !fs.existsSync(dirName)) {
    fs.mkdirSync(dirName, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(location, (err: Error | null) => {
      if (err) {
        reject(err);
        return;
      }

      const database = db;
      if (!database) {
        reject(new Error('Database not initialised'));
        return;
      }

      database.run(
        `CREATE TABLE IF NOT EXISTS tasks (
          id varchar(36) PRIMARY KEY,
          title varchar(255) NOT NULL,
          projectId varchar(36) NOT NULL,
          createdBy varchar(36) NOT NULL,
          assignedTo varchar(36),
          completed boolean NOT NULL DEFAULT 0,
          status varchar(20) NOT NULL DEFAULT 'todo',
          priority varchar(20) NOT NULL DEFAULT 'medium',
          dueDate varchar(30),
          createdAt varchar(30) NOT NULL
        )`,
        (createErr: Error | null) => {
          if (createErr) {
            reject(createErr);
            return;
          }
          if (process.env.NODE_ENV !== 'test') {
            console.log(
              `[task-service] Using sqlite database at ${location}`,
            );
          }
          resolve();
        },
      );
    });
  });
}

function teardown(): Promise<void> {
  if (!db) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const database = db;
    if (!database) {
      resolve();
      return;
    }
    database.close((err: Error | null) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function create(task: NewTask): Promise<Task> {
  const id: TaskId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const toStore: Task = {
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

  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialised'));
      return;
    }
    db.run(
      `INSERT INTO tasks (id, title, projectId, createdBy, assignedTo, completed, status, priority, dueDate, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        toStore.id,
        toStore.title,
        toStore.projectId,
        toStore.createdBy,
        toStore.assignedTo,
        toStore.completed ? 1 : 0,
        toStore.status,
        toStore.priority,
        toStore.dueDate,
        toStore.createdAt,
      ],
      (err: Error | null) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(toStore);
      },
    );
  });
}

function findById(id: TaskId): Promise<Task | null> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialised'));
      return;
    }
    db.get(
      'SELECT * FROM tasks WHERE id = ?',
      [id],
      (err: Error | null, row: TaskRow | undefined) => {
        if (err) {
          reject(err);
          return;
        }
        if (!row) {
          resolve(null);
          return;
        }
        resolve(mapRow(row));
      },
    );
  });
}

function findAll(): Promise<Task[]> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialised'));
      return;
    }
    db.all(
      'SELECT * FROM tasks ORDER BY createdAt',
      [],
      (err: Error | null, rows: TaskRow[]) => {
        if (err) {
          reject(err);
          return;
        }
        resolve((rows ?? []).map(mapRow));
      },
    );
  });
}

function findByProjectId(projectId: string): Promise<Task[]> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialised'));
      return;
    }
    db.all(
      'SELECT * FROM tasks WHERE projectId = ? ORDER BY createdAt',
      [projectId],
      (err: Error | null, rows: TaskRow[]) => {
        if (err) {
          reject(err);
          return;
        }
        resolve((rows ?? []).map(mapRow));
      },
    );
  });
}

function findByAssignedTo(userId: string): Promise<Task[]> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialised'));
      return;
    }
    db.all(
      'SELECT * FROM tasks WHERE assignedTo = ? ORDER BY createdAt',
      [userId],
      (err: Error | null, rows: TaskRow[]) => {
        if (err) {
          reject(err);
          return;
        }
        resolve((rows ?? []).map(mapRow));
      },
    );
  });
}

function update(id: TaskId, upd: TaskUpdate): Promise<Task | null> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialised'));
      return;
    }
    findById(id).then((task) => {
      if (!task) {
        resolve(null);
        return;
      }
      const database = db;
      if (!database) {
        reject(new Error('Database not initialised'));
        return;
      }

      const updates: string[] = [];
      const values: unknown[] = [];

      if (upd.title !== undefined) {
        updates.push('title = ?');
        values.push(upd.title.trim());
      }
      if (upd.assignedTo !== undefined) {
        updates.push('assignedTo = ?');
        values.push(upd.assignedTo);
      }
      if (upd.completed !== undefined) {
        updates.push('completed = ?');
        values.push(upd.completed ? 1 : 0);
      }
      if (upd.status !== undefined) {
        updates.push('status = ?');
        values.push(upd.status);
      }
      if (upd.priority !== undefined) {
        updates.push('priority = ?');
        values.push(upd.priority);
      }
      if (upd.dueDate !== undefined) {
        updates.push('dueDate = ?');
        values.push(upd.dueDate);
      }

      if (updates.length === 0) {
        resolve(task);
        return;
      }

      values.push(id);
      database.run(
        `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
        values,
        (err: Error | null) => {
          if (err) {
            reject(err);
            return;
          }
          findById(id).then(resolve).catch(reject);
        },
      );
    }, reject);
  });
}

function remove(id: TaskId): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialised'));
      return;
    }
    db.run('DELETE FROM tasks WHERE id = ?', [id], function (err: Error | null) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this.changes > 0);
    });
  });
}

const sqliteRepository: TaskRepository = {
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

export default sqliteRepository;
