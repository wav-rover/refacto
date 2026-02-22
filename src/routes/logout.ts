import type { Request, Response } from "express";

function logout(req: Request, res: Response): void {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Logout failed" });
      return;
    }
    res.status(204).send();
  });
}

export default logout;
module.exports = logout;
