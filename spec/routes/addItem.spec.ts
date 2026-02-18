import { Request, Response } from "express";
const db = require("../../src/persistence");
const addItem = require("../../src/routes/addItem");
const { v4: uuid } = require("uuid");

jest.mock("uuid", () => ({ v4: jest.fn() }));

jest.mock("../../src/persistence", () => ({
  removeItem: jest.fn(),
  storeItem: jest.fn(),
  getItem: jest.fn(),
}));

interface Item {
  id: string;
  name: string;
  completed: boolean;
}

const createRes = (): Response =>
  ({
    send: jest.fn(),
    status: jest.fn().mockReturnThis(),
  }) as unknown as Response;

describe("addItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("stores item with valid name and returns it", async () => {
    const id = "1234";
    const name = "A sample item";
    const req = { body: { name } } as Request;
    const res = createRes();

    (uuid as jest.Mock).mockReturnValue(id);

    await addItem(req, res);

    const expectedItem: Item = { id, name, completed: false };

    expect(db.storeItem).toHaveBeenCalledTimes(1);
    expect(db.storeItem).toHaveBeenCalledWith(expectedItem);
    expect(res.send).toHaveBeenCalledWith(expectedItem);
  });

  test("returns 400 when body has no name", async () => {
    const req = { body: {} } as Request;
    const res = createRes();

    await addItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: "Name is required" });
    expect(db.storeItem).not.toHaveBeenCalled();
  });

  test("returns 400 when name is empty string", async () => {
    const req = { body: { name: "" } } as Request;
    const res = createRes();

    await addItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: "Name is required" });
    expect(db.storeItem).not.toHaveBeenCalled();
  });

  test("returns 400 when name is only whitespace", async () => {
    const req = { body: { name: "   " } } as Request;
    const res = createRes();

    await addItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: "Name is required" });
    expect(db.storeItem).not.toHaveBeenCalled();
  });
});

export {};
