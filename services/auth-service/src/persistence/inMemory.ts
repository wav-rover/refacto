import crypto from "crypto";
import type { NewUser, User, UserId } from "../domain/user";
import type { UserRepository } from "../ports/userRepository";

const byId = new Map<UserId, User>();
const byEmail = new Map<string, User>();

async function init(): Promise<void> {
  byId.clear();
  byEmail.clear();
}

async function teardown(): Promise<void> {
  byId.clear();
  byEmail.clear();
}

async function create(user: NewUser): Promise<User> {
  const id: UserId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const created: User = {
    id,
    email: user.email,
    passwordHash: user.passwordHash,
    createdAt,
    birthDate: user.birthDate,
  };
  byId.set(id, created);
  byEmail.set(user.email.toLowerCase(), created);
  return created;
}

async function findByEmail(email: string): Promise<User | null> {
  return byEmail.get(email.toLowerCase()) ?? null;
}

async function findById(id: UserId): Promise<User | null> {
  return byId.get(id) ?? null;
}

const inMemoryRepository: UserRepository = {
  init,
  teardown,
  create,
  findByEmail,
  findById,
};

export default inMemoryRepository;
