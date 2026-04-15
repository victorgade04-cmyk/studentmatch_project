"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Job = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  job_type: string | null;
  deadline: string | null;
  budget: number | null;
  requirements: string[];
  created_at: string;
  company_profiles: { company_name: string | null; description: string | null; website: string | null } | null;
};

type ApplyState = "idle" | "submitting" | "success" | "error";

const JOB_TYPE_COLORS: Record<string, string> = {
  Timebasis: "bg-sky-100 text-sky-700",
  Deltid: "bg-violet-100 text-violet-700",
  Fuldtid: "bg-emerald-100 text-emerald-700",
  Projektbaseret: "bg-orange-100 text-orange-700",
};

function formatDeadline(deadline: string): string {
  return new Date(deadline).toLocaleDateString("da-DK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isDeadlinePassed(deadline: string | null): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date(new Date().toDateString());
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [job, setJob] = useState<Job | null | "not-found">(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [applyState, setApplyState] = useState<ApplyState>("idle");
  const [applyError, setApplyError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dashboardLink, setDashboardLink] = useState<{ href: string; label: string } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Fetch job
    supabase
      .from("jobs")
      .select("id, title, description, location, job_type, deadline, budget, requirements, created_at, company_profiles(company_name, description, website)")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setJob(data ? (data as unknown as Job) : "not-found");
      });

    // Auth + existing application check
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setIsLoggedIn(true);
      setUserId(user.id);
      const role = user.user_metadata?.role as string | undefined;
      setUserRole(role ?? null);

      if (role === "admin") setDashboardLink({ href: "/dashboard/admin", label: "Admin" });
      else if (role === "company") setDashboardLink({ href: "/dashboard/company", label: "Mit dashboard" });
      else setDashboardLink({ href: "/dashboard/student/profile", label: "Min profil" });

      if (role === "student") {
        const { data: existing } = await supabase
          .from("applications")
          .select("id")
          .eq("job_id", id)
          .eq("student_id", user.id)
          .maybeSingle();
        setHasApplied(!!existing);
      }
    });
  }, [id]);

  async function handleApply() {
    if (!userId) return;
    setApplyState("submitting");
    setApplyError(null);

    const supabase = createClient();
    const { error } = await supabase.from("applications").insert({
      job_id: id,
      student_id: userId,
      cover_letter: coverLetter.trim() || null,
    });

    if (error) {
      if (error.code === "23505") {
        setHasApplied(true);
        setApplyState("success");
      } else {
        setApplyError(error.message);
        setApplyState("error");
      }
    } else {
      setHasApplied(true);
      setApplyState("success");
    }
  }

  const loading = job === null;
  const notFound = job === "not-found";
  const jobData = !loading && !notFound ? (job as Job) : null;
  const deadlinePassed = jobData ? isDeadlinePassed(jobData.deadline) : false;

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
              <Link href={dashboardLink.href} className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors">
                {dashboardLink.label}
              </Link>
            ) : !isLoggedIn && (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5">Log ind</Link>
                <Link href="/login" className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors">Opret konto</Link>
              </>
            )}
          </div>

          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
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
              <Link key={item.href} href={item.href} className="block text-sm font-medium text-gray-600 hover:text-gray-900 py-1" onClick={() => setMenuOpen(false)}>
                {item.label}
              </Link>
            ))}
            <div className="flex gap-3 pt-2">
              {dashboardLink ? (
                <Link href={dashboardLink.href} className="text-sm font-semibold bg-gray-900 text-white rounded-lg px-4 py-2 hover:bg-gray-700 transition-colors">{dashboardLink.label}</Link>
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

      {/* ── CONTENT ── */}
      <main className="pt-24 pb-24 px-5">
        <div className="max-w-3xl mx-auto">
          {/* Back link */}
          <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-900 transition-colors mb-8">
            ← Tilbage til jobportal
          </Link>

          {/* Loading */}
          {loading && (
            <div className="text-center py-24 text-gray-400 text-sm">Indlæser job…</div>
          )}

          {/* Not found */}
          {notFound && (
            <div className="text-center py-24">
              <p className="text-lg font-bold text-gray-900 mb-2">Job ikke fundet</p>
              <p className="text-sm text-gray-400 mb-6">Dette job eksisterer ikke eller er blevet fjernet.</p>
              <Link href="/jobs" className="inline-flex items-center gap-2 bg-gray-900 text-white rounded-xl px-6 py-3 text-sm font-bold hover:bg-gray-700 transition-colors">
                Se alle jobs
              </Link>
            </div>
          )}

          {/* Job detail */}
          {jobData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main column */}
              <div className="lg:col-span-2 space-y-8">
                {/* Header */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {jobData.job_type && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${JOB_TYPE_COLORS[jobData.job_type] ?? "bg-gray-100 text-gray-600"}`}>
                        {jobData.job_type}
                      </span>
                    )}
                    {deadlinePassed && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                        Frist udløbet
                      </span>
                    )}
                  </div>

                  <h1 className="text-3xl font-black text-gray-900 mb-3">{jobData.title}</h1>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    {jobData.company_profiles?.company_name && (
                      <span className="font-semibold text-gray-800">{jobData.company_profiles.company_name}</span>
                    )}
                    {jobData.location && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span>{jobData.location}</span>
                      </>
                    )}
                    {jobData.deadline && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span className={deadlinePassed ? "text-red-500 font-medium" : ""}>
                          Ansøgningsfrist: {formatDeadline(jobData.deadline)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Description */}
                {jobData.description && (
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Beskrivelse</h2>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{jobData.description}</p>
                  </div>
                )}

                {/* Requirements */}
                {jobData.requirements?.length > 0 && (
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Krav</h2>
                    <ul className="space-y-2">
                      {jobData.requirements.map((req) => (
                        <li key={req} className="flex items-start gap-2.5 text-sm text-gray-700">
                          <span className="mt-1 w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-xs flex-shrink-0">✓</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Company info */}
                {jobData.company_profiles?.description && (
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Om virksomheden</h2>
                    <p className="text-gray-700 leading-relaxed text-sm">{jobData.company_profiles.description}</p>
                    {jobData.company_profiles.website && (
                      <a
                        href={jobData.company_profiles.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-3 text-sm font-semibold text-gray-900 hover:underline"
                      >
                        Besøg hjemmeside →
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar — apply card */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                  {jobData.budget && (
                    <div className="mb-5 pb-5 border-b border-gray-100">
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Budget</p>
                      <p className="text-2xl font-black text-gray-900">{jobData.budget.toLocaleString("da-DK")} kr</p>
                    </div>
                  )}

                  {/* State: deadline passed */}
                  {deadlinePassed && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                      <p className="text-sm font-semibold text-gray-500">Ansøgningsfristen er udløbet</p>
                    </div>
                  )}

                  {/* State: not logged in */}
                  {!deadlinePassed && !isLoggedIn && (
                    <div className="space-y-3">
                      <Link
                        href="/login"
                        className="block text-center w-full px-5 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-700 transition-colors"
                      >
                        Ansøg nu
                      </Link>
                      <p className="text-xs text-gray-400 text-center">Log ind for at ansøge</p>
                    </div>
                  )}

                  {/* State: logged in as non-student (company/admin) */}
                  {!deadlinePassed && isLoggedIn && userRole !== "student" && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                      <p className="text-sm font-semibold text-gray-500">Kun arbejdssøgende kan ansøge</p>
                    </div>
                  )}

                  {/* State: already applied */}
                  {!deadlinePassed && isLoggedIn && userRole === "student" && hasApplied && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                      <p className="text-sm font-semibold text-green-700">Du har allerede ansøgt</p>
                    </div>
                  )}

                  {/* State: success just submitted */}
                  {applyState === "success" && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center mt-3">
                      <p className="text-sm font-semibold text-green-700">Ansøgning sendt!</p>
                    </div>
                  )}

                  {/* State: can apply */}
                  {!deadlinePassed && isLoggedIn && userRole === "student" && !hasApplied && applyState !== "success" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Ansøgningstekst <span className="text-gray-400 font-normal">(valgfrit)</span>
                        </label>
                        <textarea
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          rows={5}
                          placeholder="Fortæl virksomheden hvorfor du er det rette valg…"
                          className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                        />
                      </div>

                      {applyState === "error" && applyError && (
                        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                          {applyError}
                        </p>
                      )}

                      <button
                        onClick={handleApply}
                        disabled={applyState === "submitting"}
                        className="w-full px-5 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-700 disabled:opacity-60 transition-colors"
                      >
                        {applyState === "submitting" ? "Sender…" : "Ansøg nu"}
                      </button>
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-4 text-center">
                    Oprettet {new Date(jobData.created_at).toLocaleDateString("da-DK")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100 py-8 px-5">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} StudentMatch. Alle rettigheder forbeholdes.</p>
          <div className="flex gap-5">
            <Link href="/jobs" className="hover:text-gray-900 transition-colors">Jobportal</Link>
            <Link href="/login" className="hover:text-gray-900 transition-colors">Log ind</Link>
            <Link href="/login" className="hover:text-gray-900 transition-colors">Opret konto</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
