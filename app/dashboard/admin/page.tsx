import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();

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

  const { data: recentUsers } = await supabase
    .from("users")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: pendingApps } = await supabase
    .from("applications")
    .select("id, status, created_at, jobs(title, company_profiles(company_name)), student_profiles(full_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Platformsoversigt og administration</p>
        </div>

        {/* View as buttons */}
        <div className="flex flex-col gap-2 items-end">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Se som bruger</p>
          <div className="flex gap-2">
            <a
              href="/dashboard/student?preview=admin"
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-900 transition-all"
            >
              Se som studerende
            </a>
            <a
              href="/dashboard/company?preview=admin"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
            >
              Se som virksomhed
            </a>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        {[
          { label: "Brugere i alt", value: userCount ?? 0, dark: true },
          { label: "Studerende", value: studentCount ?? 0, dark: false },
          { label: "Virksomheder", value: companyCount ?? 0, dark: false },
          { label: "Jobs", value: jobCount ?? 0, dark: false },
          { label: "Ansøgninger", value: appCount ?? 0, dark: false },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-xl p-5 ${
              s.dark
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-100"
            }`}
          >
            <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${s.dark ? "text-gray-400" : "text-gray-400"}`}>
              {s.label}
            </p>
            <p className={`text-3xl font-black ${s.dark ? "text-white" : "text-gray-900"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Recent Users */}
        <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-sm text-gray-900">Seneste brugere</h2>
            <Link href="/dashboard/admin/users" className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">
              Se alle →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers?.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{u.email}</p>
                  <p className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString("da-DK")}</p>
                </div>
                <RoleBadge role={u.role} />
              </div>
            ))}
            {!recentUsers?.length && (
              <p className="px-5 py-6 text-sm text-gray-400">Ingen brugere endnu.</p>
            )}
          </div>
        </section>

        {/* Pending Applications */}
        <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-sm text-gray-900">Afventende ansøgninger</h2>
            <Link href="/dashboard/admin/applications" className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">
              Se alle →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingApps?.map((a: any) => (
              <div key={a.id} className="px-5 py-3">
                <p className="text-sm font-medium text-gray-800">
                  {a.student_profiles?.full_name || "Studerende"}{" "}
                  <span className="text-gray-400">→</span>{" "}
                  {a.jobs?.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {a.jobs?.company_profiles?.company_name} · {new Date(a.created_at).toLocaleDateString("da-DK")}
                </p>
              </div>
            ))}
            {!pendingApps?.length && (
              <p className="px-5 py-6 text-sm text-gray-400">Ingen afventende ansøgninger.</p>
            )}
          </div>
        </section>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: "/dashboard/admin/users", label: "Brugere & timepriser", desc: "Sæt studerendes timepriser og administrér roller" },
          { href: "/dashboard/admin/jobs", label: "Alle jobs", desc: "Gennemse og administrér jobopslag" },
          { href: "/dashboard/admin/applications", label: "Alle ansøgninger", desc: "Godkend eller afvis ansøgninger" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group block bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-900 hover:shadow-sm transition-all"
          >
            <p className="font-bold text-sm text-gray-900 group-hover:text-gray-900 mb-1">{l.label}</p>
            <p className="text-xs text-gray-400">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin: "bg-gray-900 text-white",
    student: "bg-gray-100 text-gray-700",
    company: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[role] || "bg-gray-100 text-gray-600"}`}>
      {role}
    </span>
  );
}
