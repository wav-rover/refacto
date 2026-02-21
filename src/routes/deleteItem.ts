import type { Request, Response } from "express";
import type { ItemRepository } from "../ports/itemRepository";

function deleteItem(repo: ItemRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const existing = await repo.getItem(id);
    if (!existing) {
      res.status(404).send({ error: "Item not found" });
      return;
    }

    await repo.removeItem(id);
    res.sendStatus(200);
  };
}

export default deleteItem;
module.exports = deleteItem;
