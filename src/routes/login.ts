import type { Request, Response } from "express";

async function login(req: Request, res: Response): Promise<void> {
  const username = req.body?.username;
  const password = req.body?.password;
  const expectedUsername = process.env.AUTH_USERNAME;
  const expectedPassword = process.env.AUTH_PASSWORD;

  const isValid =
    typeof username === "string" &&
    typeof password === "string" &&
    username === expectedUsername &&
    password === expectedPassword;

  if (!isValid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  Object.assign(req.session, { user: username });
  res.status(200).json({ ok: true });
}

export default login;
module.exports = login;
