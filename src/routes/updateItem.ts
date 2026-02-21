import type { Request, Response } from "express";
import type { ItemRepository } from "../ports/itemRepository";

function updateItem(repo: ItemRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const name = req.body?.name;
    if (!name || String(name).trim() === "") {
      res.status(400).send({ error: "Name is required" });
      return;
    }

    const completed = req.body?.completed ?? false;

    const existing = await repo.getItem(id);
    if (!existing) {
      res.status(404).send({ error: "Item not found" });
      return;
    }

    await repo.updateItem(id, {
      name: String(name).trim(),
      completed,
    });
    const item = await repo.getItem(id);
    res.send(item);
  };
}

export default updateItem;
module.exports = updateItem;
