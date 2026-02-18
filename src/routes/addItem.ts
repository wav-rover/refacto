import { Request, Response } from "express";
const db = require("../persistence");
const { v4: uuid } = require("uuid");

interface Item {
  id: string;
  name: string;
  completed: boolean;
}

module.exports = async (req: Request, res: Response) => {
  const name = req.body?.name;
  if (!name || String(name).trim() === "") {
    res.status(400).send({ error: "Name is required" });
    return;
  }

  const item: Item = {
    id: uuid(),
    name: String(name).trim(),
    completed: false,
  };

  await db.storeItem(item);
  res.send(item);
};

export {};
