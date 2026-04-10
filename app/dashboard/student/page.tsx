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
      <h1 className="text-2xl font-black text-gray-900 mb-1">
        Velkommen tilbage{profile?.full_name ? `, ${profile.full_name}` : ""}!
      </h1>
      <p className="text-gray-500 text-sm mb-8">Dit student dashboard</p>

      {!profile?.full_name && (
        <div className="mb-6 bg-gray-900 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-gray-300">
            Fuldfør din profil for at blive opdaget af virksomheder.
          </p>
          <Link
            href="/dashboard/student/profile"
            className="text-sm font-semibold text-white border border-white/30 rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors whitespace-nowrap ml-4"
          >
            Opsæt profil
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Ansøgninger", value: appCounts.total },
          { label: "Afventende", value: appCounts.pending },
          { label: "Godkendt", value: appCounts.approved },
          { label: "Ledige jobs", value: jobs?.length ?? 0 },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{s.label}</p>
            <p className="text-3xl font-black text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Min profil</h2>
            <Link href="/dashboard/student/profile" className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">
              Rediger
            </Link>
          </div>
          <dl className="space-y-3 text-sm">
            <Row label="Navn" value={profile?.full_name} />
            <Row label="Tilgængelighed" value={profile?.availability} />
            <Row
              label="Timepris"
              value={profile?.hourly_rate ? `${profile.hourly_rate} kr/t (sat af admin)` : "Ikke sat endnu"}
            />
            <div>
              <dt className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Kompetencer</dt>
              <dd className="flex flex-wrap gap-1.5">
                {profile?.skills?.length ? (
                  profile.skills.map((s: string) => (
                    <span key={s} className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full font-medium">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400">Ingen kompetencer tilføjet</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Hurtige handlinger</h2>
          <div className="space-y-2">
            {[
              { href: "/dashboard/student/jobs", label: "Browse ledige jobs", desc: `${jobs?.length ?? 0} ledige stillinger` },
              { href: "/dashboard/student/applications", label: "Mine ansøgninger", desc: `${appCounts.total} i alt` },
              { href: "/dashboard/student/profile", label: "Rediger profil", desc: "Opdater dine kompetencer og info" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-gray-900">{l.label}</p>
                  <p className="text-xs text-gray-400">{l.desc}</p>
                </div>
                <span className="text-gray-300 group-hover:text-gray-900">→</span>
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
      <dt className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{label}</dt>
      <dd className="text-gray-800 mt-0.5">{value || <span className="text-gray-400">Ikke sat</span>}</dd>
    </div>
  );
}