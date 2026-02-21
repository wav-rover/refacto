import type { Item, ItemRepository } from "../ports/itemRepository";

const store = new Map<string, Item>();

async function init(): Promise<void> {
  store.clear();
}

async function teardown(): Promise<void> {
  store.clear();
}

async function getItems(): Promise<Item[]> {
  return Array.from(store.values());
}

async function getItem(id: string): Promise<Item | undefined> {
  return store.get(id);
}

async function storeItem(item: Item): Promise<void> {
  store.set(item.id, item);
}

async function updateItem(
  id: string,
  item: { name: string; completed: boolean }
): Promise<void> {
  const existing = store.get(id);
  if (!existing) return;
  store.set(id, { ...existing, ...item });
}

async function removeItem(id: string): Promise<void> {
  store.delete(id);
}

const inMemoryRepository: ItemRepository = {
  init,
  teardown,
  getItems,
  getItem,
  storeItem,
  updateItem,
  removeItem,
};

export default inMemoryRepository;
