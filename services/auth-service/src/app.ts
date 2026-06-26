import express, { type Application } from "express";
import session from "express-session";

import type { UserRepository } from "./ports/userRepository";
import { register } from "./routes/register";
import { registerV2 } from "./routes/registerV2";
import { login } from "./routes/login";
import { logout } from "./routes/logout";
import { me } from "./routes/me";
import { requireAuth } from "./middleware/requireAuth";

// Construit l'application Express de l'auth-service.
// Le repository est injecté pour permettre les tests (in-memory, états de contrat).
export function createApp(repo: UserRepository): Application {
  const app = express();
  const sessionSecret = process.env.SESSION_SECRET ?? "dev-secret";
  const isProduction = process.env.NODE_ENV === "production";

  app.use(express.json());

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

  const v2 = express.Router();
  v2.post("/auth/register", registerV2(repo));
  app.use("/v2", v2);

  return app;
}
