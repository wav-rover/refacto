export interface Item {
  id: string;
  name: string;
  completed: boolean;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
}

export type ItemUpdate = Partial<
  Pick<Item, 'name' | 'completed' | 'status' | 'priority' | 'dueDate'>
>;

export interface ItemRepository {
  init(): Promise<void>;
  teardown(): Promise<void>;
  getItems(): Promise<Item[]>;
  getItem(id: string): Promise<Item | undefined>;
  storeItem(item: Item): Promise<void>;
  updateItem(id: string, item: ItemUpdate): Promise<void>;
  removeItem(id: string): Promise<void>;
}
