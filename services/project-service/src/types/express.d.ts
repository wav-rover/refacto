declare global {
  namespace Express {
    interface Request {
      currentUserId?: string;
    }
  }
}

export {};
