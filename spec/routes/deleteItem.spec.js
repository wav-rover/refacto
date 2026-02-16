const db = require("../../src/persistence");
const deleteItem = require("../../src/routes/deleteItem");

jest.mock("../../src/persistence", () => ({
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

const createRes = () => ({
  sendStatus: jest.fn(),
  status: jest.fn().mockReturnThis(),
  send: jest.fn(),
});

describe("deleteItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("removes item when it exists and returns 200", async () => {
    const id = "1234";
    const item = { id, name: "An item", completed: false };
    const req = { params: { id } };
    const res = createRes();

    db.getItem.mockResolvedValue(item);

    await deleteItem(req, res);

    expect(db.getItem).toHaveBeenCalledTimes(1);
    expect(db.getItem).toHaveBeenCalledWith(id);
    expect(db.removeItem).toHaveBeenCalledTimes(1);
    expect(db.removeItem).toHaveBeenCalledWith(id);
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });

  test("returns 404 when item does not exist", async () => {
    const req = { params: { id: "unknown" } };
    const res = createRes();

    db.getItem.mockResolvedValue(undefined);

    await deleteItem(req, res);

    expect(db.getItem).toHaveBeenCalledTimes(1);
    expect(db.getItem).toHaveBeenCalledWith("unknown");
    expect(db.removeItem).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ error: "Item not found" });
  });
});
