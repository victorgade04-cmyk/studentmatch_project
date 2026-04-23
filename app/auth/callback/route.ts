import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const impersonated = searchParams.get("impersonated") === "true";

  const supabase = await createClient();
  let role: string | null = null;

  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error && data.user) {
      role = data.user.user_metadata?.role || "student";
    }
  } else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      role = data.user.user_metadata?.role || "student";
    }
  }

  if (role) {
    let dest: string;
    if (impersonated && role === "student") {
      dest = `${origin}/dashboard/student/profile`;
    } else if (impersonated && role === "company") {
      dest = `${origin}/dashboard/company`;
    } else {
      dest = `${origin}/dashboard/${role}`;
    }
    return NextResponse.redirect(dest);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
