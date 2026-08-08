// agent.js
// Entry point for the autonomous AI agent.
//
// Flow: initialize once -> start the autonomous loop.
// Each cycle: DISCOVER -> MEMORY CHECK -> JUDGE -> WRITE -> PUBLISH -> WAIT
//
// Run with:  node agent.js
// (requires .env configured — see .env.example)

require("dotenv").config();

const backend = require("./backend");
const { discoverTopics } = require("./discovery");
const { selectTopic } = require("./judge");
const { writePost } = require("./writer");
const scheduler = require("./scheduler");

// The persona this agent will write as. In a fuller version this could
// come from a config file or CLI flag; for the hackathon it's read from
// environment variables so it's easy to change without touching code.
const PERSONA = {
  name: process.env.AGENT_NAME || "TechPulse",
  domain: process.env.AGENT_DOMAIN || "AI and technology news",
  tone: process.env.AGENT_TONE || "informative and concise",
};

/**
 * Runs one full autonomous cycle for the given agentId.
 */
async function runCycle(agentId) {
  console.log("[AGENT] Starting cycle");

  console.log("[DISCOVERY] Searching for candidate topics");
  const candidates = await discoverTopics();
  console.log(`[DISCOVERY] Found ${candidates.length} candidates`);

  console.log("[MEMORY] Checking previous posts for repeats");
  console.log("[JUDGE] Scoring candidates and selecting a topic");
  const topic = selectTopic(agentId, candidates);

  if (!topic) {
    console.log("[JUDGE] All candidates were duplicates or weak — skipping this cycle");
    return;
  }
  console.log(`[JUDGE] Selected topic: "${topic.title}"`);

  console.log("[WRITER] Generating post");
  const { text, rationale, sources } = await writePost(PERSONA, topic);

  console.log("[BACKEND] Publishing post");
  const post = backend.publishPost({ agentId, text, rationale, sources });
  console.log(`[BACKEND] Published post ${post.id}`);
}

/**
 * Initializes the agent with the backend (once) then starts the loop.
 */
async function main() {
  console.log("[AGENT] Initializing with backend...");
  const agentId = await backend.initAgent(PERSONA);
  console.log(`[AGENT] Initialized. agentId = ${agentId}`);
  console.log("[AGENT] Leave this running — posts will appear automatically.");

  scheduler.start(() => runCycle(agentId));
}

main().catch((err) => {
  console.error("[AGENT] Fatal error during startup:", err.message);
  process.exit(1);
});
