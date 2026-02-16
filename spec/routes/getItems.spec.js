const db = require("../../src/persistence");
const getItems = require("../../src/routes/getItems");
const ITEMS = [{ id: 12345 }];

jest.mock("../../src/persistence", () => ({
  getItems: jest.fn(),
}));

const createRes = () => ({
  send: jest.fn(),
  status: jest.fn().mockReturnThis(),
});

describe("getItems", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test("it gets items correctly", async () => {
    const ITEMS = [{ id: "12345", name: "item", completed: false }];
    const req = {};
    const res = createRes();
    db.getItems.mockResolvedValue(ITEMS);

    await getItems(req, res);

    expect(db.getItems).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith(ITEMS);
  });

  test("returns empty array when no items", async () => {
    const req = {};
    const res = createRes();
    db.getItems.mockResolvedValue([]);

    await getItems(req, res);

    expect(db.getItems).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith([]);
  });
});