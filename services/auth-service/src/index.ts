import "dotenv/config";
import express from "express";
import session from "express-session";
import { createRepository } from "./persistence";
import { register } from "./routes/register";
import { login } from "./routes/login";
import { logout } from "./routes/logout";
import { me } from "./routes/me";
import { requireAuth } from "./middleware/requireAuth";

const app = express();
const port = Number(process.env.PORT) || 3004;
const sessionSecret = process.env.SESSION_SECRET ?? "dev-secret";
const repo = createRepository();

app.use(express.json());

const isProduction = process.env.NODE_ENV === "production";
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
    },
  })
);

app.get("/", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Routes d'authentification exposées sous /v1 (versionnage d'API).
const v1 = express.Router();
v1.post("/auth/register", register(repo));
v1.post("/auth/login", login(repo));
v1.post("/auth/logout", logout);
v1.get("/auth/me", requireAuth, me);
app.use("/v1", v1);

repo
  .init()
  .then(() => {
    app.listen(port, () => {
      console.log(`[auth-service] Listening on port ${port}`);
    });
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
process.on("SIGUSR2", gracefulShutdown);
