import type { Request, Response } from "express";
import type { ItemRepository, ItemUpdate } from "../ports/itemRepository";
import { Priority, Status } from "../ports/itemRepository";

function updateItem(repo: ItemRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const body = req.body ?? {};

    const existing = await repo.getItem(id);
    if (!existing) {
      res.status(404).send({ error: "Item not found" });
      return;
    }

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (name === "") {
        res.status(400).send({ error: "Name is required" });
        return;
      }
    }

    const update: ItemUpdate = {};

    if (body.name !== undefined) {
      update.name = String(body.name).trim();
    }
    if (body.completed !== undefined) {
      update.completed = Boolean(body.completed);
    }
    if (body.status !== undefined) {
      update.status = (body.status ?? Status.Todo) as Status;
    }
    if (body.priority !== undefined) {
      update.priority = (body.priority ?? Priority.Medium) as Priority;
    }
    if (body.dueDate !== undefined) {
      update.dueDate = body.dueDate ? String(body.dueDate) : null;
    }

    await repo.updateItem(id, update);
    const item = await repo.getItem(id);
    res.send(item);
  };
}

export default updateItem;
module.exports = updateItem;
