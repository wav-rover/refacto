const waitPort = require("wait-port");
const fs = require("fs");
const mysql = require("mysql2");

const {
  MYSQL_HOST: HOST,
  MYSQL_HOST_FILE: HOST_FILE,
  MYSQL_USER: USER,
  MYSQL_USER_FILE: USER_FILE,
  MYSQL_PASSWORD: PASSWORD,
  MYSQL_PASSWORD_FILE: PASSWORD_FILE,
  MYSQL_DB: DB,
  MYSQL_DB_FILE: DB_FILE,
} = process.env;

interface Item {
  id: string;
  name: string;
  completed: boolean;
}

interface ItemRow {
  id: string;
  name: string;
  completed: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pool: any;

async function init(): Promise<void> {
  const host = HOST_FILE ? fs.readFileSync(HOST_FILE, "utf8").trim() : HOST;
  const user = USER_FILE ? fs.readFileSync(USER_FILE, "utf8").trim() : USER;
  const password = PASSWORD_FILE ? fs.readFileSync(PASSWORD_FILE, "utf8").trim() : PASSWORD;
  const database = DB_FILE ? fs.readFileSync(DB_FILE, "utf8").trim() : DB;

  await waitPort({
    host,
    port: 3306,
    timeout: 10000,
    waitForDns: true,
  });

  pool = mysql.createPool({
    connectionLimit: 5,
    host,
    user,
    password,
    database,
    charset: "utf8mb4",
  });

  return new Promise((acc, rej) => {
    pool.query(
      "CREATE TABLE IF NOT EXISTS todo_items (id varchar(36), name varchar(255), completed boolean) DEFAULT CHARSET utf8mb4",
      (err: Error | null) => {
        if (err) return rej(err);

        console.log(`Connected to mysql db at host ${HOST}`);
        acc();
      },
    );
  });
}

async function teardown(): Promise<void> {
  return new Promise((acc, rej) => {
    pool.end((err: Error | null) => {
      if (err) rej(err);
      else acc();
    });
  });
}

async function getItems(): Promise<Item[]> {
  return new Promise((acc, rej) => {
    pool.query("SELECT * FROM todo_items", (err: Error | null, rows: ItemRow[]) => {
      if (err) return rej(err);
      acc(
        rows.map((item) =>
          Object.assign({}, item, {
            completed: item.completed === 1,
          }),
        ),
      );
    });
  });
}

async function getItem(id: string): Promise<Item | undefined> {
  return new Promise((acc, rej) => {
    pool.query("SELECT * FROM todo_items WHERE id=?", [id], (err: Error | null, rows: ItemRow[]) => {
      if (err) return rej(err);
      acc(
        rows.map((item) =>
          Object.assign({}, item, {
            completed: item.completed === 1,
          }),
        )[0],
      );
    });
  });
}

async function storeItem(item: Item): Promise<void> {
  return new Promise((acc, rej) => {
    pool.query(
      "INSERT INTO todo_items (id, name, completed) VALUES (?, ?, ?)",
      [item.id, item.name, item.completed ? 1 : 0],
      (err: Error | null) => {
        if (err) return rej(err);
        acc();
      },
    );
  });
}

async function updateItem(id: string, item: { name: string; completed: boolean }): Promise<void> {
  return new Promise((acc, rej) => {
    pool.query(
      "UPDATE todo_items SET name=?, completed=? WHERE id=?",
      [item.name, item.completed ? 1 : 0, id],
      (err: Error | null) => {
        if (err) return rej(err);
        acc();
      },
    );
  });
}

async function removeItem(id: string): Promise<void> {
  return new Promise((acc, rej) => {
    pool.query("DELETE FROM todo_items WHERE id = ?", [id], (err: Error | null) => {
      if (err) return rej(err);
      acc();
    });
  });
}

module.exports = {
  init,
  teardown,
  getItems,
  getItem,
  storeItem,
  updateItem,
  removeItem,
};

export {};
