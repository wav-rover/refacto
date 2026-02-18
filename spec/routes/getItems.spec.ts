import { Request, Response } from "express";
const db = require("../../src/persistence");
const getItems = require("../../src/routes/getItems");

interface Item {
  id: string;
  name: string;
  completed: boolean;
}

jest.mock("../../src/persistence", () => ({
  getItems: jest.fn(),
}));

const createRes = (): Response => ({
  send: jest.fn(),
  status: jest.fn().mockReturnThis(),
} as unknown as Response);

describe("getItems", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("it gets items correctly", async () => {
    const ITEMS: Item[] = [{ id: "12345", name: "item", completed: false }];
    const req = {} as Request;
    const res = createRes();
    db.getItems.mockResolvedValue(ITEMS);

    await getItems(req, res);

    expect(db.getItems).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith(ITEMS);
  });

  test("returns empty array when no items", async () => {
    const req = {} as Request;
    const res = createRes();
    db.getItems.mockResolvedValue([]);

    await getItems(req, res);

    expect(db.getItems).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith([]);
  });

  test("does not send response when getItems rejects", async () => {
    const req = {} as Request;
    const res = createRes();
    db.getItems.mockRejectedValue(new Error("DB error"));

    await expect(getItems(req, res)).rejects.toThrow("DB error");
    expect(res.send).not.toHaveBeenCalled();
  });
});

export {};
