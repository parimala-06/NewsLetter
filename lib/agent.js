import { GoogleGenAI, Type } from "@google/genai";
import {
  CATEGORY_NAMES,
  buildInitialPrompt,
  buildSelfCritiquePrompt,
  parseDigestJSON,
  executeToolCall,
} from "./agentShared";
import { runDigestAgentGroq } from "./providers/groq";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const searchNewsDeclaration = {
  name: "search_news",
  description:
    "Search Google News for current headlines matching a query or a fixed category. Returns a list of headline objects with title, source, link, publish date, and a short snippet.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description:
          `Search keywords for a free-text topic, OR one of the fixed category names: ${CATEGORY_NAMES}.`,
      },
      isCategory: {
        type: Type.BOOLEAN,
        description:
          "true if 'query' is one of the fixed category names above, false if it is a free-text keyword search.",
      },
    },
    required: ["query", "isCategory"],
  },
};

const findImagesDeclaration = {
  name: "find_images",
  description:
    "Finds a real, freely-licensed photo for each of several short image-search phrases. Returns, in the same order as the input, an object per query with either an imageUrl (and photo credit) or a null imageUrl if nothing suitable was found. Use 3-6 plain descriptive keywords per query (e.g. 'offshore wind turbine construction') — not the story headline, not brand names or proper nouns, since stock photo libraries index generic visual concepts, not news events.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      queries: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description:
          "One short descriptive photo-search phrase per story, in the same order as the stories you intend to publish.",
      },
    },
    required: ["queries"],
  },
};

function isQuotaExceededError(err) {
  return typeof err?.message === "string" && err.message.includes("RESOURCE_EXHAUSTED");
}

// Runs the agent loop: the model decides when/how to call search_news and
// find_images, we execute the real tool and feed results back, until it
// returns a final digest instead of another function call. `onEvent` (if
// given) is called with structured progress events as the loop runs, so a
// caller can stream a live trace of what the agent is doing.
async function runWithGemini(topic, isCategory, onEvent, storyCount) {
  let contents = [
    { role: "user", parts: [{ text: buildInitialPrompt(topic, isCategory, storyCount) }] },
  ];

  const tools = [{ functionDeclarations: [searchNewsDeclaration, findImagesDeclaration] }];

  // search_news may run up to 3 turns for a free-text topic, plus one
  // fallback category search, plus one turn for find_images, plus the final
  // answer — 8 gives that room to converge.
  const maxTurns = 8;
  let draftText = null;

  for (let turn = 0; turn < maxTurns; turn++) {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: { tools },
    });

    const calls = response.functionCalls;

    if (!calls || calls.length === 0) {
      draftText = response.text;
      break;
    }

    // Record the model's turn (including its function call request)
    contents.push({
      role: "model",
      parts: response.candidates[0].content.parts,
    });

    // Execute every requested tool call and collect results
    const responseParts = [];
    for (const call of calls) {
      const isFallback =
        call.name === "search_news" && !isCategory && call.args.isCategory === true;
      onEvent({ type: "tool_call", name: call.name, args: call.args, isFallback });

      const result = await executeToolCall(call);
      onEvent({ type: "tool_result", name: call.name, result });

      responseParts.push({
        functionResponse: { name: call.name, response: result },
      });
    }

    contents.push({ role: "user", parts: responseParts });
  }

  if (draftText === null) {
    throw new Error(
      "The agent didn't converge on a final digest in time — try a narrower topic."
    );
  }

  // Self-critique pass: one more turn, with no tools available (so the
  // model can't keep searching), asking it to check its own draft for
  // topic relevance and verbatim copying before we accept it as final.
  onEvent({ type: "self_critique" });
  contents.push({ role: "model", parts: [{ text: draftText }] });
  contents.push({ role: "user", parts: [{ text: buildSelfCritiquePrompt(topic) }] });

  const critique = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents,
  });

  return parseDigestJSON(critique.text || draftText);
}

// Gemini's free tier caps out at roughly 20 generateContent calls/day
// (see README). When that quota is exhausted mid-run, fall back to Groq's
// free tier — a different provider with its own separate quota — instead
// of failing the request outright. Only kicks in for the specific
// RESOURCE_EXHAUSTED error, and only if a Groq key is actually configured.
export async function runDigestAgent(topic, isCategory, onEvent = () => {}, storyCount) {
  try {
    return await runWithGemini(topic, isCategory, onEvent, storyCount);
  } catch (err) {
    if (isQuotaExceededError(err) && process.env.GROQ_API_KEY) {
      onEvent({ type: "provider_fallback", provider: "groq" });
      return await runDigestAgentGroq(topic, isCategory, onEvent, storyCount);
    }
    throw err;
  }
}
