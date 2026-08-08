// server.js
// Entry point for the backend. Sets up Express, middleware, and routes.

const express = require("express");
const cors = require("cors");

const agentRoutes = require("./routes/agent");

const app = express();
const PORT = process.env.PORT || 3001;

// Allow the React frontend (running on a different port) to call this API.
app.use(cors());

// Parse incoming JSON request bodies.
app.use(express.json());

// Health check endpoint.
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// All agent-related routes live under /api/agent
app.use("/api/agent", agentRoutes);

// Basic 404 handler for anything else.
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
