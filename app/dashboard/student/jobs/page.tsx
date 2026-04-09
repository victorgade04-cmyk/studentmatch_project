"use client";

import { useActionState, useEffect, useState } from "react";
import { applyToJob } from "../actions";
import { createClient } from "@/lib/supabase/client";

type Job = {
  id: string;
  title: string;
  description: string | null;
  budget: number | null;
  status: string;
  created_at: string;
  company_profiles: { company_name: string | null } | null;
};

export default function StudentJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myApps, setMyApps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeJob, setActiveJob] = useState<Job | null>(null);

  const [state, action, pending] = useActionState(
    async (prev: any, fd: FormData) => {
      const res = await applyToJob(prev, fd);
      if (res.success) {
        setMyApps((s) => new Set([...s, fd.get("jobId") as string]));
        setActiveJob(null);
      }
      return res;
    },
    {}
  );

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase
        .from("jobs")
        .select("id, title, description, budget, status, created_at, company_profiles(company_name)")
        .eq("status", "open")
        .order("created_at", { ascending: false }),
      supabase.auth.getUser().then(({ data: { user } }) =>
        user
          ? supabase
              .from("applications")
              .select("job_id")
              .eq("student_id", user.id)
          : { data: [] }
      ),
    ]).then(([{ data: j }, { data: a }]) => {
      setJobs((j as unknown as Job[]) || []);
      setMyApps(new Set((a || []).map((x: any) => x.job_id)));
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Browse Jobs</h1>
      <p className="text-gray-500 text-sm mb-8">{jobs.length} open positions</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {jobs.map((job) => {
          const applied = myApps.has(job.id);
          return (
            <div key={job.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{job.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {job.company_profiles?.company_name || "Company"} ·{" "}
                    {new Date(job.created_at).toLocaleDateString()}
                  </p>
                </div>
                {job.budget && (
                  <span className="text-sm font-semibold text-green-600 whitespace-nowrap">
                    {job.budget} kr
                  </span>
                )}
              </div>
              {job.description && (
                <p className="text-sm text-gray-600 mt-3 line-clamp-3">{job.description}</p>
              )}
              <div className="mt-4">
                {applied ? (
                  <span className="text-xs text-green-600 font-semibold bg-green-50 px-3 py-1.5 rounded-lg">
                    ✓ Applied
                  </span>
                ) : (
                  <button
                    onClick={() => setActiveJob(job)}
                    className="text-sm px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!jobs.length && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm">No open jobs at the moment. Check back soon!</p>
        </div>
      )}

      {/* Apply modal */}
      {activeJob && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="font-bold text-lg text-gray-900 mb-1">Apply to {activeJob.title}</h2>
            <p className="text-sm text-gray-400 mb-4">
              {activeJob.company_profiles?.company_name}
            </p>
            <form action={action} className="space-y-4">
              <input type="hidden" name="jobId" value={activeJob.id} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cover Letter
                </label>
                <textarea
                  name="cover_letter"
                  rows={5}
                  placeholder="Tell the company why you're a great fit…"
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              {state?.error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  {state.error}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                >
                  {pending ? "Submitting…" : "Submit application"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveJob(null)}
                  className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Loading() {
  return (
    <div className="p-8 flex items-center justify-center h-64">
      <div className="text-gray-400 text-sm">Loading jobs…</div>
    </div>
  );
}
