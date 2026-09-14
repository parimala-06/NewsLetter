import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ bookmarks: [] });

  const { data, error } = await supabase
    .from("bookmarks")
    .select("topic, is_category, position")
    .eq("user_id", user.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bookmarks: data });
}

export async function POST(req) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { topic, isCategory } = await req.json();
  if (!topic) return NextResponse.json({ error: "Topic is required" }, { status: 400 });

  // New topics are appended after whatever the user's highest position
  // currently is, so they land at the end of the dashboard instead of
  // jumping to the front.
  const { data: existing } = await supabase
    .from("bookmarks")
    .select("position")
    .eq("user_id", user.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = (existing?.position ?? -1) + 1;

  const { error } = await supabase
    .from("bookmarks")
    .upsert(
      { user_id: user.id, topic, is_category: !!isCategory, position: nextPosition },
      { onConflict: "user_id,topic,is_category" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Persists a new display order for the user's topics — body is
// { order: [{ topic, isCategory }, ...] } in the desired order.
export async function PATCH(req) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { order } = await req.json();
  if (!Array.isArray(order)) {
    return NextResponse.json({ error: "order must be an array" }, { status: 400 });
  }

  const updates = await Promise.all(
    order.map((item, index) =>
      supabase
        .from("bookmarks")
        .update({ position: index })
        .eq("user_id", user.id)
        .eq("topic", item.topic)
        .eq("is_category", !!item.isCategory)
    )
  );

  const failed = updates.find((r) => r.error);
  if (failed) return NextResponse.json({ error: failed.error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { topic, isCategory } = await req.json();

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("user_id", user.id)
    .eq("topic", topic)
    .eq("is_category", !!isCategory);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
