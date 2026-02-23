import type { ItemRepository } from "../ports/itemRepository";
import inMemory from "./inMemory";
import mysqlRepo from "./mysql";
import sqliteRepo from "./sqlite";

function createRepository(): ItemRepository {
  if (process.env.NODE_ENV === "test") return inMemory;
  if (process.env.MYSQL_HOST) return mysqlRepo;
  return sqliteRepo;
}

const repository = createRepository();

export { createRepository };
export default repository;
