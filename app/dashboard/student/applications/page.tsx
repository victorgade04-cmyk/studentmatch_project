import { createClient } from "@/lib/supabase/server";

export default async function StudentApplicationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: applications } = await supabase
    .from("applications")
    .select(
      "id, status, cover_letter, created_at, jobs(title, description, budget, company_profiles(company_name, contact_email))"
    )
    .eq("student_id", user!.id)
    .order("created_at", { ascending: false });

  const counts = {
    total: applications?.length ?? 0,
    pending: applications?.filter((a) => a.status === "pending").length ?? 0,
    approved: applications?.filter((a) => a.status === "approved").length ?? 0,
    rejected: applications?.filter((a) => a.status === "rejected").length ?? 0,
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-gray-900 mb-1">Mine ansøgninger</h1>
      <p className="text-gray-500 text-sm mb-6">{counts.total} ansøgninger i alt</p>

      <div className="flex gap-3 mb-8">
        {[
          { label: "Afventer", value: counts.pending, color: "bg-yellow-100 text-yellow-700" },
          { label: "Godkendt", value: counts.approved, color: "bg-green-100 text-green-700" },
          { label: "Afvist", value: counts.rejected, color: "bg-red-100 text-red-700" },
        ].map((s) => (
          <div key={s.label} className={`px-4 py-2 rounded-lg text-sm font-semibold ${s.color}`}>
            {s.value} {s.label}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {applications?.map((app: any) => (
          <div key={app.id} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={app.status} />
                  <span className="text-xs text-gray-400">
                    Ansøgt {new Date(app.created_at).toLocaleDateString("da-DK")}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900">{app.jobs?.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {app.jobs?.company_profiles?.company_name}
                  {app.jobs?.budget && ` · ${app.jobs.budget} kr budget`}
                </p>
                {app.status === "approved" && app.jobs?.company_profiles?.contact_email && (
                  <p className="text-sm text-green-700 mt-2 bg-green-50 rounded-lg px-3 py-2">
                    Kontakt:{" "}
                    <a
                      href={`mailto:${app.jobs.company_profiles.contact_email}`}
                      className="underline"
                    >
                      {app.jobs.company_profiles.contact_email}
                    </a>
                  </p>
                )}
              </div>
            </div>
            {app.cover_letter && (
              <details className="mt-3">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  Se ansøgningstekst
                </summary>
                <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
                  {app.cover_letter}
                </p>
              </details>
            )}
          </div>
        ))}

        {!applications?.length && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">Ingen ansøgninger endnu. Browse jobs for at ansøge!</p>
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
  const labels: Record<string, string> = {
    pending: "afventer",
    approved: "godkendt",
    rejected: "afvist",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {labels[status] || status}
    </span>
  );
}
