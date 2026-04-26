"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function generatePassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let pw = "";
  for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

export async function createTestUser(
  role: "student" | "company",
  name: string,
  email: string
): Promise<{ email: string; password: string; userId: string } | { error: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const callerRole = user?.user_metadata?.role ?? user?.app_metadata?.role;
    if (callerRole !== "admin") return { error: "Kun admins kan bruge denne funktion." };

    const admin = createAdminClient();
    const password = generatePassword();

    const { data: { user: newUser }, error: createErr } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role },
      });

    if (createErr || !newUser) {
      return { error: createErr?.message ?? "Kunne ikke oprette bruger." };
    }

    await admin
      .from("users")
      .upsert({ id: newUser.id, email, role }, { onConflict: "id" });

    if (role === "student") {
      await admin.from("student_profiles").upsert(
        { id: newUser.id, full_name: name, bio: "Testprofil oprettet via admin.", skills: [], package: "bronze" },
        { onConflict: "id" }
      );
    } else {
      await admin.from("company_profiles").upsert(
        { id: newUser.id, company_name: name, description: "Testprofil oprettet via admin.", contact_email: email, package: "startup" },
        { onConflict: "id" }
      );
    }

    return { email, password, userId: newUser.id };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function resetUserPassword(
  userId: string
): Promise<{ email: string; password: string } | { error: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const callerRole = user?.user_metadata?.role ?? user?.app_metadata?.role;
    if (callerRole !== "admin") return { error: "Kun admins kan bruge denne funktion." };

    const admin = createAdminClient();
    const password = generatePassword();

    const { data: authUser, error: fetchErr } = await admin.auth.admin.getUserById(userId);
    if (fetchErr || !authUser.user) return { error: fetchErr?.message ?? "Bruger ikke fundet." };

    const { error: updateErr } = await admin.auth.admin.updateUserById(userId, { password });
    if (updateErr) return { error: updateErr.message };

    return { email: authUser.user.email ?? "", password };
  } catch (e: any) {
    return { error: e.message };
  }
}
