import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// The app has exactly two real pages — /dashboard and /settings — both
// gated behind sign-in. This route is just the entry point: send signed-in
// visitors to their dashboard, everyone else to sign in.
export default async function Root() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/dashboard" : "/signin");
}
