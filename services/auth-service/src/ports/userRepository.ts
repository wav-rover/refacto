import type { NewUser, User, UserId } from "../domain/user";

export type { NewUser, User, UserId };

export interface UserRepository {
  init(): Promise<void>;
  teardown(): Promise<void>;
  create(user: NewUser): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: UserId): Promise<User | null>;
}
