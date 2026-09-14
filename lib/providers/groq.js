import {
  buildInitialPrompt,
  buildSelfCritiquePrompt,
  parseDigestJSON,
  executeToolCall,
} from "../agentShared";

// Groq's free tier is used as a fallback when the Gemini free tier's daily
// quota is exhausted (see lib/agent.js). Groq exposes an OpenAI-compatible
// chat-completions API, so this talks to it directly over fetch rather than
// pulling in another SDK.
//
// gpt-oss-20b instead of gpt-oss-120b: the 120b model's free-tier limit is
// only 8,000 tokens/minute, which this agent's multi-turn loop (headlines +
// image results resent as context on every turn) can exceed within a
// single digest — the 20b model's free-tier TPM budget is much larger and
// comfortably covers a full run.
const GROQ_MODEL = "openai/gpt-oss-20b";

const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_news",
      description:
        "Search Google News for current headlines matching a query or a fixed category. Returns a list of headline objects with title, source, link, publish date, and a short snippet.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Search keywords for a free-text topic, OR one of the fixed category names: WORLD, NATION, BUSINESS, TECHNOLOGY, ENTERTAINMENT, SCIENCE, SPORTS, HEALTH.",
          },
          isCategory: {
            type: "boolean",
            description:
              "true if 'query' is one of the fixed category names above, false if it is a free-text keyword search.",
          },
        },
        required: ["query", "isCategory"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_images",
      description:
        "Finds a real, freely-licensed photo for each of several short image-search phrases. Returns, in the same order as the input, an object per query with either an imageUrl (and photo credit) or a null imageUrl if nothing suitable was found. Use 3-6 plain descriptive keywords per query (e.g. 'offshore wind turbine construction') — not the story headline, not brand names or proper nouns, since stock photo libraries index generic visual concepts, not news events.",
      parameters: {
        type: "object",
        properties: {
          queries: {
            type: "array",
            items: { type: "string" },
            description:
              "One short descriptive photo-search phrase per story, in the same order as the stories you intend to publish.",
          },
        },
        required: ["queries"],
      },
    },
  },
];

// Groq's per-minute token limit is easy to brush up against mid-run even
// on a generous model, since a rate-limited response's body tells us
// exactly how long to wait ("Please try again in 4.2s") — so a transient
// 429 is worth one short automatic retry instead of failing the whole
// digest outright. Two retries max, capped wait, so a real outage still
// fails within a bounded time instead of hanging.
async function callGroqChat(messages, tools, maxTokens, onEvent = () => {}, attempt = 0) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      // Groq's TPM (tokens-per-minute) limit accounts for the *reserved*
      // max_tokens on every request, not just the tokens actually
      // generated — leaving it unset reserves the model's full default
      // output ceiling against the budget on every single turn, which is
      // what was blowing through the 8,000 TPM free-tier limit even on a
      // smaller model. Capping it per turn keeps each request's footprint
      // proportional to what it actually needs.
      max_tokens: maxTokens,
      ...(tools ? { tools, tool_choice: "auto" } : {}),
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");

    if (res.status === 429 && attempt < 2) {
      const match = errText.match(/try again in ([\d.]+)s/i);
      const waitMs = Math.min(match ? Math.ceil(parseFloat(match[1]) * 1000) + 500 : 5000, 20000);
      onEvent({ type: "rate_limited", provider: "groq", waitMs });
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      return callGroqChat(messages, tools, maxTokens, onEvent, attempt + 1);
    }

    throw new Error(errText || `Groq API responded ${res.status}`);
  }

  return res.json();
}

// Mirrors the Gemini agent loop in lib/agent.js turn-for-turn (same
// prompts, same tools, same self-critique pass) but speaks Groq's
// OpenAI-compatible tool-calling format instead of Gemini's.
export async function runDigestAgentGroq(topic, isCategory, onEvent = () => {}, storyCount) {
  let messages = [{ role: "user", content: buildInitialPrompt(topic, isCategory, storyCount) }];

  const maxTurns = 8;
  let draftText = null;

  for (let turn = 0; turn < maxTurns; turn++) {
    const response = await callGroqChat(messages, TOOLS, 2600, onEvent);
    const message = response.choices[0].message;
    const toolCalls = message.tool_calls;

    if (!toolCalls || toolCalls.length === 0) {
      draftText = message.content;
      break;
    }

    messages.push({ role: "assistant", content: message.content || null, tool_calls: toolCalls });

    for (const tc of toolCalls) {
      const name = tc.function.name;
      let args = {};
      try {
        args = JSON.parse(tc.function.arguments || "{}");
      } catch {
        // Leave args empty — executeToolCall handles missing fields
        // gracefully for each tool.
      }

      const isFallback = name === "search_news" && !isCategory && args.isCategory === true;
      onEvent({ type: "tool_call", name, args, isFallback });

      const result = await executeToolCall({ name, args });
      onEvent({ type: "tool_result", name, result });

      messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });
    }
  }

  if (draftText === null) {
    throw new Error(
      "The agent didn't converge on a final digest in time — try a narrower topic."
    );
  }

  onEvent({ type: "self_critique" });
  messages.push({ role: "assistant", content: draftText });
  messages.push({ role: "user", content: buildSelfCritiquePrompt(topic) });

  const critique = await callGroqChat(messages, null, 2600, onEvent);
  const critiqueText = critique.choices[0].message.content;

  return parseDigestJSON(critiqueText || draftText);
}
