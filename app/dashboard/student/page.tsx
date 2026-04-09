import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function StudentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: applications }, { data: jobs }] =
    await Promise.all([
      supabase
        .from("student_profiles")
        .select("full_name, hourly_rate, skills, availability")
        .eq("id", user!.id)
        .single(),
      supabase
        .from("applications")
        .select("id, status")
        .eq("student_id", user!.id),
      supabase
        .from("jobs")
        .select("id")
        .eq("status", "open"),
    ]);

  const appCounts = {
    total: applications?.length ?? 0,
    pending: applications?.filter((a) => a.status === "pending").length ?? 0,
    approved: applications?.filter((a) => a.status === "approved").length ?? 0,
    rejected: applications?.filter((a) => a.status === "rejected").length ?? 0,
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}!
      </h1>
      <p className="text-gray-500 text-sm mb-8">Your student dashboard</p>

      {/* Profile completeness prompt */}
      {!profile?.full_name && (
        <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-indigo-700">
            Complete your profile to get noticed by companies.
          </p>
          <Link
            href="/dashboard/student/profile"
            className="text-sm font-semibold text-indigo-600 hover:underline"
          >
            Set up profile →
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Applications", value: appCounts.total, color: "text-gray-900" },
          { label: "Pending", value: appCounts.pending, color: "text-yellow-600" },
          { label: "Approved", value: appCounts.approved, color: "text-green-600" },
          { label: "Open Jobs", value: jobs?.length ?? 0, color: "text-indigo-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Profile summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">My Profile</h2>
            <Link href="/dashboard/student/profile" className="text-xs text-indigo-600 hover:underline">
              Edit
            </Link>
          </div>
          <dl className="space-y-2 text-sm">
            <Row label="Name" value={profile?.full_name} />
            <Row label="Availability" value={profile?.availability} />
            <Row
              label="Hourly Rate"
              value={profile?.hourly_rate ? `${profile.hourly_rate} kr/hr (set by admin)` : "Not set yet"}
            />
            <div>
              <dt className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Skills</dt>
              <dd className="flex flex-wrap gap-1.5">
                {profile?.skills?.length ? (
                  profile.skills.map((s: string) => (
                    <span key={s} className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400">No skills listed</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            {[
              { href: "/dashboard/student/jobs", label: "Browse Open Jobs", desc: `${jobs?.length ?? 0} open positions` },
              { href: "/dashboard/student/applications", label: "My Applications", desc: `${appCounts.total} total` },
              { href: "/dashboard/student/profile", label: "Edit Profile", desc: "Update your skills and info" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-600">{l.label}</p>
                  <p className="text-xs text-gray-400">{l.desc}</p>
                </div>
                <span className="text-gray-300 group-hover:text-indigo-400">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</dt>
      <dd className="text-gray-800 mt-0.5">{value || <span className="text-gray-400">Not set</span>}</dd>
    </div>
  );
}
