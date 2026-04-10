"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PreviewLink from "@/app/dashboard/PreviewLink";

type Profile = {
  full_name: string | null;
  hourly_rate: number | null;
  skills: string[] | null;
  availability: string | null;
};

type AppCounts = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

export default function StudentDashboard() {
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "admin";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [appCounts, setAppCounts] = useState<AppCounts>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [jobCount, setJobCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      const [{ data: prof }, { data: apps }, { data: jobs }] = await Promise.all([
        supabase
          .from("student_profiles")
          .select("full_name, hourly_rate, skills, availability")
          .eq("id", user.id)
          .single(),
        supabase
          .from("applications")
          .select("id, status")
          .eq("student_id", user.id),
        supabase
          .from("jobs")
          .select("id")
          .eq("status", "open"),
      ]);

      setProfile(prof);
      setAppCounts({
        total: apps?.length ?? 0,
        pending: apps?.filter((a) => a.status === "pending").length ?? 0,
        approved: apps?.filter((a) => a.status === "approved").length ?? 0,
        rejected: apps?.filter((a) => a.status === "rejected").length ?? 0,
      });
      setJobCount(jobs?.length ?? 0);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Indlæser…</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-gray-900 mb-1">
        Velkommen tilbage{profile?.full_name ? `, ${profile.full_name}` : ""}!
      </h1>
      <p className="text-gray-500 text-sm mb-8">Dit student dashboard{isPreview ? " (admin preview)" : ""}</p>

      {!profile?.full_name && (
        <div className="mb-6 bg-gray-900 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-gray-300">
            Fuldfør din profil for at blive opdaget af virksomheder.
          </p>
          <PreviewLink
            href="/dashboard/student/profile"
            className="text-sm font-semibold text-white border border-white/30 rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors whitespace-nowrap ml-4"
          >
            Opsæt profil
          </PreviewLink>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Ansøgninger", value: appCounts.total },
          { label: "Afventende", value: appCounts.pending },
          { label: "Godkendt", value: appCounts.approved },
          { label: "Ledige jobs", value: jobCount },
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
            <PreviewLink
              href="/dashboard/student/profile"
              className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
            >
              Rediger
            </PreviewLink>
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
              { href: "/dashboard/student/jobs", label: "Browse ledige jobs", desc: `${jobCount} ledige stillinger` },
              { href: "/dashboard/student/applications", label: "Mine ansøgninger", desc: `${appCounts.total} i alt` },
              { href: "/dashboard/student/profile", label: "Rediger profil", desc: "Opdater dine kompetencer og info" },
            ].map((l) => (
              <PreviewLink
                key={l.href}
                href={l.href}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-gray-900">{l.label}</p>
                  <p className="text-xs text-gray-400">{l.desc}</p>
                </div>
                <span className="text-gray-300 group-hover:text-gray-900">→</span>
              </PreviewLink>
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
