import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Returns the most recently saved digest for one topic, without invoking
// the agent — lets the dashboard hydrate instantly from digest_history and
// only burn Gemini quota when the user explicitly asks for a refresh.
export async function GET(req) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const topic = searchParams.get("topic");
  const isCategory = searchParams.get("isCategory") === "true";

  if (!topic) return NextResponse.json({ error: "Topic is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("digest_history")
    .select("digest, created_at")
    .eq("user_id", user.id)
    .eq("topic", topic)
    .eq("is_category", isCategory)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    digest: data?.digest || null,
    generatedAt: data?.created_at || null,
  });
}
