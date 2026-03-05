import type { UserRepository } from "../ports/userRepository";
import inMemory from "./inMemory";
import sqlite from "./sqlite";

function createRepository(): UserRepository {
  if (process.env.NODE_ENV === "test") return inMemory;
  return sqlite;
}

const repository = createRepository();

export { createRepository };
export default repository;
