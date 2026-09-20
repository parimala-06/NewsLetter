import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Landing from "@/app/components/Landing";

// Signed-in visitors go straight to their dashboard; everyone else sees
// the real marketing landing page instead of an immediate redirect.
export default async function Root() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return <Landing />;
}
