"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  createJob,
  getCompanyJobs,
  toggleJobStatusDirect,
  updateApplicationStatus,
  updateJob,
} from "../actions";

type Application = {
  id: string;
  status: string;
  cover_letter: string | null;
  created_at: string;
  student_id: string | null;
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDatetimeLocal(deadline: string | null): string {
  if (!deadline) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return `${deadline}T23:59`;
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const HH = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${MM}-${dd}T${HH}:${mm}`;
}

function calcDeadlineLabel(deadline: string | null): string {
  if (!deadline) return "Ingen frist sat";
  const now = new Date();
  const dl = new Date(deadline);
  const diffMs = dl.getTime() - now.getTime();
  if (diffMs < 0) return "Udløbet";
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `Udløber om ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    const hh = dl.getHours().toString().padStart(2, "0");
    const mm = dl.getMinutes().toString().padStart(2, "0");
    return `Udløber i dag kl. ${hh}:${mm}`;
  }
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays === 1 ? "1 dag tilbage" : `${diffDays} dage tilbage`;
}

// Rendered client-only to avoid SSR/hydration mismatch from new Date()
function DeadlineLabel({ deadline }: { deadline: string | null }) {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    setLabel(calcDeadlineLabel(deadline));
  }, [deadline]);
  if (label === null) return null;
  const expired = label === "Udløbet";
  const none = label === "Ingen frist sat";
  return (
    <span className={`text-xs font-medium ${expired ? "text-red-500" : none ? "text-gray-300" : "text-blue-600"}`}>
      {label}
    </span>
  );
}

// ── Shared form fields ────────────────────────────────────────────────────────

function JobFormFields({ job }: { job?: Job }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Jobtitel</label>
          <input
            name="title"
            defaultValue={job?.title ?? ""}
            placeholder="Marketing-assistent"
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Budget (kr)</label>
          <input
            name="budget"
            defaultValue={job?.budget ?? ""}
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
          defaultValue={job?.description ?? ""}
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
            defaultValue={job?.job_type ?? ""}
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
            defaultValue={job?.location ?? ""}
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
            type="datetime-local"
            defaultValue={toDatetimeLocal(job?.deadline ?? null)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <p className="text-xs text-gray-400 mt-1">Valgfrit — ansøgere kan ikke søge efter dette tidspunkt.</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Krav (kommasepareret)</label>
          <input
            name="requirements"
            defaultValue={job?.requirements?.join(", ") ?? ""}
            placeholder="Excel, kommunikation, 2+ års erfaring"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </div>
    </>
  );
}

// ── Edit modal (portalled to document.body to escape layout overflow) ─────────

function EditJobModal({ job, onClose, onSaved }: { job: Job; onClose: () => void; onSaved: () => void }) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [state, action, saving] = useActionState(
    async (prev: any, fd: FormData) => {
      const res = await updateJob(prev, fd);
      if (res.success) { onSaved(); onClose(); }
      return res;
    },
    {}
  );

  const content = (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/50 px-4 py-10 overflow-y-auto"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-gray-900">Rediger jobopslag</h2>
            <p className="text-xs text-gray-400 mt-0.5">{job.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        <form action={action} className="space-y-4">
          <input type="hidden" name="jobId" value={job.id} />
          <JobFormFields job={job} />

          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {state.error}
            </p>
          )}
          {state?.success && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              {state.success}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annuller
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Gemmer…" : "Gem ændringer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CompanyJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const [createState, createAction, creating] = useActionState(
    async (prev: any, fd: FormData) => {
      const res = await createJob(prev, fd);
      if (res.success) { setShowForm(false); fetchJobs(); }
      return res;
    },
    {}
  );

  function fetchJobs() {
    getCompanyJobs().then(({ data }) => {
      setJobs((data as unknown as Job[]) || []);
      setLoading(false);
    });
  }

  useEffect(() => { fetchJobs(); }, []);

  if (loading) return <div className="p-8 text-gray-400 text-sm">Indlæser…</div>;

  return (
    <>
      {editingJob && (
        <EditJobModal
          job={editingJob}
          onClose={() => setEditingJob(null)}
          onSaved={fetchJobs}
        />
      )}

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

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <h2 className="font-bold text-gray-900 mb-4">Opret nyt jobopslag</h2>
            <form action={createAction} className="space-y-4">
              <JobFormFields />
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

        <div className="space-y-4">
          {jobs.map((job) => {
            const isExpanded = expanded === job.id;
            const pendingApps = job.applications?.filter((a) => a.status === "pending").length ?? 0;
            return (
              <div key={job.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="p-5 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setEditingJob(job)}
                        className="font-bold text-gray-900 hover:underline text-left"
                      >
                        {job.title}
                      </button>
                      <StatusBadge status={job.status} />
                      {pendingApps > 0 && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">
                          {pendingApps} afventer
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">
                        Oprettet {new Date(job.created_at).toLocaleDateString("da-DK")}
                        {job.budget ? ` · ${job.budget} kr` : ""}
                        {` · ${job.applications?.length ?? 0} ansøgninger`}
                      </span>
                      <span className="text-gray-200">·</span>
                      <DeadlineLabel deadline={job.deadline} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                    <button
                      type="button"
                      onClick={() => setEditingJob(job)}
                      className="text-xs px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors font-medium"
                    >
                      Rediger
                    </button>
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
                      type="button"
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
    </>
  );
}

// ── AppRow ────────────────────────────────────────────────────────────────────

function AppRow({ app, onUpdate }: { app: Application; onUpdate: () => void }) {
  const [, action, pending] = useActionState(
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
          <p className="font-semibold text-sm text-gray-800">Kandidat</p>
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

// ── StatusBadge ───────────────────────────────────────────────────────────────

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
