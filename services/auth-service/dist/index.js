"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const sqlite_user_repository_1 = __importDefault(require("./persistence/sqlite-user-repository"));
const app = (0, express_1.default)();
const port = Number(process.env.PORT) || 3004;
app.use(express_1.default.json());
app.get("/", (_req, res) => {
    res.status(200).json({ status: "ok" });
});
sqlite_user_repository_1.default
    .init()
    .then(() => {
    app.listen(port, () => {
        // eslint-disable-next-line no-console
        console.log(`[auth-service] Listening on port ${port}`);
    });
})
    .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
});
const gracefulShutdown = () => {
    sqlite_user_repository_1.default
        .teardown()
        .catch(() => { })
        .then(() => process.exit());
};
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
process.on("SIGUSR2", gracefulShutdown);
