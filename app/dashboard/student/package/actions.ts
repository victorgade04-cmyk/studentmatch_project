"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateStudentPackage(
  _prev: { error?: string; success?: string },
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role !== "student") return { error: "Ikke autoriseret." };

    const pkg = formData.get("package") as string;
    if (!["bronze", "silver", "gold"].includes(pkg)) return { error: "Ugyldig pakke." };

    const { error } = await supabase
      .from("student_profiles")
      .update({ package: pkg })
      .eq("id", user.id);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/student/package");
    revalidatePath("/dashboard/student");
    revalidatePath("/dashboard/student/profile");

    const names: Record<string, string> = { bronze: "Bronze", silver: "Silver", gold: "Gold" };
    return { success: `Du er nu på ${names[pkg]}-pakken!` };
  } catch (e: any) {
    return { error: e.message };
  }
}
