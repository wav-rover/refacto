import { Request, Response } from "express";
const db = require("../persistence");

module.exports = async (req: Request, res: Response) => {
  const name = req.body?.name;
  if (!name || String(name).trim() === "") {
    res.status(400).send({ error: "Name is required" });
    return;
  }

  const completed = req.body?.completed ?? false;

  const existing = await db.getItem(req.params.id);
  if (!existing) {
    res.status(404).send({ error: "Item not found" });
    return;
  }

  await db.updateItem(req.params.id, {
    name: String(name).trim(),
    completed,
  });
  const item = await db.getItem(req.params.id);
  res.send(item);
};

export {};
