import Parser from "rss-parser";

const parser = new Parser();

// Google News section topics that have dedicated category feeds
const CATEGORIES = [
  "WORLD",
  "NATION",
  "BUSINESS",
  "TECHNOLOGY",
  "ENTERTAINMENT",
  "SCIENCE",
  "SPORTS",
  "HEALTH",
];

// Fetches current headlines from Google News RSS, either from a fixed
// category feed or a free-text search feed. No API key required.
export async function fetchHeadlines(query, isCategory = false) {
  const normalized = (query || "").trim().toUpperCase();
  let url;

  if (isCategory && CATEGORIES.includes(normalized)) {
    url = `https://news.google.com/rss/headlines/section/topic/${normalized}?hl=en-US&gl=US&ceid=US:en`;
  } else {
    url = `https://news.google.com/rss/search?q=${encodeURIComponent(
      query
    )}&hl=en-US&gl=US&ceid=US:en`;
  }

  const feed = await parser.parseURL(url);

  return (feed.items || []).slice(0, 10).map((item) => {
    // Google News titles are formatted as "Headline - Source Name"
    const raw = item.title || "";
    const lastDash = raw.lastIndexOf(" - ");
    const title = lastDash > -1 ? raw.slice(0, lastDash) : raw;
    const source = lastDash > -1 ? raw.slice(lastDash + 3) : "Unknown source";

    // Google News' contentSnippet for a clustered story concatenates several
    // related headlines from other sources, newline-separated (e.g. "Main
    // headline  Source\nRelated headline  Other Source\n..."). Keeping only
    // the first line gives the model one clean description instead of 5x-10x
    // the tokens per headline — this was the main driver of both Gemini's
    // quota burn and Groq's per-minute token limit on topics with heavily
    // clustered coverage.
    const snippet = (item.contentSnippet || "").split("\n")[0].trim();

    return {
      title,
      source,
      link: item.link,
      pubDate: item.pubDate || null,
      snippet,
    };
  });
}

export const NEWS_CATEGORIES = CATEGORIES;
