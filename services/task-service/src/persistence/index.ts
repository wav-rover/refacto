import type { TaskRepository } from '../ports/taskRepository';
import inMemory from './inMemory';
import sqlite from './sqlite';

function createRepository(): TaskRepository {
  if (process.env.NODE_ENV === 'test') return inMemory;
  return sqlite;
}

export { createRepository };
