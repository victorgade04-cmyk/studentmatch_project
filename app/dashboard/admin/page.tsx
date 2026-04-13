"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Stats {
  students: number;
  companies: number;
  newSignups7d: number;
  messagesSent: number;
  docsUploaded: number;
  activeJobs: number;
  totalApplications: number;
  pendingApplications: number;
}

interface DayBucket {
  date: string;   // "YYYY-MM-DD"
  label: string;  // "13/4"
  count: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [studentChart, setStudentChart] = useState<DayBucket[]>([]);
  const [companyChart, setCompanyChart] = useState<DayBucket[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [pendingApps, setPendingApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const now = new Date();

    const ago = (days: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - days);
      return d.toISOString();
    };

    Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "student"),
      supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "company"),
      supabase.from("users").select("*", { count: "exact", head: true }).gte("created_at", ago(7)),
      supabase.from("messages").select("*", { count: "exact", head: true }),
      supabase.from("student_documents").select("*", { count: "exact", head: true }),
      supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("applications").select("*", { count: "exact", head: true }),
      supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
      // Raw rows for chart grouping — only created_at needed
      supabase.from("users").select("created_at").gte("created_at", ago(14)),
      supabase.from("users").select("created_at").eq("role", "company").gte("created_at", ago(14)),
      supabase.from("users").select("id, email, role, created_at").order("created_at", { ascending: false }).limit(8),
      supabase
        .from("applications")
        .select("id, status, created_at, jobs(title, company_profiles(company_name)), student_profiles(full_name)")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5),
    ]).then(([
      { count: studentCount },
      { count: companyCount },
      { count: newSignups },
      { count: msgCount },
      { count: docCount },
      { count: activeJobCount },
      { count: totalAppCount },
      { count: pendingAppCount },
      { data: rawSignups },
      { data: rawCompanySignups },
      { data: users },
      { data: apps },
    ]) => {
      setStats({
        students: studentCount ?? 0,
        companies: companyCount ?? 0,
        newSignups7d: newSignups ?? 0,
        messagesSent: msgCount ?? 0,
        docsUploaded: docCount ?? 0,
        activeJobs: activeJobCount ?? 0,
        totalApplications: totalAppCount ?? 0,
        pendingApplications: pendingAppCount ?? 0,
      });

      // Helper: build 14-day buckets from a raw created_at list
      const buildBuckets = (rows: { created_at: string }[] | null): DayBucket[] => {
        const buckets: DayBucket[] = [];
        for (let i = 13; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const date = d.toISOString().slice(0, 10);
          buckets.push({ date, label: `${d.getDate()}/${d.getMonth() + 1}`, count: 0 });
        }
        const idx: Record<string, number> = Object.fromEntries(buckets.map((b, i) => [b.date, i]));
        rows?.forEach(({ created_at }) => {
          const key = (created_at as string).slice(0, 10);
          if (key in idx) buckets[idx[key]].count++;
        });
        return buckets;
      };

      setStudentChart(buildBuckets(rawSignups));
      setCompanyChart(buildBuckets(rawCompanySignups));
      setRecentUsers((users as any[]) || []);
      setPendingApps((apps as any[]) || []);
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
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Platformsoversigt og administration</p>
        </div>
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

      {/* ── STUDERENDE ── */}
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Studerende</p>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <StatCard label="Studerende i alt" value={stats!.students} dark />
        <StatCard label="Nye (7 dage)" value={stats!.newSignups7d} />
        <StatCard label="Beskeder sendt" value={stats!.messagesSent} />
        <StatCard label="Dokumenter uploadet" value={stats!.docsUploaded} />
        <StatCard label="Virksomheder i alt" value={stats!.companies} />
      </div>

      <BarChart
        title="Nye tilmeldinger"
        subtitle="Alle roller — pr. dag, seneste 14 dage"
        buckets={studentChart}
      />

      {/* ── VIRKSOMHEDER ── */}
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 mt-8">Virksomheder</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <StatCard label="Aktive jobopslag" value={stats!.activeJobs} dark />
        <StatCard label="Ansøgninger i alt" value={stats!.totalApplications} />
        <StatCard label="Afventende ansøgninger" value={stats!.pendingApplications} />
      </div>

      <BarChart
        title="Nye virksomheder"
        subtitle="Rolle = company — pr. dag, seneste 14 dage"
        buckets={companyChart}
      />

      {/* ── RECENT USERS + PENDING APPS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-sm text-gray-900">Seneste brugere</h2>
            <Link href="/dashboard/admin/users" className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">
              Se alle →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{u.email}</p>
                  <p className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString("da-DK")}</p>
                </div>
                <RoleBadge role={u.role} />
              </div>
            ))}
            {!recentUsers.length && (
              <p className="px-5 py-6 text-sm text-gray-400">Ingen brugere endnu.</p>
            )}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-sm text-gray-900">Afventende ansøgninger</h2>
            <Link href="/dashboard/admin/applications" className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">
              Se alle →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingApps.map((a: any) => (
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
            {!pendingApps.length && (
              <p className="px-5 py-6 text-sm text-gray-400">Ingen afventende ansøgninger.</p>
            )}
          </div>
        </section>
      </div>

      {/* ── QUICK LINKS ── */}
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
            <p className="font-bold text-sm text-gray-900 mb-1">{l.label}</p>
            <p className="text-xs text-gray-400">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function BarChart({ title, subtitle, buckets }: { title: string; subtitle: string; buckets: DayBucket[] }) {
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 mb-5">
      <p className="text-sm font-bold text-gray-900 mb-1">{title}</p>
      <p className="text-xs text-gray-400 mb-5">{subtitle}</p>
      <div className="flex items-end gap-1.5 h-28">
        {buckets.map((b) => {
          const heightPct = (b.count / maxCount) * 100;
          const isEmpty = b.count === 0;
          return (
            <div key={b.date} className="flex-1 flex flex-col items-center gap-1 group relative min-w-0">
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {b.count}
              </div>
              <div className="w-full flex items-end justify-center" style={{ height: "100%" }}>
                <div
                  className={`w-full rounded-t-sm transition-all ${isEmpty ? "bg-gray-100" : "bg-gray-900"}`}
                  style={{ height: isEmpty ? "4px" : `${Math.max(heightPct, 6)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-2">
        {buckets.map((b) => (
          <div key={b.date} className="flex-1 text-center text-[10px] text-gray-400 font-medium truncate min-w-0">
            {b.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, dark }: { label: string; value: number; dark?: boolean }) {
  return (
    <div className={`rounded-xl p-5 ${dark ? "bg-gray-900 text-white" : "bg-white border border-gray-100"}`}>
      <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">{label}</p>
      <p className={`text-3xl font-black ${dark ? "text-white" : "text-gray-900"}`}>{value}</p>
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
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[role] ?? "bg-gray-100 text-gray-600"}`}>
      {role}
    </span>
  );
}
