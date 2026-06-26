import type { Request, Response } from "express";
import type { UserRepository } from "../ports/userRepository";
import { hashPassword } from "../domain/password";
import { isValidBirthDate, isValidEmail, isValidPassword } from "./validation";

export function registerV2(repo: UserRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    const { email, password, birthDate } = req.body ?? {};

    if (
      !isValidEmail(email) ||
      !isValidPassword(password) ||
      !isValidBirthDate(birthDate)
    ) {
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
      birthDate,
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      birthDate: user.birthDate,
      createdAt: user.createdAt,
    });
  };
}
