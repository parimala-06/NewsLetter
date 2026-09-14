import { fetchHeadlines } from "./news";
import { fetchImages } from "./images";

export const CATEGORY_NAMES =
  "WORLD, NATION, BUSINESS, TECHNOLOGY, ENTERTAINMENT, SCIENCE, SPORTS, HEALTH";

// Provider-agnostic prompt text and tool execution, shared by both the
// Gemini loop (lib/agent.js) and the Groq fallback loop
// (lib/providers/groq.js) — only the request/response plumbing for talking
// to each model API differs between them.
export function buildInitialPrompt(topic, isCategory, storyCount) {
  const range =
    storyCount === "quick" ? [3, 3] : storyCount === "deep" ? [8, 10] : [5, 8];
  const [minStories, maxStories] = range;
  const storyCountInstruction =
    minStories === maxStories
      ? `Include exactly ${minStories} stories — the reader wants a quick brief, not a deep dive.`
      : storyCount === "deep"
      ? `Include ${minStories} to ${maxStories} stories — the reader wants a deep dive with thorough coverage.`
      : `Include ${minStories} to ${maxStories} stories.`;

  return `You are the lead editor of an AI-curated newsroom. Produce a concise "front page" digest on this topic: "${topic}".

You have two tools, and must use them in this order:

1. search_news(query, isCategory) — gathers current headlines. ${
    isCategory
      ? "This is a fixed news category — call it once with isCategory set to true and query set to the category name."
      : `This is a free-text topic — call it with isCategory set to false. You may call it up to 3 times with different but related phrasings if it helps cover the topic from multiple angles (e.g. a broader term and a more specific one). If, after that, you still have fewer than 3 usable headlines, you may make one further search_news call with isCategory set to true using whichever fixed category (${CATEGORY_NAMES}) is most topically related, to round out coverage — and clearly say in the leadParagraph that some coverage is broader category news rather than exact matches.`
  }
2. find_images(queries) — once you have picked the 5-8 stories you intend to publish, call this exactly once with one short descriptive photo-search phrase per story, in the same order as your stories. Each phrase should describe the general visual subject (e.g. "solar panel installation rooftop"), not the specific headline or brand names, since the photo library indexes generic stock imagery, not news events.

Do not fabricate headlines, sources, links, or image URLs — only use what the tools actually return. If search_news returns few or no relevant results even after broadening, say so honestly in the digest rather than inventing coverage. If find_images returns a null imageUrl for a story, set that story's imageUrl to null rather than inventing one.

Once you have enough material, respond with ONLY valid JSON (no markdown code fences, no commentary before or after) matching exactly this shape:

{
  "headline": "a punchy front-page headline synthesizing the topic, written in your own words — never copied from a single source",
  "leadParagraph": "2-3 sentences summarizing the overall picture across the sources you found, in your own words",
  "stories": [
    { "title": "short original phrasing of what this story is about", "source": "publisher name", "url": "the article link", "blurb": "one sentence, in your own words, on what this specific story adds", "imageUrl": "the imageUrl returned by find_images for this story, or null", "imageCredit": "the photo credit returned by find_images for this story, or null" }
  ]
}

${storyCountInstruction} Always paraphrase — never copy a headline or sentence verbatim from any source.`;
}

export function buildSelfCritiquePrompt(topic) {
  return `Before finalizing, review your own draft above against two checks:
1. Does every story actually relate to the topic "${topic}" (or, if you broadened to a category, is that clearly explained in the leadParagraph)?
2. Does every headline, leadParagraph, and blurb paraphrase in your own words, with nothing copied verbatim from a source?

If the draft already passes both checks, return it completely unchanged. If not, fix the specific issues and return the corrected version. Either way, respond with ONLY the corrected JSON — no markdown code fences, no commentary, no explanation of what you changed.`;
}

export function parseDigestJSON(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// call: { name, args } — normalized the same way regardless of which
// provider's native tool-call shape it came from.
export async function executeToolCall(call) {
  if (call.name === "search_news") {
    try {
      return { headlines: await fetchHeadlines(call.args.query, call.args.isCategory) };
    } catch {
      return { headlines: [] };
    }
  }

  if (call.name === "find_images") {
    try {
      return { results: await fetchImages(call.args.queries) };
    } catch {
      return { results: [] };
    }
  }

  return { error: `Unknown tool: ${call.name}` };
}
