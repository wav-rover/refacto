const db = require("../../src/persistence");
const addItem = require("../../src/routes/addItem");
const { v4: uuid } = require("uuid");

jest.mock("uuid", () => ({ v4: jest.fn() }));

jest.mock("../../src/persistence", () => ({
  removeItem: jest.fn(),
  storeItem: jest.fn(),
  getItem: jest.fn(),
}));

const createRes = () => ({
  send: jest.fn(),
  status: jest.fn().mockReturnThis(),
});

describe("addItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("stores item with valid name and returns it", async () => {
    const id = "something-not-a-uuid";
    const name = "A sample item";
    const req = { body: { name } };
    const res = createRes();

    uuid.mockReturnValue(id);

    await addItem(req, res);

    const expectedItem = { id, name, completed: false };

    expect(db.storeItem).toHaveBeenCalledTimes(1);
    expect(db.storeItem).toHaveBeenCalledWith(expectedItem);
    expect(res.send).toHaveBeenCalledWith(expectedItem);
  });

  test("returns 400 when body has no name", async () => {
    const req = { body: {} };
    const res = createRes();

    await addItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: "Name is required" });
    expect(db.storeItem).not.toHaveBeenCalled();
  });

  test("returns 400 when name is empty string", async () => {
    const req = { body: { name: "" } };
    const res = createRes();

    await addItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: "Name is required" });
    expect(db.storeItem).not.toHaveBeenCalled();
  });

  test("returns 400 when name is only whitespace", async () => {
    const req = { body: { name: "   " } };
    const res = createRes();

    await addItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: "Name is required" });
    expect(db.storeItem).not.toHaveBeenCalled();
  });
});
