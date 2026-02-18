const db = require("../../src/persistence/sqlite");
const fs = require("fs");
const location = process.env.SQLITE_DB_LOCATION || "/etc/todos/todo.db";

interface Item {
  id: string;
  name: string;
  completed: boolean;
}

const ITEM: Item = {
  id: "7aef3d7c-d301-4846-8358-2a91ec9d6be3",
  name: "Test",
  completed: false,
};

beforeEach(() => {
  if (fs.existsSync(location)) {
    fs.unlinkSync(location);
  }
});

afterEach(async () => {
  if (db && typeof db.teardown === "function") {
    await db.teardown();
  }
});

describe("sqlite persistence", () => {
  beforeEach(async () => {
    await db.init();
  });

  test("initializes database successfully", async () => {});

  test("stores item and retrieves it in list", async () => {
    await db.storeItem(ITEM);

    const items = await db.getItems();
    expect(items.length).toBe(1);
    expect(items[0]).toEqual(ITEM);
  });

  test("updates existing item and persists changes", async () => {
    await db.storeItem(ITEM);

    await db.updateItem(ITEM.id, { ...ITEM, completed: !ITEM.completed });

    const items = await db.getItems();
    expect(items.length).toBe(1);
    expect(items[0].completed).toBe(!ITEM.completed);
  });

  test("removes item and returns empty list", async () => {
    await db.storeItem(ITEM);

    await db.removeItem(ITEM.id);

    const items = await db.getItems();
    expect(items.length).toBe(0);
  });

  test("returns single item by id", async () => {
    await db.storeItem(ITEM);

    const item = await db.getItem(ITEM.id);
    expect(item).toEqual(ITEM);
  });
});

export {};
