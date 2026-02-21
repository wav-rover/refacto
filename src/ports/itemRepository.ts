export interface Item {
  id: string;
  name: string;
  completed: boolean;
}

export interface ItemRepository {
  init(): Promise<void>;
  teardown(): Promise<void>;
  getItems(): Promise<Item[]>;
  getItem(id: string): Promise<Item | undefined>;
  storeItem(item: Item): Promise<void>;
  updateItem(
    id: string,
    item: { name: string; completed: boolean }
  ): Promise<void>;
  removeItem(id: string): Promise<void>;
}
