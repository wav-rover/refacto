import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const REQUEST_ID_HEADER = "x-request-id";

export function requestId(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const incomingId = req.header(REQUEST_ID_HEADER);
  const id = incomingId && incomingId !== "" ? incomingId : randomUUID();

  req.headers[REQUEST_ID_HEADER] = id;
  res.setHeader(REQUEST_ID_HEADER, id);

  next();
}

export { REQUEST_ID_HEADER };
