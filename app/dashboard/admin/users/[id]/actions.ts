"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function generateImpersonationLink(
  userId: string
): Promise<{ url: string } | { error: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Ikke logget ind." };

    const callerRole = user.user_metadata?.role ?? user.app_metadata?.role;
    if (callerRole !== "admin") return { error: "Kun admins kan bruge denne funktion." };

    const admin = createAdminClient();

    const { data: { user: targetUser }, error: targetErr } =
      await admin.auth.admin.getUserById(userId);
    if (targetErr || !targetUser) return { error: "Bruger ikke fundet." };

    const targetRole =
      targetUser.user_metadata?.role ?? targetUser.app_metadata?.role;
    if (targetRole !== "student" && targetRole !== "company") {
      return { error: "Kan kun logge ind som Kandidat eller Virksomhed." };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: targetUser.email!,
      options: {
        redirectTo: `${siteUrl}/auth/callback?impersonated=true`,
      },
    });

    if (error || !data?.properties?.action_link) {
      return { error: "Kunne ikke generere login-link. Prøv igen." };
    }

    return { url: data.properties.action_link };
  } catch (e: any) {
    return { error: e.message };
  }
}
