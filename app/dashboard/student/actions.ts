"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function getStudent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "student") throw new Error("Unauthorized");
  return { supabase, user };
}

export async function updateStudentProfile(
  _prev: { error?: string; success?: string },
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  try {
    const { supabase, user } = await getStudent();

    const skills = (formData.get("skills") as string)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const { error } = await supabase
      .from("student_profiles")
      .update({
        full_name: formData.get("full_name") as string,
        bio: formData.get("bio") as string,
        skills,
        education: formData.get("education") as string,
        availability: formData.get("availability") as string,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/student/profile");
    return { success: "Profile updated!" };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function applyToJob(
  _prev: { error?: string; success?: string },
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  try {
    const { supabase, user } = await getStudent();
    const jobId = formData.get("jobId") as string;
    const coverLetter = formData.get("cover_letter") as string;

    const { error } = await supabase.from("applications").insert({
      job_id: jobId,
      student_id: user.id,
      cover_letter: coverLetter,
    });

    if (error) {
      if (error.code === "23505") return { error: "You already applied to this job." };
      return { error: error.message };
    }

    revalidatePath("/dashboard/student/applications");
    revalidatePath("/dashboard/student/jobs");
    return { success: "Application submitted!" };
  } catch (e: any) {
    return { error: e.message };
  }
}
