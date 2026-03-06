"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const persistence_1 = require("./persistence");
const currentUser_1 = require("./middleware/currentUser");
const projects_1 = require("./routes/projects");
const app = (0, express_1.default)();
const port = Number(process.env.PORT) || 3001;
const repo = (0, persistence_1.createRepository)();
app.use(express_1.default.json());
app.use(currentUser_1.currentUser);
app.get('/', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});
(0, projects_1.mountProjectRoutes)(app, repo);
repo
    .init()
    .then(() => {
    app.listen(port, () => {
        // eslint-disable-next-line no-console
        console.log(`[project-service] Listening on port ${port}`);
    });
})
    .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
});
const gracefulShutdown = () => {
    repo
        .teardown()
        .catch(() => { })
        .then(() => process.exit());
};
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown);
