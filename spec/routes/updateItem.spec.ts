import type { Request, Response } from "express";
const updateItem = require("../../src/routes/updateItem");

interface Item {
  id: string;
  name: string;
  completed: boolean;
}

const createMockRepo = () => ({
  init: jest.fn(),
  teardown: jest.fn(),
  getItems: jest.fn(),
  getItem: jest.fn(),
  storeItem: jest.fn(),
  updateItem: jest.fn(),
  removeItem: jest.fn(),
});

const createRes = (): Response =>
  ({
    send: jest.fn(),
    status: jest.fn().mockReturnThis(),
  }) as unknown as Response;

describe("updateItem", () => {
  const mockRepo = createMockRepo();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("updates item with valid body and returns it", async () => {
    const id = "1234";
    const updatedItem: Item = { id, name: "New title", completed: false };
    const req = {
      params: { id },
      body: { name: "New title", completed: false },
    } as unknown as Request;
    const res = createRes();

    mockRepo.getItem.mockResolvedValue(updatedItem);

    const handler = updateItem(mockRepo);
    await handler(req, res);

    expect(mockRepo.getItem).toHaveBeenCalledWith(id);
    expect(mockRepo.updateItem).toHaveBeenCalledTimes(1);
    expect(mockRepo.updateItem).toHaveBeenCalledWith(id, {
      name: "New title",
      completed: false,
    });
    expect(mockRepo.getItem).toHaveBeenCalledTimes(2);
    expect(res.send).toHaveBeenCalledWith(updatedItem);
  });

  test("returns 400 when body has no name", async () => {
    const req = { params: { id: "1234" }, body: {} } as unknown as Request;
    const res = createRes();

    const handler = updateItem(mockRepo);
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: "Name is required" });
    expect(mockRepo.updateItem).not.toHaveBeenCalled();
  });

  test("returns 400 when name is empty string", async () => {
    const req = {
      params: { id: "1234" },
      body: { name: "" },
    } as unknown as Request;
    const res = createRes();

    const handler = updateItem(mockRepo);
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: "Name is required" });
    expect(mockRepo.updateItem).not.toHaveBeenCalled();
  });

  test("returns 400 when name is only whitespace", async () => {
    const req = {
      params: { id: "1234" },
      body: { name: "   " },
    } as unknown as Request;
    const res = createRes();

    const handler = updateItem(mockRepo);
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: "Name is required" });
    expect(mockRepo.updateItem).not.toHaveBeenCalled();
  });

  test("returns 404 when item does not exist", async () => {
    const req = {
      params: { id: "unknown" },
      body: { name: "New title", completed: false },
    } as unknown as Request;
    const res = createRes();

    mockRepo.getItem.mockResolvedValue(undefined);

    const handler = updateItem(mockRepo);
    await handler(req, res);

    expect(mockRepo.getItem).toHaveBeenCalledTimes(1);
    expect(mockRepo.getItem).toHaveBeenCalledWith("unknown");
    expect(mockRepo.updateItem).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ error: "Item not found" });
  });
});

export {};
