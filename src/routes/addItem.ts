import type { Request, Response } from "express";
import type { Item, ItemRepository } from "../ports/itemRepository";
const { v4: uuid } = require("uuid");

function addItem(repo: ItemRepository) {
  return async (req: Request, res: Response): Promise<void> => {
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

    await repo.storeItem(item);
    res.send(item);
  };
}

export default addItem;
module.exports = addItem;
