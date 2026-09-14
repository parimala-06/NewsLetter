import { NextResponse } from "next/server";
import { runDigestAgent } from "@/lib/agent";
import { createClient } from "@/lib/supabase/server";

// The Gemini SDK's error messages are raw JSON from the API — this pulls
// out something readable, with a specific friendly message for the
// free-tier daily quota (a real limit you'll hit quickly while testing).
function cleanErrorMessage(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.error?.status === "RESOURCE_EXHAUSTED") {
      return "The free Gemini API daily quota has been used up for this key, and the Groq fallback either isn't configured or is also exhausted. Wait for the Gemini quota to reset, create a new key at https://aistudio.google.com/apikey, or add a free GROQ_API_KEY (see .env.example) for automatic fallback.";
    }
    if (parsed?.error?.message) return parsed.error.message;
  } catch {
    // Not JSON — fall through to the raw message.
  }
  return raw || "Something went wrong";
}

// Marks stories whose URL wasn't in the user's last saved digest for this
// same topic as "new" — the "yesterday vs today" diff. Signed-out users
// (or a first-ever run for a topic) just get no badges, not an error.
function markNewStories(digest, previousDigest) {
  if (!previousDigest?.stories?.length) return digest;
  const seenUrls = new Set(previousDigest.stories.map((s) => s.url));
  return {
    ...digest,
    stories: digest.stories.map((s) => ({ ...s, isNew: !seenUrls.has(s.url) })),
  };
}

// Streams newline-delimited JSON events as the agent works — each tool call
// and the self-critique step, followed by a final "done" (or "error") event
// — so the client can render a live trace instead of waiting silently.
export async function POST(req) {
  const { topic, isCategory, storyCount } = await req.json();

  if (!topic || !topic.trim()) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 });
  }

  const trimmedTopic = topic.trim();
  const categoryFlag = !!isCategory;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      try {
        let digest = await runDigestAgent(trimmedTopic, categoryFlag, send, storyCount);

        if (user) {
          const { data: previous } = await supabase
            .from("digest_history")
            .select("digest")
            .eq("user_id", user.id)
            .eq("topic", trimmedTopic)
            .eq("is_category", categoryFlag)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          digest = markNewStories(digest, previous?.digest);

          await supabase.from("digest_history").insert({
            user_id: user.id,
            topic: trimmedTopic,
            is_category: categoryFlag,
            digest,
          });
        }

        send({ type: "done", digest });
      } catch (err) {
        console.error(err);
        send({ type: "error", message: cleanErrorMessage(err.message) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
