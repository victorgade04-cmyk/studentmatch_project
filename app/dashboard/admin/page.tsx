import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const admin = createAdminClient();

  // Stats
  const [
    { count: userCount },
    { count: studentCount },
    { count: companyCount },
    { count: jobCount },
    { count: appCount },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "company"),
    supabase.from("jobs").select("*", { count: "exact", head: true }),
    supabase.from("applications").select("*", { count: "exact", head: true }),
  ]);

  // Recent users
  const { data: recentUsers } = await supabase
    .from("users")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  // Pending applications
  const { data: pendingApps } = await supabase
    .from("applications")
    .select("id, status, created_at, jobs(title, company_profiles(company_name)), student_profiles(full_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
      <p className="text-gray-500 text-sm mb-8">Platform overview and management</p>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        {[
          { label: "Total Users", value: userCount ?? 0, color: "text-gray-900" },
          { label: "Students", value: studentCount ?? 0, color: "text-blue-600" },
          { label: "Companies", value: companyCount ?? 0, color: "text-green-600" },
          { label: "Jobs", value: jobCount ?? 0, color: "text-purple-600" },
          { label: "Applications", value: appCount ?? 0, color: "text-orange-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-800">Recent Users</h2>
            <Link href="/dashboard/admin/users" className="text-xs text-indigo-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers?.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{u.email}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </p>
                </div>
                <RoleBadge role={u.role} />
              </div>
            ))}
            {!recentUsers?.length && (
              <p className="px-6 py-4 text-sm text-gray-400">No users yet.</p>
            )}
          </div>
        </section>

        {/* Pending Applications */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-800">Pending Applications</h2>
            <Link href="/dashboard/admin/applications" className="text-xs text-indigo-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingApps?.map((a: any) => (
              <div key={a.id} className="px-6 py-3">
                <p className="text-sm font-medium text-gray-800">
                  {a.student_profiles?.full_name || "Student"} →{" "}
                  {a.jobs?.title}
                </p>
                <p className="text-xs text-gray-400">
                  {a.jobs?.company_profiles?.company_name} ·{" "}
                  {new Date(a.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
            {!pendingApps?.length && (
              <p className="px-6 py-4 text-sm text-gray-400">No pending applications.</p>
            )}
          </div>
        </section>
      </div>

      {/* Quick links */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: "/dashboard/admin/users", label: "Manage Users & Rates", desc: "Set student hourly rates and manage roles" },
          { href: "/dashboard/admin/jobs", label: "All Jobs", desc: "View and manage job listings" },
          { href: "/dashboard/admin/applications", label: "All Applications", desc: "Approve or reject applications" },
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

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin: "bg-red-100 text-red-700",
    student: "bg-blue-100 text-blue-700",
    company: "bg-green-100 text-green-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[role] || "bg-gray-100 text-gray-600"}`}>
      {role}
    </span>
  );
}
