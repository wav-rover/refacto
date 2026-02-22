import type { Request, Response } from "express";
import type { Item } from "../../src/ports/itemRepository";
import { Priority, Status } from "../../src/ports/itemRepository";
const updateItem = require("../../src/routes/updateItem");

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
    const updated: Item = {
      id,
      name: "New title",
      completed: false,
      status: Status.Todo,
      priority: Priority.Medium,
      dueDate: null,
    };
    const req = {
      params: { id },
      body: { name: "New title", completed: false },
      session: { user: "test-user" },
    } as unknown as Request;
    const res = createRes();

    mockRepo.getItem.mockResolvedValue(updated);

    const handler = updateItem(mockRepo);
    await handler(req, res);

    expect(mockRepo.getItem).toHaveBeenCalledWith(id);
    expect(mockRepo.updateItem).toHaveBeenCalledTimes(1);
    expect(mockRepo.updateItem).toHaveBeenCalledWith(id, {
      name: "New title",
      completed: false,
    });
    expect(mockRepo.getItem).toHaveBeenCalledTimes(2);
    expect(res.send).toHaveBeenCalledWith(updated);
  });

  test("when body is empty, calls updateItem with {} and returns current item", async () => {
    const id = "1234";
    const existing: Item = {
      id,
      name: "Item",
      completed: false,
      status: Status.Todo,
      priority: Priority.Medium,
      dueDate: null,
    };
    const req = {
      params: { id },
      body: {},
      session: { user: "test-user" },
    } as unknown as Request;
    const res = createRes();

    mockRepo.getItem.mockResolvedValue(existing);

    const handler = updateItem(mockRepo);
    await handler(req, res);

    expect(mockRepo.updateItem).toHaveBeenCalledWith(id, {});
    expect(res.send).toHaveBeenCalledWith(existing);
  });

  test("returns 400 when name is empty string", async () => {
    const id = "1234";
    const existing: Item = {
      id,
      name: "Item",
      completed: false,
      status: Status.Todo,
      priority: Priority.Medium,
      dueDate: null,
    };
    const req = {
      params: { id },
      body: { name: "" },
      session: { user: "test-user" },
    } as unknown as Request;
    const res = createRes();

    mockRepo.getItem.mockResolvedValue(existing);

    const handler = updateItem(mockRepo);
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: "Name is required" });
    expect(mockRepo.updateItem).not.toHaveBeenCalled();
  });

  test("returns 400 when name is only whitespace", async () => {
    const id = "1234";
    const existing: Item = {
      id,
      name: "Item",
      completed: false,
      status: Status.Todo,
      priority: Priority.Medium,
      dueDate: null,
    };
    const req = {
      params: { id },
      body: { name: "   " },
      session: { user: "test-user" },
    } as unknown as Request;
    const res = createRes();

    mockRepo.getItem.mockResolvedValue(existing);

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
      session: { user: "test-user" },
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

  test("updates status and returns updated item", async () => {
    const id = "1234";
    const updated: Item = {
      id,
      name: "Item",
      completed: false,
      status: Status.Done,
      priority: Priority.Medium,
      dueDate: null,
    };
    const req = {
      params: { id },
      body: { status: Status.Done },
      session: { user: "test-user" },
    } as unknown as Request;
    const res = createRes();

    mockRepo.getItem.mockResolvedValue(updated);

    const handler = updateItem(mockRepo);
    await handler(req, res);

    expect(mockRepo.updateItem).toHaveBeenCalledWith(id, {
      status: Status.Done,
    });
    expect(res.send).toHaveBeenCalledWith(updated);
  });

  test("updates priority and returns updated item", async () => {
    const updated: Item = {
      id: "1234",
      name: "Item",
      completed: false,
      status: Status.Todo,
      priority: Priority.High,
      dueDate: null,
    };
    const req = {
      params: { id: "1234" },
      body: { priority: Priority.High },
      session: { user: "test-user" },
    } as unknown as Request;
    const res = createRes();

    mockRepo.getItem.mockResolvedValue(updated);

    const handler = updateItem(mockRepo);
    await handler(req, res);

    expect(mockRepo.updateItem).toHaveBeenCalledWith("1234", {
      priority: Priority.High,
    });
    expect(res.send).toHaveBeenCalledWith(updated);
  });

  test("updates dueDate and returns updated item", async () => {
    const updated: Item = {
      id: "1234",
      name: "Item",
      completed: false,
      status: Status.Todo,
      priority: Priority.Medium,
      dueDate: "2025-12-31",
    };
    const req = {
      params: { id: "1234" },
      body: { dueDate: "2025-12-31" },
      session: { user: "test-user" },
    } as unknown as Request;
    const res = createRes();

    mockRepo.getItem.mockResolvedValue(updated);

    const handler = updateItem(mockRepo);
    await handler(req, res);

    expect(mockRepo.updateItem).toHaveBeenCalledWith("1234", {
      dueDate: "2025-12-31",
    });
    expect(res.send).toHaveBeenCalledWith({
      id: "1234",
      name: "Item",
      completed: false,
      status: Status.Todo,
      priority: Priority.Medium,
      dueDate: "2025-12-31",
    });
  });
});

export {};
