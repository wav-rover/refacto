export type UserId = string;

export interface User {
  id: UserId;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface NewUser {
  email: string;
  passwordHash: string;
}
