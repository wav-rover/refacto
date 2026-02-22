const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
import type { Item, ItemRepository, ItemUpdate } from "../ports/itemRepository";

const location = process.env.SQLITE_DB_LOCATION || "/etc/todos/todo.db";

interface ItemRow {
  id: string;
  name: string;
  completed: number;
  status?: string;
  priority?: string;
  dueDate?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;

function mapRow(row: ItemRow): Item {
  return {
    id: row.id,
    name: row.name,
    completed: row.completed === 1,
    status: (row.status as Item["status"]) ?? "todo",
    priority: (row.priority as Item["priority"]) ?? "medium",
    dueDate: row.dueDate ?? null,
  };
}

function init(): Promise<void> {
  const dirName = require("path").dirname(location);
  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName, { recursive: true });
  }

  return new Promise((acc, rej) => {
    db = new sqlite3.Database(location, (err) => {
      if (err) return rej(err);

      if (process.env.NODE_ENV !== "test")
        console.log(`Using sqlite database at ${location}`);

      db.run(
        "CREATE TABLE IF NOT EXISTS todo_items (id varchar(36), name varchar(255), completed boolean)",
        (err) => {
          if (err) return rej(err);
          db.run(
            "ALTER TABLE todo_items ADD COLUMN status varchar(20) DEFAULT 'todo'",
            () => {}
          );
          db.run(
            "ALTER TABLE todo_items ADD COLUMN priority varchar(20) DEFAULT 'medium'",
            () => {}
          );
          db.run(
            "ALTER TABLE todo_items ADD COLUMN dueDate varchar(10)",
            () => {
              acc();
            }
          );
        }
      );
    });
  });
}

async function teardown(): Promise<void> {
  return new Promise((acc, rej) => {
    db.close((err) => {
      if (err) rej(err);
      else acc();
    });
  });
}

async function getItems(): Promise<Item[]> {
  return new Promise((acc, rej) => {
    db.all("SELECT * FROM todo_items", (err, rows: ItemRow[]) => {
      if (err) return rej(err);
      acc(rows.map(mapRow));
    });
  });
}

async function getItem(id: string): Promise<Item | undefined> {
  return new Promise((acc, rej) => {
    db.all(
      "SELECT * FROM todo_items WHERE id=?",
      [id],
      (err, rows: ItemRow[]) => {
        if (err) return rej(err);
        acc(rows.map(mapRow)[0]);
      }
    );
  });
}

async function storeItem(item: Item): Promise<void> {
  return new Promise((acc, rej) => {
    db.run(
      "INSERT INTO todo_items (id, name, completed, status, priority, dueDate) VALUES (?, ?, ?, ?, ?, ?)",
      [
        item.id,
        item.name,
        item.completed ? 1 : 0,
        item.status,
        item.priority,
        item.dueDate ?? null,
      ],
      (err) => {
        if (err) return rej(err);
        acc();
      }
    );
  });
}

async function updateItem(id: string, item: ItemUpdate): Promise<void> {
  return new Promise((acc, rej) => {
    const updates: string[] = [];
    const values: unknown[] = [];
    if (item.name !== undefined) {
      updates.push("name = ?");
      values.push(item.name);
    }
    if (item.completed !== undefined) {
      updates.push("completed = ?");
      values.push(item.completed ? 1 : 0);
    }
    if (item.status !== undefined) {
      updates.push("status = ?");
      values.push(item.status);
    }
    if (item.priority !== undefined) {
      updates.push("priority = ?");
      values.push(item.priority);
    }
    if (item.dueDate !== undefined) {
      updates.push("dueDate = ?");
      values.push(item.dueDate);
    }
    if (updates.length === 0) {
      acc();
      return;
    }
    values.push(id);
    db.run(
      `UPDATE todo_items SET ${updates.join(", ")} WHERE id = ?`,
      values,
      (err: Error | null) => {
        if (err) return rej(err);
        acc();
      }
    );
  });
}

async function removeItem(id: string): Promise<void> {
  return new Promise((acc, rej) => {
    db.run("DELETE FROM todo_items WHERE id = ?", [id], (err) => {
      if (err) return rej(err);
      acc();
    });
  });
}

const sqliteRepository: ItemRepository = {
  init,
  teardown,
  getItems,
  getItem,
  storeItem,
  updateItem,
  removeItem,
};

export default sqliteRepository;
module.exports = sqliteRepository;
