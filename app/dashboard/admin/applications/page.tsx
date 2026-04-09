import { createClient } from "@/lib/supabase/server";
import { setApplicationStatus } from "../actions";

export default async function AdminApplicationsPage() {
  const supabase = await createClient();
  const { data: apps } = await supabase
    .from("applications")
    .select(
      "id, status, cover_letter, created_at, jobs(title, company_profiles(company_name)), student_profiles(full_name)"
    )
    .order("created_at", { ascending: false });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">All Applications</h1>
      <p className="text-gray-500 text-sm mb-8">Review and manage all applications</p>

      <div className="space-y-3">
        {apps?.map((app: any) => (
          <div
            key={app.id}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start justify-between gap-6"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <StatusBadge status={app.status} />
                <span className="text-xs text-gray-400">
                  {new Date(app.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="font-semibold text-gray-800 text-sm">
                {app.student_profiles?.full_name || "Student"} → {app.jobs?.title}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Company: {app.jobs?.company_profiles?.company_name || "—"}
              </p>
              {app.cover_letter && (
                <p className="text-xs text-gray-400 mt-2 line-clamp-2">{app.cover_letter}</p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {["pending", "approved", "rejected"].map((s) => (
                <form key={s} action={setApplicationStatus}>
                  <input type="hidden" name="appId" value={app.id} />
                  <input type="hidden" name="status" value={s} />
                  <button
                    type="submit"
                    disabled={app.status === s}
                    className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors disabled:opacity-40 ${
                      s === "approved"
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : s === "rejected"
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                </form>
              ))}
            </div>
          </div>
        ))}
        {!apps?.length && (
          <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
            <p className="text-gray-400 text-sm">No applications yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}
