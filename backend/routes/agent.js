// routes/agent.js
// Route handlers for everything under /api/agent

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../db");

const router = express.Router();

/**
 * createPost()
 * -------------
 * Internal helper function that inserts a new post into SQLite.
 * This is what the future autonomous agent (in /agent) will import
 * and call once it's ready to publish something.
 *
 * @param {Object} params
 * @param {string} params.agentId  - the agent this post belongs to
 * @param {string} params.text     - the post content
 * @param {string} params.rationale - why the agent wrote this post
 * @param {string[]} params.sources - array of source URLs/strings
 * @returns {Object} the newly created post (with sources as an array)
 */
function createPost({ agentId, text, rationale, sources }) {
  if (!agentId || !text) {
    throw new Error("agentId and text are required to create a post");
  }

  const id = uuidv4();
  const createdAt = new Date().toISOString(); // ISO 8601 UTC
  const sourcesJson = JSON.stringify(sources || []);

  db.prepare(
    `INSERT INTO posts (id, agentId, createdAt, text, rationale, sources)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, agentId, createdAt, text, rationale || "", sourcesJson);

  return {
    id,
    agentId,
    createdAt,
    text,
    rationale: rationale || "",
    sources: sources || [],
  };
}

/**
 * POST /api/agent/init
 * Creates a new agent and returns its generated id.
 */
router.post("/init", (req, res) => {
  const { persona } = req.body;

  if (!persona || typeof persona !== "object") {
    return res.status(400).json({ error: "persona object is required" });
  }

  const { name, domain } = persona;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "persona.name is required and must be a string" });
  }

  if (!domain || typeof domain !== "string") {
    return res.status(400).json({ error: "persona.domain is required and must be a string" });
  }

  const agentId = uuidv4();
  const createdAt = new Date().toISOString();

  try {
    db.prepare(
      `INSERT INTO agents (id, name, domain, createdAt) VALUES (?, ?, ?, ?)`
    ).run(agentId, name, domain, createdAt);

    return res.status(201).json({ agentId });
  } catch (err) {
    console.error("Failed to create agent:", err);
    return res.status(500).json({ error: "Failed to create agent" });
  }
});

/**
 * GET /api/agent/feed?agentId=...
 * Returns all posts for the given agent, newest first.
 */
router.get("/feed", (req, res) => {
  const { agentId } = req.query;

  if (!agentId || typeof agentId !== "string") {
    return res.status(400).json({ error: "agentId query parameter is required" });
  }

  try {
    const agent = db.prepare("SELECT id FROM agents WHERE id = ?").get(agentId);

    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    const rows = db
      .prepare("SELECT * FROM posts WHERE agentId = ? ORDER BY createdAt DESC")
      .all(agentId);

    const posts = rows.map((row) => ({
      id: row.id,
      agentId: row.agentId,
      createdAt: row.createdAt,
      text: row.text,
      rationale: row.rationale,
      sources: JSON.parse(row.sources || "[]"),
    }));

    return res.status(200).json({ posts });
  } catch (err) {
    console.error("Failed to fetch feed:", err);
    return res.status(500).json({ error: "Failed to fetch feed" });
  }
});

module.exports = router;
module.exports.createPost = createPost;
