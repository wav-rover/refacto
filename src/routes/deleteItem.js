const db = require("../persistence");

module.exports = async (req, res) => {
  const existing = await db.getItem(req.params.id);
  if (!existing) {
    res.status(404).send({ error: "Item not found" });
    return;
  }

  await db.removeItem(req.params.id);
  res.sendStatus(200);
};
