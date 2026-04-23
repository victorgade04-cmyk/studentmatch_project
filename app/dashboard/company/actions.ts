"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { sendApplicationStatusEmail } from "@/lib/email";

async function getCompany() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "company") throw new Error("Unauthorized");
  return { supabase, user };
}

export async function updateCompanyProfile(
  _prev: { error?: string; success?: string },
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  try {
    const { supabase, user } = await getCompany();

    const { error } = await supabase
      .from("company_profiles")
      .update({
        company_name: formData.get("company_name") as string,
        description: formData.get("description") as string,
        contact_email: formData.get("contact_email") as string,
        website: formData.get("website") as string,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/company/profile");
    return { success: "Profil opdateret!" };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function createJob(
  _prev: { error?: string; success?: string },
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  try {
    const { supabase, user } = await getCompany();

    const title = (formData.get("title") as string).trim();
    if (!title) return { error: "Titel er påkrævet." };

    const description = (formData.get("description") as string).trim();
    if (!description) return { error: "Beskrivelse er påkrævet." };

    const requirements = (formData.get("requirements") as string)
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    const budgetRaw = formData.get("budget") as string;
    const budget = budgetRaw ? parseFloat(budgetRaw) : null;

    const deadlineRaw = formData.get("deadline") as string;
    const deadline = deadlineRaw || null;

    const jobType = (formData.get("job_type") as string) || null;
    const location = (formData.get("location") as string).trim() || null;

    const { error } = await supabase.from("jobs").insert({
      company_id: user.id,
      title,
      description,
      requirements,
      budget,
      deadline,
      job_type: jobType,
      location,
      status: "open",
    });

    if (error) return { error: error.message };
    revalidatePath("/dashboard/company/jobs");
    return { success: "Job oprettet!" };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function toggleJobStatus(
  _prev: { error?: string; success?: string },
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  try {
    const { supabase, user } = await getCompany();
    const jobId = formData.get("jobId") as string;
    const newStatus = formData.get("newStatus") as string;

    const { error } = await supabase
      .from("jobs")
      .update({ status: newStatus })
      .eq("id", jobId)
      .eq("company_id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/company/jobs");
    return { success: "Status opdateret." };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function updateApplicationStatus(
  _prev: { error?: string; success?: string },
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  try {
    const { supabase, user } = await getCompany();
    const appId = formData.get("appId") as string;
    const status = formData.get("status") as string;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return { error: "Ugyldig status." };
    }

    // Verify the application belongs to this company's job
    const { data: app } = await supabase
      .from("applications")
      .select("id, student_id, jobs!inner(company_id, title, company_profiles(company_name))")
      .eq("id", appId)
      .single();

    if (!app || (app.jobs as any)?.company_id !== user.id) {
      return { error: "Ikke autoriseret." };
    }

    const { error } = await supabase
      .from("applications")
      .update({ status })
      .eq("id", appId);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/company/jobs");

    // Email notification to student (best effort, only on terminal states)
    if (status === "approved" || status === "rejected") {
      try {
        const { data: studentUser } = await supabase
          .from("users")
          .select("email")
          .eq("id", app.student_id)
          .single();

        const { data: studentProfile } = await supabase
          .from("student_profiles")
          .select("full_name")
          .eq("id", app.student_id)
          .single();

        if (studentUser?.email) {
          await sendApplicationStatusEmail({
            studentEmail: studentUser.email,
            studentName: studentProfile?.full_name || "Studerende",
            jobTitle: (app.jobs as any)?.title || "Stillingen",
            status: status as "approved" | "rejected",
            companyName: (app.jobs as any)?.company_profiles?.company_name || "Virksomheden",
          });
        }
      } catch {}
    }

    return { success: "Ansøgning opdateret." };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getCompanyJobs(): Promise<{ data: any[] | null; error?: string; debug?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("[getCompanyJobs] No user session:", authError?.message);
      return { data: null, error: "Ikke logget ind." };
    }

    console.log("[getCompanyJobs] user.id =", user.id, "| role =", user.user_metadata?.role);

    const admin = createAdminClient();

    // Diagnostic: count all jobs in the DB and show their company_ids
    const { data: allJobs } = await admin
      .from("jobs")
      .select("id, company_id, title, status");
    console.log("[getCompanyJobs] all jobs in DB:", JSON.stringify(allJobs?.map(j => ({ id: j.id, company_id: j.company_id, title: j.title, status: j.status }))));
    console.log("[getCompanyJobs] looking for company_id =", user.id);

    const { data, error } = await admin
      .from("jobs")
      .select(`id, title, description, budget, status, requirements, deadline, job_type, location, created_at,
        applications(id, status, cover_letter, created_at,
          student_profiles(full_name, skills, hourly_rate))`)
      .eq("company_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getCompanyJobs] query error:", error.message);
      return { data: null, error: error.message };
    }

    console.log("[getCompanyJobs] matched jobs:", data?.length ?? 0);
    const debug = `user.id=${user.id} | total_jobs=${allJobs?.length ?? 0} | matched=${data?.length ?? 0}`;
    return { data: data ?? [], debug };
  } catch (e: any) {
    console.error("[getCompanyJobs] exception:", e.message);
    return { data: null, error: e.message };
  }
}

export async function toggleJobStatusDirect(formData: FormData): Promise<void> {
  try {
    const { supabase, user } = await getCompany();
    const jobId = formData.get("jobId") as string;
    const newStatus = formData.get("newStatus") as string;
    await supabase.from("jobs").update({ status: newStatus }).eq("id", jobId).eq("company_id", user.id);
    revalidatePath("/dashboard/company/jobs");
  } catch {}
}
