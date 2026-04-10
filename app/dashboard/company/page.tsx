"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PreviewLink from "@/app/dashboard/PreviewLink";

type Profile = { company_name: string | null; description: string | null };
type Job = { id: string; status: string };
type App = { id: string; status: string };

export default function CompanyDashboard() {
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "admin";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      const [{ data: prof }, { data: j }, { data: a }] = await Promise.all([
        supabase
          .from("company_profiles")
          .select("company_name, description")
          .eq("id", user.id)
          .single(),
        supabase
          .from("jobs")
          .select("id, status")
          .eq("company_id", user.id),
        supabase
          .from("applications")
          .select("id, status, jobs!inner(company_id)")
          .eq("jobs.company_id", user.id),
      ]);

      setProfile(prof);
      setJobs((j as Job[]) || []);
      setApps((a as App[]) || []);
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

  const openJobs = jobs.filter((j) => j.status === "open").length;
  const pendingApps = apps.filter((a) => a.status === "pending").length;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {profile?.company_name || "Company Dashboard"}
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        Manage jobs and find students{isPreview ? " (admin preview)" : ""}
      </p>

      {!profile?.company_name && (
        <div className="mb-6 bg-gray-900 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-gray-300">Complete your company profile to attract students.</p>
          <PreviewLink
            href="/dashboard/company/profile"
            className="text-sm font-semibold text-white border border-white/30 rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors whitespace-nowrap ml-4"
          >
            Set up profile
          </PreviewLink>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Jobs", value: jobs.length, color: "text-gray-900" },
          { label: "Open Jobs", value: openJobs, color: "text-green-600" },
          { label: "Total Applications", value: apps.length, color: "text-gray-900" },
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
          <PreviewLink
            key={l.href}
            href={l.href}
            className="block bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-900 hover:shadow-sm transition group"
          >
            <p className="font-semibold text-sm text-gray-800 group-hover:text-gray-900">{l.label}</p>
            <p className="text-xs text-gray-400 mt-1">{l.desc}</p>
          </PreviewLink>
        ))}
      </div>
    </div>
  );
}
