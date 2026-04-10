"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendApplicationEmail } from "@/lib/email";

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
    return { success: "Profil opdateret!" };
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
      if (error.code === "23505") return { error: "Du har allerede ansøgt om dette job." };
      return { error: error.message };
    }

    revalidatePath("/dashboard/student/applications");
    revalidatePath("/dashboard/student/jobs");

    // Email notification to company (best effort)
    try {
      const { data: job } = await supabase
        .from("jobs")
        .select("title, company_id, company_profiles(company_name)")
        .eq("id", jobId)
        .single();

      const { data: companyUser } = await supabase
        .from("users")
        .select("email")
        .eq("id", (job as any)?.company_id)
        .single();

      const { data: studentProfile } = await supabase
        .from("student_profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (job && companyUser?.email) {
        await sendApplicationEmail({
          companyEmail: companyUser.email,
          companyName: (job as any)?.company_profiles?.company_name || "Virksomheden",
          studentName: studentProfile?.full_name || "En studerende",
          jobTitle: (job as any).title,
        });
      }
    } catch {}

    return { success: "Ansøgning sendt!" };
  } catch (e: any) {
    return { error: e.message };
  }
}
