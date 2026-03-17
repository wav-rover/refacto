import fs from 'fs';
import path from 'path';
import sqlite3Pkg from 'sqlite3';
import crypto from 'crypto';
import type {
  NewProject,
  Project,
  ProjectId,
  ProjectUpdate,
} from '../domain/project';
import type { ProjectRepository } from '../ports/projectRepository';

const sqlite3 = sqlite3Pkg.verbose();

const getDatabaseLocation = (): string =>
  process.env.PROJECT_SQLITE_DB_LOCATION ??
  path.join(
    path.resolve(__dirname, '..', '..', '..', '..'),
    'data',
    'project-service.db',
  );

type Database = sqlite3Pkg.Database;

interface ProjectRow {
  id: string;
  name: string;
  ownerId: string;
  status: string;
  createdAt: string;
}

let db: Database | null = null;

function loadMembers(projectId: ProjectId): Promise<string[]> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialised'));
      return;
    }
    db.all(
      'SELECT userId FROM project_members WHERE projectId = ? ORDER BY userId',
      [projectId],
      (err: Error | null, rows: { userId: string }[]) => {
        if (err) {
          reject(err);
          return;
        }
        resolve((rows ?? []).map((r) => r.userId));
      },
    );
  });
}

function mapRow(row: ProjectRow, memberIds: string[]): Project {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.ownerId,
    memberIds,
    status: row.status === 'closed' ? 'closed' : 'open',
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
        `CREATE TABLE IF NOT EXISTS projects (
          id varchar(36) PRIMARY KEY,
          name varchar(255) NOT NULL,
          ownerId varchar(36) NOT NULL,
          status varchar(20) NOT NULL DEFAULT 'open',
          createdAt varchar(30) NOT NULL
        )`,
        (createErr: Error | null) => {
          if (createErr) {
            reject(createErr);
            return;
          }
          database.run(
            `CREATE TABLE IF NOT EXISTS project_members (
              projectId varchar(36) NOT NULL,
              userId varchar(36) NOT NULL,
              PRIMARY KEY (projectId, userId),
              FOREIGN KEY (projectId) REFERENCES projects(id)
            )`,
            (membersErr: Error | null) => {
              if (membersErr) {
                reject(membersErr);
                return;
              }
              if (process.env.NODE_ENV !== 'test') {
                console.log(
                  `[project-service] Using sqlite database at ${location}`,
                );
              }
              resolve();
            },
          );
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

function create(project: NewProject): Promise<Project> {
  const id: ProjectId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const toStore: Project = {
    id,
    name: project.name.trim(),
    ownerId: project.ownerId,
    memberIds: [project.ownerId],
    status: 'open',
    createdAt,
  };

  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialised'));
      return;
    }
    db.run(
      'INSERT INTO projects (id, name, ownerId, status, createdAt) VALUES (?, ?, ?, ?, ?)',
      [
        toStore.id,
        toStore.name,
        toStore.ownerId,
        toStore.status,
        toStore.createdAt,
      ],
      (err: Error | null) => {
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
          'INSERT INTO project_members (projectId, userId) VALUES (?, ?)',
          [toStore.id, toStore.ownerId],
          (memberErr: Error | null) => {
            if (memberErr) {
              reject(memberErr);
              return;
            }
            resolve(toStore);
          },
        );
      },
    );
  });
}

function findById(id: ProjectId): Promise<Project | null> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialised'));
      return;
    }
    db.get(
      'SELECT id, name, ownerId, status, createdAt FROM projects WHERE id = ?',
      [id],
      async (err: Error | null, row: ProjectRow | undefined) => {
        if (err) {
          reject(err);
          return;
        }
        if (!row) {
          resolve(null);
          return;
        }
        try {
          const memberIds = await loadMembers(row.id);
          resolve(mapRow(row, memberIds));
        } catch (e) {
          reject(e);
        }
      },
    );
  });
}

function findAll(): Promise<Project[]> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialised'));
      return;
    }
    db.all(
      'SELECT id, name, ownerId, status, createdAt FROM projects ORDER BY createdAt',
      [],
      async (err: Error | null, rows: ProjectRow[]) => {
        if (err) {
          reject(err);
          return;
        }
        const result: Project[] = [];
        for (const row of rows ?? []) {
          const memberIds = await loadMembers(row.id);
          result.push(mapRow(row, memberIds));
        }
        resolve(result);
      },
    );
  });
}

function findByUser(userId: string): Promise<Project[]> {
  const trimmedUserId = userId.trim();
  if (trimmedUserId === '') {
    return Promise.resolve([]);
  }
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialised'));
      return;
    }
    db.all(
      `SELECT p.id, p.name, p.ownerId, p.status, p.createdAt
       FROM projects p
       JOIN project_members m ON m.projectId = p.id
       WHERE m.userId = ?
       ORDER BY p.createdAt`,
      [trimmedUserId],
      async (err: Error | null, rows: ProjectRow[]) => {
        if (err) {
          reject(err);
          return;
        }
        const result: Project[] = [];
        for (const row of rows ?? []) {
          const memberIds = await loadMembers(row.id);
          result.push(mapRow(row, memberIds));
        }
        resolve(result);
      },
    );
  });
}

function update(id: ProjectId, update: ProjectUpdate): Promise<Project | null> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialised'));
      return;
    }
    findById(id).then((project) => {
      if (!project) {
        resolve(null);
        return;
      }
      const database = db;
      if (!database) {
        reject(new Error('Database not initialised'));
        return;
      }
      const name = update.name !== undefined ? update.name.trim() : project.name;
      const status = update.status ?? project.status;
      database.run(
        'UPDATE projects SET name = ?, status = ? WHERE id = ?',
        [name, status, id],
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

function addMember(
  projectId: ProjectId,
  userId: string,
): Promise<Project | null> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialised'));
      return;
    }
    db.run(
      'INSERT OR IGNORE INTO project_members (projectId, userId) VALUES (?, ?)',
      [projectId, userId],
      (err: Error | null) => {
        if (err) {
          reject(err);
          return;
        }
        findById(projectId).then(resolve).catch(reject);
      },
    );
  });
}

function removeMember(
  projectId: ProjectId,
  userId: string,
): Promise<Project | null> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialised'));
      return;
    }
    db.run(
      'DELETE FROM project_members WHERE projectId = ? AND userId = ?',
      [projectId, userId],
      (err: Error | null) => {
        if (err) {
          reject(err);
          return;
        }
        findById(projectId).then(resolve).catch(reject);
      },
    );
  });
}

const sqliteRepository: ProjectRepository = {
  init,
  teardown,
  create,
  findById,
  findAll,
  findByUser,
  update,
  addMember,
  removeMember,
};

export default sqliteRepository;
