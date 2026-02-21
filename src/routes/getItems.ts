import type { Request, Response } from "express";
import type { ItemRepository } from "../ports/itemRepository";

function getItems(repo: ItemRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    const items = await repo.getItems();
    res.send(items);
  };
}

export default getItems;
module.exports = getItems;
