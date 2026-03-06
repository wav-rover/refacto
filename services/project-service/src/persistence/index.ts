import type { ProjectRepository } from '../ports/projectRepository';
import inMemory from './inMemory';
import sqlite from './sqlite';

function createRepository(): ProjectRepository {
  if (process.env.NODE_ENV === 'test') return inMemory;
  return sqlite;
}

export { createRepository };
