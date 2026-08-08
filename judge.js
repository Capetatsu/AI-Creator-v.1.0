// judge.js
// Editorial judgment: score each candidate topic and pick the strongest
// one that isn't a duplicate of something already posted.
//
// Kept intentionally simple (no ML ranking) — a transparent point
// system a second-year student can read top to bottom.

const { isDuplicate } = require("./memory");

/**
 * Scores a single candidate. Higher is better.
 */
function scoreCandidate(candidate) {
  let score = 0;

  // Freshness: newer stories score higher (decays over 48 hours).
  const ageHours = (Date.now() - new Date(candidate.createdAt).getTime()) / 3_600_000;
  score += Math.max(0, 48 - ageHours) * 0.5;

  // Impact/importance proxy: community points (HN upvotes, etc.)
  score += Math.min(candidate.points, 200) * 0.3;

  // Source quality: prefer candidates that actually have a real URL.
  if (candidate.url && candidate.url.startsWith("http")) {
    score += 10;
  }

  return score;
}

/**
 * Picks the single strongest, non-duplicate candidate.
 * @param {string} agentId
 * @param {Array} candidates - from discovery.discoverTopics()
 * @returns {Object|null} the selected candidate, or null if none qualify
 */
function selectTopic(agentId, candidates) {
  const fresh = candidates.filter((c) => !isDuplicate(agentId, c.title));

  if (fresh.length === 0) {
    return null; // everything was a repeat — skip this cycle
  }

  const ranked = fresh
    .map((c) => ({ ...c, _score: scoreCandidate(c) }))
    .sort((a, b) => b._score - a._score);

  return ranked[0];
}

module.exports = { selectTopic, scoreCandidate };
