import "dotenv/config";
import express from "express";
import session from "express-session";
import { createRepository } from "./persistence";
import { register } from "./routes/register";
import { login } from "./routes/login";
import { me } from "./routes/me";
import { requireAuth } from "./middleware/requireAuth";

const app = express();
const port = Number(process.env.PORT) || 3004;
const sessionSecret = process.env.SESSION_SECRET ?? "dev-secret";
const repo = createRepository();

app.use(express.json());

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true },
  })
);

app.get("/", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/auth/register", register(repo));
app.post("/auth/login", login(repo));
app.get("/auth/me", requireAuth, me);

repo
  .init()
  .then(() => {
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`[auth-service] Listening on port ${port}`);
    });
  })
  .catch((err: unknown) => {
    // eslint-disable-next-line no-console
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
process.on("SIGUSR2", gracefulShutdown);
