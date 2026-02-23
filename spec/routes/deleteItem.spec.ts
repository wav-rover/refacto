import type { Request, Response } from "express";
import deleteItem from "../../src/routes/deleteItem";

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
    sendStatus: jest.fn(),
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
  }) as unknown as Response;

describe("deleteItem", () => {
  const mockRepo = createMockRepo();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("removes item when it exists and returns 200", async () => {
    const id = "1234";
    const item: Item = { id, name: "An item", completed: false };
    const req = {
      params: { id },
      session: { user: "test-user" },
    } as unknown as Request;
    const res = createRes();

    mockRepo.getItem.mockResolvedValue(item);

    const handler = deleteItem(mockRepo);
    await handler(req, res);

    expect(mockRepo.getItem).toHaveBeenCalledTimes(1);
    expect(mockRepo.getItem).toHaveBeenCalledWith(id);
    expect(mockRepo.removeItem).toHaveBeenCalledTimes(1);
    expect(mockRepo.removeItem).toHaveBeenCalledWith(id);
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });

  test("returns 404 when item does not exist", async () => {
    const req = {
      params: { id: "unknown" },
      session: { user: "test-user" },
    } as unknown as Request;
    const res = createRes();

    mockRepo.getItem.mockResolvedValue(undefined);

    const handler = deleteItem(mockRepo);
    await handler(req, res);

    expect(mockRepo.getItem).toHaveBeenCalledTimes(1);
    expect(mockRepo.getItem).toHaveBeenCalledWith("unknown");
    expect(mockRepo.removeItem).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ error: "Item not found" });
  });
});

export {};
