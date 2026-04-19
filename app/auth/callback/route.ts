import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } =
      await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const role = data.user.user_metadata?.role || "student";
      const impersonated = searchParams.get("impersonated") === "true";
      const dest = `${origin}/dashboard/${role}${impersonated ? "?impersonated=true" : ""}`;
      return NextResponse.redirect(dest);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
