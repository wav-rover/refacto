import type { Request, Response } from "express";
import getItems from "../../src/routes/getItems";
import type { Item, ItemRepository } from "../../src/ports/itemRepository";
import { Priority, Status } from "../../src/ports/itemRepository";

const createMockRepo = (): jest.Mocked<ItemRepository> => ({
  init: jest.fn().mockResolvedValue(undefined),
  teardown: jest.fn().mockResolvedValue(undefined),
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

describe("getItems", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("it gets items correctly", async () => {
    const ITEMS: Item[] = [
      {
        id: "12345",
        name: "item",
        completed: false,
        status: Status.Todo,
        priority: Priority.Medium,
        dueDate: null,
      },
    ];
    const req = {} as Request;
    const res = createRes();
    const mockRepo = createMockRepo();
    mockRepo.getItems.mockResolvedValue(ITEMS);

    const handler = getItems(mockRepo);
    await handler(req, res);

    expect(mockRepo.getItems).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith(ITEMS);
  });

  test("returns empty array when no items", async () => {
    const req = {} as Request;
    const res = createRes();
    const mockRepo = createMockRepo();
    mockRepo.getItems.mockResolvedValue([]);

    const handler = getItems(mockRepo);
    await handler(req, res);

    expect(mockRepo.getItems).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith([]);
  });

  test("does not send response when getItems rejects", async () => {
    const req = {} as Request;
    const res = createRes();
    const mockRepo = createMockRepo();
    mockRepo.getItems.mockRejectedValue(new Error("DB error"));

    const handler = getItems(mockRepo);
    await expect(handler(req, res)).rejects.toThrow("DB error");
    expect(res.send).not.toHaveBeenCalled();
  });
});
