// Temporary values for testing the dashboard during the hackathon.
// Replace TEMP_AGENT_ID once the app has a real way to choose an agent
// (e.g. a login flow or an agent picker).
export const TEMP_AGENT_ID = "abc-123";

// The /api/agent/feed contract only returns posts, not agent metadata
// (name/domain/autonomous flag). Until the backend adds that, we show
// these placeholder values next to the real, live post count.
export const AGENT_DISPLAY_INFO = {
  name: "Content Agent Alpha",
  domain: "AI & Technology",
  autonomous: true,
};
