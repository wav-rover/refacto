import inMemoryRepository from "../../src/persistence/inMemory";
import type { Item } from "../../src/ports/itemRepository";

const repo = inMemoryRepository;

const ITEM: Item = {
  id: "7aef3d7c-d301-4846-8358-2a91ec9d6be3",
  name: "Test",
  completed: false,
  status: "todo",
  priority: "medium",
  dueDate: null,
};

beforeEach(async () => {
  await repo.init();
});

afterEach(async () => {
  await repo.teardown();
});

describe("repository contract (InMemory)", () => {
  test("initializes successfully", async () => {
    await repo.init();
  });

  test("stores item and retrieves it in list", async () => {
    await repo.storeItem(ITEM);

    const items = await repo.getItems();
    expect(items.length).toBe(1);
    expect(items[0]).toEqual(ITEM);
  });

  test("updates existing item and persists changes", async () => {
    await repo.storeItem(ITEM);

    await repo.updateItem(ITEM.id, { ...ITEM, completed: !ITEM.completed });

    const items = await repo.getItems();
    expect(items.length).toBe(1);
    expect(items[0].completed).toBe(!ITEM.completed);
  });

  test("removes item and returns empty list", async () => {
    await repo.storeItem(ITEM);

    await repo.removeItem(ITEM.id);

    const items = await repo.getItems();
    expect(items.length).toBe(0);
  });

  test("returns single item by id", async () => {
    await repo.storeItem(ITEM);

    const item = await repo.getItem(ITEM.id);
    expect(item).toEqual(ITEM);
  });

  test("updates status and dueDate and persists", async () => {
    await repo.storeItem(ITEM);

    await repo.updateItem(ITEM.id, {
      status: "in_progress",
      dueDate: "2025-12-31",
    });

    const item = await repo.getItem(ITEM.id);
    expect(item?.status).toBe("in_progress");
    expect(item?.dueDate).toBe("2025-12-31");
  });
});
