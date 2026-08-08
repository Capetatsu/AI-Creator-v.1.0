// writer.js
// Generates the post text using an AI text-generation API, honoring the
// persona supplied at initialization. The provider is fully configurable
// via environment variables so the team can point it at any free/low-cost
// OpenAI-compatible chat completions endpoint (Groq, OpenAI, etc.).
//
// If no API key is configured, we fall back to a simple template so the
// rest of the pipeline (discovery -> memory -> judge -> write -> publish)
// can still be demoed end to end without any paid service.

const AI_API_URL = process.env.AI_API_URL || "https://api.groq.com/openai/v1/chat/completions";
const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "llama-3.1-8b-instant";

/**
 * Writes a post about the selected topic in the given persona's voice.
 * @param {{name:string, domain:string, tone?:string}} persona
 * @param {{title:string, url:string}} topic
 * @returns {Promise<{text:string, rationale:string, sources:string[]}>}
 */
async function writePost(persona, topic) {
  if (!AI_API_KEY) {
    return mockWrite(persona, topic);
  }

  const prompt = buildPrompt(persona, topic);

  try {
    const res = await fetch(AI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      throw new Error(`AI API returned ${res.status}`);
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "";

    return parseModelOutput(raw, topic);
  } catch (err) {
    console.error("[WRITER] AI API call failed, using fallback template:", err.message);
    return mockWrite(persona, topic);
  }
}

function buildPrompt(persona, topic) {
  return `You are writing a short social post as "${persona.name}", ` +
    `an account focused on ${persona.domain}${persona.tone ? ` with a ${persona.tone} tone` : ""}.

Topic: ${topic.title}
Source: ${topic.url}

Write:
1. A short post (2-4 sentences) about this topic, in the persona's voice.
2. One sentence explaining why this topic is worth posting about right now.

Only use the source above. Do not invent facts or additional sources.

Respond in this exact format:
POST: <the post text>
RATIONALE: <the one-sentence rationale>`;
}

function parseModelOutput(raw, topic) {
  const postMatch = raw.match(/POST:\s*([\s\S]*?)(?:\nRATIONALE:|$)/i);
  const rationaleMatch = raw.match(/RATIONALE:\s*([\s\S]*)$/i);

  return {
    text: (postMatch ? postMatch[1] : raw).trim(),
    rationale: (rationaleMatch ? rationaleMatch[1] : "Selected as the strongest fresh topic this cycle.").trim(),
    sources: [topic.url],
  };
}

function mockWrite(persona, topic) {
  return {
    text: `[${persona.name}] Interesting development in ${persona.domain}: "${topic.title}". Worth a look.`,
    rationale: "Fallback template used because no AI_API_KEY was configured.",
    sources: [topic.url],
  };
}

module.exports = { writePost };
