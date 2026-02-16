const db = require("../persistence");
const { v4: uuid } = require("uuid");

module.exports = async (req, res) => {
  const name = req.body?.name;
  if (!name || String(name).trim() === "") {
    res.status(400).send({ error: "Name is required" });
    return;
  }

  const item = {
    id: uuid(),
    name: name.trim(),
    completed: false,
  };

  await db.storeItem(item);
  res.send(item);
};
