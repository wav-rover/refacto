import express from "express";
import session from "express-session";
import { createRepository } from "./persistence";
import getItems from "./routes/getItems";
import addItem from "./routes/addItem";
import updateItem from "./routes/updateItem";
import deleteItem from "./routes/deleteItem";
import login from "./routes/login";
import logout from "./routes/logout";
import requireAuth from "./middleware/requireAuth";

const app = express();

const repo = createRepository();
const sessionSecret = process.env.SESSION_SECRET ?? "dev-secret";

app.use(express.json());
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true },
  }),
);
app.use(express.static(__dirname + "/static"));

app.post("/login", login);
app.post("/logout", logout);
app.use("/items", requireAuth);
app.get("/items", getItems(repo));
app.post("/items", addItem(repo));
app.put("/items/:id", updateItem(repo));
app.delete("/items/:id", deleteItem(repo));

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
