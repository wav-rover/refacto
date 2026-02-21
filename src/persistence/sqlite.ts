const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
import type { Item, ItemRepository } from "../ports/itemRepository";

const location = process.env.SQLITE_DB_LOCATION || "/etc/todos/todo.db";

interface ItemRow {
  id: string;
  name: string;
  completed: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;

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
          acc();
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
      acc(
        rows.map((item) =>
          Object.assign({}, item, {
            completed: item.completed === 1,
          })
        )
      );
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
        acc(
          rows.map((item) =>
            Object.assign({}, item, {
              completed: item.completed === 1,
            })
          )[0]
        );
      }
    );
  });
}

async function storeItem(item: Item): Promise<void> {
  return new Promise((acc, rej) => {
    db.run(
      "INSERT INTO todo_items (id, name, completed) VALUES (?, ?, ?)",
      [item.id, item.name, item.completed ? 1 : 0],
      (err) => {
        if (err) return rej(err);
        acc();
      }
    );
  });
}

async function updateItem(
  id: string,
  item: { name: string; completed: boolean }
): Promise<void> {
  return new Promise((acc, rej) => {
    db.run(
      "UPDATE todo_items SET name=?, completed=? WHERE id = ?",
      [item.name, item.completed ? 1 : 0, id],
      (err) => {
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
