import type { Request, Response } from "express";
import type { UserRepository } from "../ports/userRepository";
import { verifyPassword } from "../domain/password";

function isValidEmail(email: unknown): email is string {
  if (typeof email !== "string") return false;
  return email.includes("@") && email.trim() !== "";
}

function isValidPassword(password: unknown): password is string {
  if (typeof password !== "string") return false;
  return password.length >= 6;
}

type SessionUser = {
  id: string;
  email: string;
};

export function login(repo: UserRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body ?? {};

    if (!isValidEmail(email) || !isValidPassword(password)) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }

    const user = await repo.findByEmail(email);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const sessionUser: SessionUser = { id: user.id, email: user.email };
    Object.assign(req.session as { user?: SessionUser }, { user: sessionUser });

    res.status(200).json({
      ok: true,
      user: sessionUser,
    });
  };
}
