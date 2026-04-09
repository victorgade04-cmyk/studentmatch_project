import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function CompanyDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: jobs }, { data: apps }] = await Promise.all([
    supabase
      .from("company_profiles")
      .select("company_name, description")
      .eq("id", user!.id)
      .single(),
    supabase
      .from("jobs")
      .select("id, title, status")
      .eq("company_id", user!.id),
    supabase
      .from("applications")
      .select("id, status, jobs!inner(company_id)")
      .eq("jobs.company_id", user!.id),
  ]);

  const openJobs = jobs?.filter((j) => j.status === "open").length ?? 0;
  const pendingApps = apps?.filter((a) => a.status === "pending").length ?? 0;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {profile?.company_name || "Company Dashboard"}
      </h1>
      <p className="text-gray-500 text-sm mb-8">Manage jobs and find students</p>

      {!profile?.company_name && (
        <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-indigo-700">Complete your company profile to attract students.</p>
          <Link href="/dashboard/company/profile" className="text-sm font-semibold text-indigo-600 hover:underline">
            Set up profile →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Jobs", value: jobs?.length ?? 0, color: "text-gray-900" },
          { label: "Open Jobs", value: openJobs, color: "text-green-600" },
          { label: "Total Applications", value: apps?.length ?? 0, color: "text-indigo-600" },
          { label: "Pending Review", value: pendingApps, color: "text-yellow-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: "/dashboard/company/jobs", label: "Post & Manage Jobs", desc: "Create job listings and review applicants" },
          { href: "/dashboard/company/students", label: "Browse Students", desc: "Find students by skills and availability" },
          { href: "/dashboard/company/profile", label: "Company Profile", desc: "Update your company info and contact details" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="block bg-white rounded-xl border border-gray-100 p-5 hover:border-indigo-200 hover:shadow-sm transition group"
          >
            <p className="font-semibold text-sm text-gray-800 group-hover:text-indigo-600">{l.label}</p>
            <p className="text-xs text-gray-400 mt-1">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
