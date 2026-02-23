import type { ItemRepository } from "../ports/itemRepository";
import inMemory from "./inMemory";
import mysql from "./mysql";
import sqlite from "./sqlite";

function createRepository(): ItemRepository {
  if (process.env.NODE_ENV === "test") return inMemory;
  if (process.env.MYSQL_HOST) return mysql;
  return sqlite;
}

const repository = createRepository();

export { createRepository };
export default repository;
