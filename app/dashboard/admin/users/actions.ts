"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createTestUser(
  role: "student" | "company",
  name: string,
  email: string
): Promise<{ url: string; userId: string } | { error: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const callerRole = user?.user_metadata?.role ?? user?.app_metadata?.role;
    if (callerRole !== "admin") return { error: "Kun admins kan bruge denne funktion." };

    const admin = createAdminClient();

    // Create the auth user (email already confirmed so magic link works immediately)
    const { data: { user: newUser }, error: createErr } =
      await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { role },
      });

    if (createErr || !newUser) {
      return { error: createErr?.message ?? "Kunne ikke oprette bruger." };
    }

    // Sync to public users table (upsert in case a DB trigger already did it)
    await admin
      .from("users")
      .upsert({ id: newUser.id, email, role }, { onConflict: "id" });

    // Create a minimal profile so the user can use the platform straight away
    if (role === "student") {
      await admin.from("student_profiles").upsert(
        {
          id: newUser.id,
          full_name: name,
          bio: "Testprofil oprettet via admin.",
          skills: [],
          package: "bronze",
        },
        { onConflict: "id" }
      );
    } else {
      await admin.from("company_profiles").upsert(
        {
          id: newUser.id,
          company_name: name,
          description: "Testprofil oprettet via admin.",
          contact_email: email,
          package: "startup",
        },
        { onConflict: "id" }
      );
    }

    // Generate a magic link so the admin can log straight in as the test user
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: "https://studentmatch.dk/auth/callback?impersonated=true" },
    });

    if (linkErr || !linkData?.properties?.action_link) {
      // User was created — return a partial success so the caller knows
      return { error: "Bruger oprettet, men kunne ikke generere login-link. Find brugeren i listen." };
    }

    return { url: linkData.properties.action_link, userId: newUser.id };
  } catch (e: any) {
    return { error: e.message };
  }
}
