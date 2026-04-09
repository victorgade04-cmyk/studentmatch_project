import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const revalidate = 60; // cache for 60 seconds

export async function GET() {
  try {
    const admin = createAdminClient();

    const [
      { count: students },
      { count: companies },
      { count: applications },
    ] = await Promise.all([
      admin.from("users").select("*", { count: "exact", head: true }).eq("role", "student"),
      admin.from("users").select("*", { count: "exact", head: true }).eq("role", "company"),
      admin.from("applications").select("*", { count: "exact", head: true }),
    ]);

    return NextResponse.json({
      students: students ?? 0,
      companies: companies ?? 0,
      applications: applications ?? 0,
      services: 2,
    });
  } catch {
    return NextResponse.json({ students: 0, companies: 0, applications: 0, services: 2 });
  }
}
