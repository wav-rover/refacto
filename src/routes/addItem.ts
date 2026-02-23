import type { Request, Response } from "express";
import type { Item, ItemRepository } from "../ports/itemRepository";
import { Priority, Status } from "../ports/itemRepository";
import { v4 as uuid } from "uuid";

function addItem(repo: ItemRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    const name = req.body?.name;
    if (!name || String(name).trim() === "") {
      res.status(400).send({ error: "Name is required" });
      return;
    }

    const status = (req.body?.status ?? Status.Todo) as Status;
    const priority = (req.body?.priority ?? Priority.Medium) as Priority;
    const dueDate = req.body?.dueDate ? String(req.body.dueDate) : null;

    const item: Item = {
      id: uuid(),
      name: String(name).trim(),
      completed: false,
      status,
      priority,
      dueDate,
    };

    await repo.storeItem(item);
    res.send(item);
  };
}

export default addItem;
module.exports = addItem;
