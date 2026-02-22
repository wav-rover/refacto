import type { Request, Response } from "express";
import type { Item } from "../../src/ports/itemRepository";
import { Priority, Status } from "../../src/ports/itemRepository";
const addItem = require("../../src/routes/addItem");
const { v4: uuid } = require("uuid");

jest.mock("uuid", () => ({ v4: jest.fn() }));

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

describe("addItem", () => {
  const mockRepo = createMockRepo();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("stores item with valid name and returns it", async () => {
    const id = "1234";
    const name = "A sample item";
    const req = { body: { name } } as Request;
    const res = createRes();

    (uuid as jest.Mock).mockReturnValue(id);

    const handler = addItem(mockRepo);
    await handler(req, res);

    const expectedItem: Item = {
      id,
      name,
      completed: false,
      status: Status.Todo,
      priority: Priority.Medium,
      dueDate: null,
    };

    expect(mockRepo.storeItem).toHaveBeenCalledTimes(1);
    expect(mockRepo.storeItem).toHaveBeenCalledWith(expectedItem);
    expect(res.send).toHaveBeenCalledWith(expectedItem);
  });

  test("returns 400 when body has no name", async () => {
    const req = { body: {} } as Request;
    const res = createRes();

    const handler = addItem(mockRepo);
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: "Name is required" });
    expect(mockRepo.storeItem).not.toHaveBeenCalled();
  });

  test("returns 400 when name is empty string", async () => {
    const req = { body: { name: "" } } as Request;
    const res = createRes();

    const handler = addItem(mockRepo);
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: "Name is required" });
    expect(mockRepo.storeItem).not.toHaveBeenCalled();
  });

  test("returns 400 when name is only whitespace", async () => {
    const req = { body: { name: "   " } } as Request;
    const res = createRes();

    const handler = addItem(mockRepo);
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: "Name is required" });
    expect(mockRepo.storeItem).not.toHaveBeenCalled();
  });

  test("stores item with status, priority and dueDate and returns it", async () => {
    const id = "1234";
    const name = "A sample item";
    const dueDate = "2025-12-31";
    const req = {
      body: {
        name,
        status: Status.InProgress,
        priority: Priority.High,
        dueDate,
      },
    } as Request;
    const res = createRes();

    (uuid as jest.Mock).mockReturnValue(id);

    const handler = addItem(mockRepo);
    await handler(req, res);

    const expectedItem: Item = {
      id,
      name,
      completed: false,
      status: Status.InProgress,
      priority: Priority.High,
      dueDate,
    };

    expect(mockRepo.storeItem).toHaveBeenCalledTimes(1);
    expect(mockRepo.storeItem).toHaveBeenCalledWith(expectedItem);
    expect(res.send).toHaveBeenCalledWith(expectedItem);
  });
});

export {};
