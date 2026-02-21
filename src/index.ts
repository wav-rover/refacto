const express = require("express");
const app = express();
const { createRepository } = require("./persistence");
const getItems = require("./routes/getItems");
const addItem = require("./routes/addItem");
const updateItem = require("./routes/updateItem");
const deleteItem = require("./routes/deleteItem");

const repo = createRepository();

app.use(express.json());
app.use(express.static(__dirname + "/static"));

app.get("/items", getItems(repo));
app.post("/items", addItem(repo));
app.put("/items/:id", updateItem);
app.delete("/items/:id", deleteItem);

repo
  .init()
  .then(() => {
    app.listen(3000, () => console.log("Listening on port 3000"));
  })
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });

const gracefulShutdown = () => {
  repo
    .teardown()
    .catch(() => {})
    .then(() => process.exit());
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
process.on("SIGUSR2", gracefulShutdown); // Sent by nodemon

export {};
