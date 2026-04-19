"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Job = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  job_type: string | null;
  deadline: string | null;
  created_at: string;
  company_profiles: { company_name: string | null } | null;
};

type Tab = "opgaver" | "jobportal";

const OPGAVER_TYPES = ["Alle", "Timebasis", "Projektbaseret"] as const;
const JOBPORTAL_TYPES = ["Alle", "Fuldtid", "Deltid", "Studiejob"] as const;

const OPGAVER_JOB_TYPES = new Set(["Timebasis", "Projektbaseret"]);
const JOBPORTAL_JOB_TYPES = new Set(["Fuldtid", "Deltid", "Studiejob"]);

function formatDeadline(deadline: string): string {
  return new Date(deadline).toLocaleDateString("da-DK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function JobTypeBadge({ type }: { type: string | null }) {
  if (!type) return null;
  const colors: Record<string, string> = {
    Timebasis: "bg-sky-100 text-sky-700",
    Deltid: "bg-violet-100 text-violet-700",
    Fuldtid: "bg-emerald-100 text-emerald-700",
    Projektbaseret: "bg-orange-100 text-orange-700",
    Studiejob: "bg-pink-100 text-pink-700",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[type] ?? "bg-gray-100 text-gray-600"}`}>
      {type}
    </span>
  );
}

function JobCard({ job }: { job: Job }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-gray-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h2 className="font-bold text-gray-900 text-lg leading-tight">{job.title}</h2>
            <JobTypeBadge type={job.job_type} />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-3">
            {job.company_profiles?.company_name && (
              <span className="font-medium text-gray-600">{job.company_profiles.company_name}</span>
            )}
            {job.location && (
              <>
                <span>·</span>
                <span>{job.location}</span>
              </>
            )}
            {job.deadline && (
              <>
                <span>·</span>
                <span>Frist: {formatDeadline(job.deadline)}</span>
              </>
            )}
          </div>
          {job.description && (
            <p className="text-sm text-gray-500 leading-relaxed">
              {job.description.length > 120
                ? job.description.slice(0, 120).trimEnd() + "…"
                : job.description}
            </p>
          )}
        </div>
        <Link
          href={`/jobs/${job.id}`}
          className="flex-shrink-0 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
        >
          Se opslag
        </Link>
      </div>
    </div>
  );
}

function JobSection({
  jobs,
  loading,
  types,
  search,
  onSearchChange,
  activeType,
  onTypeChange,
  emptyLabel,
  searchPlaceholder,
}: {
  jobs: Job[];
  loading: boolean;
  types: readonly string[];
  search: string;
  onSearchChange: (v: string) => void;
  activeType: string;
  onTypeChange: (v: string) => void;
  emptyLabel: string;
  searchPlaceholder: string;
}) {
  const filtered = jobs.filter((job) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      job.title.toLowerCase().includes(q) ||
      (job.description ?? "").toLowerCase().includes(q) ||
      (job.location ?? "").toLowerCase().includes(q);
    const matchesType = activeType === "Alle" || job.job_type === activeType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Search + filters */}
      <div className="space-y-3">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder-gray-400"
        />
        <div className="flex flex-wrap gap-2">
          {types.map((type) => (
            <button
              key={type}
              onClick={() => onTypeChange(type)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                activeType === type
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Job count */}
      {!loading && (
        <p className="text-xs text-gray-400">
          {filtered.length} {filtered.length === 1 ? "opslag" : "opslag"}
        </p>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Indlæser opslag…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm font-medium">{emptyLabel}</p>
          {(search || activeType !== "Alle") && (
            <button
              onClick={() => { onSearchChange(""); onTypeChange("Alle"); }}
              className="mt-3 text-xs text-gray-500 underline hover:text-gray-900"
            >
              Nulstil filter
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((job) => <JobCard key={job.id} job={job} />)}
        </div>
      )}
    </div>
  );
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("opgaver");
  const [menuOpen, setMenuOpen] = useState(false);
  const [dashboardLink, setDashboardLink] = useState<{ href: string; label: string } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Per-tab search and filter state
  const [opgaverSearch, setOggaverSearch] = useState("");
  const [opgaverType, setOgaverType] = useState("Alle");
  const [jobportalSearch, setJobportalSearch] = useState("");
  const [jobportalType, setJobportalType] = useState("Alle");

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setIsLoggedIn(true);
      const role = user.user_metadata?.role as string | undefined;
      if (role === "admin") setDashboardLink({ href: "/dashboard/admin", label: "Admin" });
      else if (role === "company") setDashboardLink({ href: "/dashboard/company", label: "Mit dashboard" });
      else setDashboardLink({ href: "/dashboard/student/profile", label: "Min profil" });
    });

    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from("jobs")
      .select("id, title, description, location, job_type, deadline, created_at, company_profiles(company_name)")
      .eq("status", "open")
      .or(`deadline.is.null,deadline.gte.${today}`)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setJobs((data as unknown as Job[]) || []);
        setLoading(false);
      });
  }, []);

  const opgaverJobs = jobs.filter((j) => j.job_type && OPGAVER_JOB_TYPES.has(j.job_type));
  const jobportalJobs = jobs.filter((j) => j.job_type && JOBPORTAL_JOB_TYPES.has(j.job_type));

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-5 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <span className="text-white text-xs font-bold">SM</span>
            </div>
            <span className="font-bold text-gray-900 text-base">StudentMatch</span>
          </Link>

          <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-gray-500">
            <Link href="/#ydelser" className="hover:text-gray-900 transition-colors">Ydelser</Link>
            <Link href="/#fordele" className="hover:text-gray-900 transition-colors">Fordele</Link>
            <Link href="/jobs" className="text-gray-900 font-semibold">Jobportal</Link>
            <Link href="/#how" className="hover:text-gray-900 transition-colors">Sådan virker det</Link>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {dashboardLink ? (
              <Link
                href={dashboardLink.href}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
              >
                {dashboardLink.label}
              </Link>
            ) : !isLoggedIn && (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5">
                  Log ind
                </Link>
                <Link href="/login" className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors">
                  Opret konto
                </Link>
              </>
            )}
          </div>

          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div className="w-5 h-0.5 bg-gray-900 mb-1" />
            <div className="w-5 h-0.5 bg-gray-900 mb-1" />
            <div className="w-5 h-0.5 bg-gray-900" />
          </button>
        </div>

        {menuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white px-5 py-4 space-y-3">
            {[
              { label: "Ydelser", href: "/#ydelser" },
              { label: "Fordele", href: "/#fordele" },
              { label: "Jobportal", href: "/jobs" },
              { label: "Sådan virker det", href: "/#how" },
            ].map((item) => (
              <Link key={item.href} href={item.href}
                className="block text-sm font-medium text-gray-600 hover:text-gray-900 py-1"
                onClick={() => setMenuOpen(false)}>
                {item.label}
              </Link>
            ))}
            <div className="flex gap-3 pt-2">
              {dashboardLink ? (
                <Link href={dashboardLink.href} className="text-sm font-semibold bg-gray-900 text-white rounded-lg px-4 py-2 hover:bg-gray-700 transition-colors">
                  {dashboardLink.label}
                </Link>
              ) : !isLoggedIn && (
                <>
                  <Link href="/login" className="text-sm font-medium text-gray-600 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">Log ind</Link>
                  <Link href="/login" className="text-sm font-semibold bg-gray-900 text-white rounded-lg px-4 py-2 hover:bg-gray-700 transition-colors">Opret konto</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ── PAGE CONTENT ── */}
      <main className="pt-28 pb-24 px-5">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Opslag</p>
            <h1 className="text-4xl font-black text-gray-900 mb-2">Find din næste mulighed</h1>
            <p className="text-gray-500 text-sm">
              {loading ? "Indlæser…" : `${jobs.length} ${jobs.length === 1 ? "opslag" : "opslag"} tilgængelige`}
            </p>
          </div>

          {/* ── TAB NAVIGATION ── */}
          <div className="flex gap-1 mb-8 border-b border-gray-100">
            <button
              onClick={() => setActiveTab("opgaver")}
              className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                activeTab === "opgaver"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
            >
              Opgaver &amp; Projekter
              {!loading && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === "opgaver" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {opgaverJobs.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("jobportal")}
              className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                activeTab === "jobportal"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
            >
              Jobportal
              {!loading && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === "jobportal" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {jobportalJobs.length}
                </span>
              )}
            </button>
          </div>

          {/* ── TAB CONTENT ── */}
          {activeTab === "opgaver" ? (
            <JobSection
              jobs={opgaverJobs}
              loading={loading}
              types={OPGAVER_TYPES}
              search={opgaverSearch}
              onSearchChange={setOggaverSearch}
              activeType={opgaverType}
              onTypeChange={setOgaverType}
              searchPlaceholder="Søg på opgave, beskrivelse eller lokation…"
              emptyLabel="Ingen opgaver eller projekter fundet"
            />
          ) : (
            <JobSection
              jobs={jobportalJobs}
              loading={loading}
              types={JOBPORTAL_TYPES}
              search={jobportalSearch}
              onSearchChange={setJobportalSearch}
              activeType={jobportalType}
              onTypeChange={setJobportalType}
              searchPlaceholder="Søg på jobtitel, beskrivelse eller lokation…"
              emptyLabel="Ingen jobopslag fundet"
            />
          )}
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100 py-8 px-5">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} StudentMatch. Alle rettigheder forbeholdes.</p>
          <div className="flex gap-5">
            <Link href="/" className="hover:text-gray-900 transition-colors">Forside</Link>
            <Link href="/login" className="hover:text-gray-900 transition-colors">Log ind</Link>
            <Link href="/login" className="hover:text-gray-900 transition-colors">Opret konto</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
