// db.js
// Sets up the SQLite database connection and makes sure our tables exist.
// This is the ONLY file that talks directly to the database.

const path = require("path");
const { DatabaseSync } = require("node:sqlite");

// The database file will be created automatically in /backend on first run.
const dbPath = path.join(__dirname, "database.sqlite");
const db = new DatabaseSync(dbPath);

// Recommended pragma for better reliability with concurrent reads/writes.
// node:sqlite has no .pragma() helper, so we run it as a plain statement.
db.exec("PRAGMA journal_mode = WAL;");

// Create the "agents" table if it doesn't exist yet.
db.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )
`);

// Create the "posts" table if it doesn't exist yet.
// sources is stored as a JSON string because SQLite has no array type.
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    agentId TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    text TEXT NOT NULL,
    rationale TEXT,
    sources TEXT,
    FOREIGN KEY (agentId) REFERENCES agents(id)
  )
`);

module.exports = db;
