const db = require("../../src/persistence");
const updateItem = require("../../src/routes/updateItem");

jest.mock("../../src/persistence", () => ({
  getItem: jest.fn(),
  updateItem: jest.fn(),
}));

const createRes = () => ({
  send: jest.fn(),
  status: jest.fn().mockReturnThis(),
});

describe("updateItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("updates item with valid body and returns it", async () => {
    const id = "1234";
    const updatedItem = { id, name: "New title", completed: false };
    const req = {
      params: { id },
      body: { name: "New title", completed: false },
    };
    const res = createRes();

    db.getItem.mockResolvedValue(updatedItem);

    await updateItem(req, res);

    expect(db.getItem).toHaveBeenCalledWith(id);
    expect(db.updateItem).toHaveBeenCalledTimes(1);
    expect(db.updateItem).toHaveBeenCalledWith(id, {
      name: "New title",
      completed: false,
    });
    expect(db.getItem).toHaveBeenCalledTimes(2);
    expect(res.send).toHaveBeenCalledWith(updatedItem);
  });

  test("returns 400 when body has no name", async () => {
    const req = { params: { id: "1234" }, body: {} };
    const res = createRes();

    await updateItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: "Name is required" });
    expect(db.updateItem).not.toHaveBeenCalled();
  });

  test("returns 400 when name is empty string", async () => {
    const req = {
      params: { id: "1234" },
      body: { name: "" },
    };
    const res = createRes();

    await updateItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: "Name is required" });
    expect(db.updateItem).not.toHaveBeenCalled();
  });

  test("returns 400 when name is only whitespace", async () => {
    const req = {
      params: { id: "1234" },
      body: { name: "   " },
    };
    const res = createRes();

    await updateItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: "Name is required" });
    expect(db.updateItem).not.toHaveBeenCalled();
  });

  test("returns 404 when item does not exist", async () => {
    const req = {
      params: { id: "unknown" },
      body: { name: "New title", completed: false },
    };
    const res = createRes();

    db.getItem.mockResolvedValue(undefined);

    await updateItem(req, res);

    expect(db.getItem).toHaveBeenCalledTimes(1);
    expect(db.getItem).toHaveBeenCalledWith("unknown");
    expect(db.updateItem).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ error: "Item not found" });
  });
});
