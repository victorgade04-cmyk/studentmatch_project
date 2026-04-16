"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.user_metadata?.role !== "admin") throw new Error("Unauthorized");
  return user;
}

export async function setHourlyRate(
  _prev: { error?: string; success?: string },
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  try {
    await assertAdmin();
    const admin = createAdminClient();
    const studentId = formData.get("studentId") as string;
    const rate = parseFloat(formData.get("rate") as string);

    if (isNaN(rate) || rate < 0) return { error: "Invalid rate." };

    const { error } = await admin
      .from("student_profiles")
      .update({ hourly_rate: rate })
      .eq("id", studentId);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/admin/users");
    return { success: "Rate updated." };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function updateUserRole(
  _prev: { error?: string; success?: string },
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  try {
    await assertAdmin();
    const admin = createAdminClient();
    const userId = formData.get("userId") as string;
    const role = formData.get("role") as string;

    if (!["student", "company", "admin"].includes(role)) {
      return { error: "Invalid role." };
    }

    const { error: dbError } = await admin
      .from("users")
      .update({ role })
      .eq("id", userId);
    if (dbError) return { error: dbError.message };

    // Also update auth metadata
    const { error: authError } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: { role },
    });
    if (authError) return { error: authError.message };

    revalidatePath("/dashboard/admin/users");
    return { success: "Role updated." };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function setStudentPackage(
  _prev: { error?: string; success?: string },
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  try {
    await assertAdmin();
    const admin = createAdminClient();
    const studentId = formData.get("studentId") as string;
    const pkg = formData.get("package") as string;

    if (!["bronze", "silver", "gold"].includes(pkg)) return { error: "Invalid package." };

    const { error } = await admin
      .from("student_profiles")
      .update({ package: pkg })
      .eq("id", studentId);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/admin/users");
    revalidatePath("/dashboard/student/profile");
    revalidatePath("/dashboard/student");
    return { success: "ok" };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function updateApplicationStatus(
  _prev: { error?: string; success?: string },
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  try {
    await assertAdmin();
    const admin = createAdminClient();
    const appId = formData.get("appId") as string;
    const status = formData.get("status") as string;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return { error: "Invalid status." };
    }

    const { error } = await admin
      .from("applications")
      .update({ status })
      .eq("id", appId);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/admin/applications");
    return { success: "Status updated." };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deleteJob(
  _prev: { error?: string; success?: string },
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  try {
    await assertAdmin();
    const admin = createAdminClient();
    const jobId = formData.get("jobId") as string;

    const { error } = await admin.from("jobs").delete().eq("id", jobId);
    if (error) return { error: error.message };

    revalidatePath("/dashboard/admin/jobs");
    return { success: "Job deleted." };
  } catch (e: any) {
    return { error: e.message };
  }
}

// Simple form actions for server components (no useActionState needed)
export async function setApplicationStatus(formData: FormData): Promise<void> {
  try {
    await assertAdmin();
    const admin = createAdminClient();
    const appId = formData.get("appId") as string;
    const status = formData.get("status") as string;
    if (!["pending", "approved", "rejected"].includes(status)) return;
    await admin.from("applications").update({ status }).eq("id", appId);
    revalidatePath("/dashboard/admin/applications");
  } catch {}
}

export async function removeJob(formData: FormData): Promise<void> {
  try {
    await assertAdmin();
    const admin = createAdminClient();
    const jobId = formData.get("jobId") as string;
    await admin.from("jobs").delete().eq("id", jobId);
    revalidatePath("/dashboard/admin/jobs");
  } catch {}
}

export async function updateStudentProfileAdmin(
  _prev: { error?: string; success?: string },
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  try {
    await assertAdmin();
    const admin = createAdminClient();
    const userId = formData.get("userId") as string;

    const skills = (formData.get("skills") as string)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const hourlyRateRaw = formData.get("hourly_rate") as string;
    const hourlyRate = hourlyRateRaw ? parseFloat(hourlyRateRaw) : null;

    const { error } = await admin
      .from("student_profiles")
      .update({
        full_name: formData.get("full_name") as string,
        bio: (formData.get("bio") as string) || null,
        skills,
        education: (formData.get("education") as string) || null,
        current_job: (formData.get("current_job") as string) || null,
        availability: (formData.get("availability") as string) || null,
        hourly_rate: hourlyRate,
        package: formData.get("package") as string,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) return { error: error.message };
    revalidatePath(`/dashboard/admin/users/${userId}`);
    revalidatePath("/dashboard/admin/users");
    return { success: "Profil opdateret!" };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function updateCompanyProfileAdmin(
  _prev: { error?: string; success?: string },
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  try {
    await assertAdmin();
    const admin = createAdminClient();
    const userId = formData.get("userId") as string;

    const { error } = await admin
      .from("company_profiles")
      .update({
        company_name: formData.get("company_name") as string,
        description: (formData.get("description") as string) || null,
        contact_email: (formData.get("contact_email") as string) || null,
        website: (formData.get("website") as string) || null,
        package: formData.get("package") as string,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) return { error: error.message };
    revalidatePath(`/dashboard/admin/users/${userId}`);
    revalidatePath("/dashboard/admin/users");
    return { success: "Virksomhedsprofil opdateret!" };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deleteUserAdmin(
  _prev: { error?: string; success?: string },
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  try {
    await assertAdmin();
    const admin = createAdminClient();
    const userId = formData.get("userId") as string;

    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) return { error: error.message };

    revalidatePath("/dashboard/admin/users");
    return { success: "Bruger slettet." };
  } catch (e: any) {
    return { error: e.message };
  }
}
