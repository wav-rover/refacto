import type { ItemRepository } from "../ports/itemRepository";

function createRepository(): ItemRepository {
  if (process.env.NODE_ENV === "test") {
    return require("./inMemory").default;
  }
  if (process.env.MYSQL_HOST) {
    return require("./mysql");
  }
  return require("./sqlite");
}

const repository = createRepository();

export { createRepository };
export default repository;
module.exports = repository;
module.exports.createRepository = createRepository;
