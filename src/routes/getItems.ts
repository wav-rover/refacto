import { Request, Response } from "express";
const db = require("../persistence");

module.exports = async (req: Request, res: Response) => {
  const items = await db.getItems();
  res.send(items);
};

export {};
