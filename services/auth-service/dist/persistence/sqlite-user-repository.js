"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const sqlite3_1 = __importDefault(require("sqlite3"));
const crypto_1 = __importDefault(require("crypto"));
const sqlite3 = sqlite3_1.default.verbose();
const getDatabaseLocation = () => process.env.AUTH_SQLITE_DB_LOCATION ??
    path_1.default.join(process.cwd(), "data", "auth-users.db");
let db = null;
function mapRow(row) {
    return {
        id: row.id,
        email: row.email,
        passwordHash: row.passwordHash,
        createdAt: row.createdAt,
    };
}
function init() {
    const location = getDatabaseLocation();
    const dirName = path_1.default.dirname(location);
    if (!fs_1.default.existsSync(dirName)) {
        fs_1.default.mkdirSync(dirName, { recursive: true });
    }
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(location, (err) => {
            if (err) {
                reject(err);
                return;
            }
            const database = db;
            if (!database) {
                reject(new Error("Database not initialised"));
                return;
            }
            database.run("CREATE TABLE IF NOT EXISTS users (id varchar(36) PRIMARY KEY, email varchar(255) UNIQUE NOT NULL, passwordHash varchar(255) NOT NULL, createdAt varchar(30) NOT NULL)", (createErr) => {
                if (createErr) {
                    reject(createErr);
                    return;
                }
                resolve();
            });
        });
    });
}
function teardown() {
    if (!db)
        return Promise.resolve();
    return new Promise((resolve, reject) => {
        const database = db;
        if (!database) {
            resolve();
            return;
        }
        database.close((err) => {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}
function create(user) {
    const id = crypto_1.default.randomUUID();
    const createdAt = new Date().toISOString();
    const toStore = {
        id,
        email: user.email,
        passwordHash: user.passwordHash,
        createdAt,
    };
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error("Database not initialised"));
            return;
        }
        db.run("INSERT INTO users (id, email, passwordHash, createdAt) VALUES (?, ?, ?, ?)", [toStore.id, toStore.email, toStore.passwordHash, toStore.createdAt], (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(toStore);
        });
    });
}
function findByEmail(email) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error("Database not initialised"));
            return;
        }
        db.get("SELECT id, email, passwordHash, createdAt FROM users WHERE email = ?", [email], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            if (!row) {
                resolve(null);
                return;
            }
            resolve(mapRow(row));
        });
    });
}
function findById(id) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error("Database not initialised"));
            return;
        }
        db.get("SELECT id, email, passwordHash, createdAt FROM users WHERE id = ?", [id], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            if (!row) {
                resolve(null);
                return;
            }
            resolve(mapRow(row));
        });
    });
}
const sqliteUserRepository = {
    init,
    teardown,
    create,
    findByEmail,
    findById,
};
exports.default = sqliteUserRepository;
