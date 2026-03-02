import "dotenv/config";
import express from "express";

const app = express();
const port = Number(process.env.PORT) || 3003;

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`[notification-service] Listening on port ${port}`);
});
