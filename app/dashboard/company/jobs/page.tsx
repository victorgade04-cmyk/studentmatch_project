"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { createJob, getCompanyJobs, toggleJobStatusDirect, updateApplicationStatus } from "../actions";

type Application = {
  id: string;
  status: string;
  cover_letter: string | null;
  created_at: string;
  student_profiles: { full_name: string | null; skills: string[] | null; hourly_rate: number | null } | null;
};

type Job = {
  id: string;
  title: string;
  description: string | null;
  budget: number | null;
  status: string;
  requirements: string[];
  deadline: string | null;
  job_type: string | null;
  location: string | null;
  created_at: string;
  applications: Application[];
};

const STATUS_DA: Record<string, string> = {
  open: "åben",
  closed: "lukket",
  pending: "afventer",
  approved: "godkendt",
  rejected: "afvist",
};

export default function CompanyJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [createState, createAction, creating] = useActionState(
    async (prev: any, fd: FormData) => {
      const res = await createJob(prev, fd);
      if (res.success) { setShowForm(false); fetchJobs(); }
      return res;
    },
    {}
  );

  const fetchJobs = () => {
    getCompanyJobs().then(({ data }) => {
      setJobs((data as unknown as Job[]) || []);
      setLoading(false);
    });
  };

  useEffect(fetchJobs, []);

  if (loading) return <div className="p-8 text-gray-400 text-sm">Indlæser…</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Mine jobs</h1>
          <p className="text-gray-500 text-sm">{jobs.length} jobopslag</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
        >
          {showForm ? "Annuller" : "+ Opret job"}
        </button>
      </div>

      {/* New job form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">Opret nyt jobopslag</h2>
          <form action={createAction} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Jobtitel</label>
                <input
                  name="title"
                  placeholder="Marketing-assistent"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Budget (kr)</label>
                <input
                  name="budget"
                  placeholder="5000"
                  type="number"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Beskrivelse</label>
              <textarea
                name="description"
                placeholder="Beskriv jobbet, arbejdsopgaver og hvad I forventer af kandidaten…"
                rows={5}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Jobtype</label>
                <select
                  name="job_type"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="">Vælg jobtype</option>
                  <option value="Timebasis">Timebasis</option>
                  <option value="Deltid">Deltid</option>
                  <option value="Fuldtid">Fuldtid</option>
                  <option value="Projektbaseret">Projektbaseret</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Lokation</label>
                <input
                  name="location"
                  placeholder="Fx København, Aarhus eller Remote"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ansøgningsfrist</label>
                <input
                  name="deadline"
                  type="date"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <p className="text-xs text-gray-400 mt-1">Valgfrit — ansøgere kan ikke søge efter denne dato.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Krav (kommasepareret)</label>
                <input
                  name="requirements"
                  placeholder="Excel, kommunikation, 2+ års erfaring"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>

            {createState?.error && (
              <p className="text-sm text-red-600">{createState.error}</p>
            )}
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2 rounded-lg bg-gray-900 text-white font-semibold text-sm hover:bg-gray-700 disabled:opacity-60"
            >
              {creating ? "Opretter…" : "Opret job"}
            </button>
          </form>
        </div>
      )}

      {/* Jobs list */}
      <div className="space-y-4">
        {jobs.map((job) => {
          const isExpanded = expanded === job.id;
          const pendingApps = job.applications?.filter((a) => a.status === "pending").length ?? 0;
          return (
            <div key={job.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-gray-900">{job.title}</h3>
                    <StatusBadge status={job.status} />
                    {pendingApps > 0 && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">
                        {pendingApps} afventer
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    Oprettet {new Date(job.created_at).toLocaleDateString("da-DK")}
                    {job.budget && ` · ${job.budget} kr`}
                    {` · ${job.applications?.length ?? 0} ansøgninger`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <form action={toggleJobStatusDirect}>
                    <input type="hidden" name="jobId" value={job.id} />
                    <input type="hidden" name="newStatus" value={job.status === "open" ? "closed" : "open"} />
                    <button
                      type="submit"
                      className="text-xs px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      {job.status === "open" ? "Luk" : "Genåbn"}
                    </button>
                  </form>
                  <Link
                    href={`/dashboard/company/jobs/${job.id}/applicants`}
                    className="text-xs px-3 py-1 rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors font-semibold"
                  >
                    Se ansøgere
                  </Link>
                  <button
                    onClick={() => setExpanded(isExpanded ? null : job.id)}
                    className="text-xs px-3 py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    {isExpanded ? "Skjul" : "Hurtigoversigt"}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-50 p-5">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Ansøgninger ({job.applications?.length ?? 0})
                  </h4>
                  {job.applications?.length ? (
                    <div className="space-y-3">
                      {job.applications.map((app) => (
                        <AppRow key={app.id} app={app} onUpdate={fetchJobs} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Ingen ansøgninger endnu.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {!jobs.length && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">Ingen jobopslag endnu. Klik på &ldquo;+ Opret job&rdquo; for at komme i gang.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AppRow({ app, onUpdate }: { app: Application; onUpdate: () => void }) {
  const [state, action, pending] = useActionState(
    async (prev: any, fd: FormData) => {
      const res = await updateApplicationStatus(prev, fd);
      if (res.success) onUpdate();
      return res;
    },
    {}
  );

  return (
    <div className="border border-gray-100 rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={app.status} />
            <span className="text-xs text-gray-400">
              {new Date(app.created_at).toLocaleDateString("da-DK")}
            </span>
          </div>
          <p className="font-semibold text-sm text-gray-800">
            {app.student_profiles?.full_name || "Kandidat"}
          </p>
          {app.student_profiles?.hourly_rate && (
            <p className="text-xs text-gray-500 mt-0.5">{app.student_profiles.hourly_rate} kr/t</p>
          )}
          {app.student_profiles?.skills?.length ? (
            <div className="flex flex-wrap gap-1 mt-2">
              {app.student_profiles.skills.slice(0, 4).map((s) => (
                <span key={s} className="bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5 rounded font-medium">
                  {s}
                </span>
              ))}
            </div>
          ) : null}
          {app.cover_letter && (
            <details className="mt-2">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                Ansøgningstekst
              </summary>
              <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded line-clamp-4">
                {app.cover_letter}
              </p>
            </details>
          )}
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          {(["approved", "rejected"] as const).map((s) => (
            <form key={s} action={action}>
              <input type="hidden" name="appId" value={app.id} />
              <input type="hidden" name="status" value={s} />
              <button
                type="submit"
                disabled={pending || app.status === s}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium disabled:opacity-40 ${
                  s === "approved"
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-red-100 text-red-700 hover:bg-red-200"
                }`}
              >
                {s === "approved" ? "Godkend" : "Afvis"}
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "bg-green-100 text-green-700",
    closed: "bg-gray-100 text-gray-600",
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    open: "åben", closed: "lukket", pending: "afventer", approved: "godkendt", rejected: "afvist",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {labels[status] || status}
    </span>
  );
}
