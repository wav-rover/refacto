import type { Request, Response } from "express";
import type { UserRepository } from "../ports/userRepository";
import { hashPassword } from "../domain/password";

function isValidEmail(email: unknown): email is string {
  if (typeof email !== "string") return false;
  return email.includes("@") && email.trim() !== "";
}

function isValidPassword(password: unknown): password is string {
  if (typeof password !== "string") return false;
  return password.length >= 6;
}

export function register(repo: UserRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body ?? {};

    if (!isValidEmail(email) || !isValidPassword(password)) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }

    const existing = await repo.findByEmail(email);
    if (existing) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }

    const passwordHash = await hashPassword(password);

    const user = await repo.create({
      email,
      passwordHash,
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    });
  };
}
