import { createClient } from "@/lib/supabase/server";
import { removeJob } from "../actions";

export default async function AdminJobsPage() {
  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, description, budget, status, created_at, company_profiles(company_name)")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Alle jobopslag</h1>
      <p className="text-gray-500 text-sm mb-8">Se og administrér alle jobopslag</p>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-6 py-3 text-left">Titel</th>
              <th className="px-6 py-3 text-left">Virksomhed</th>
              <th className="px-6 py-3 text-left">Budget</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Oprettet</th>
              <th className="px-6 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {jobs?.map((job: any) => (
              <tr key={job.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-3 font-medium text-gray-800">{job.title}</td>
                <td className="px-6 py-3 text-gray-600">
                  {job.company_profiles?.company_name || "—"}
                </td>
                <td className="px-6 py-3 text-gray-600">
                  {job.budget ? `${job.budget} kr` : "—"}
                </td>
                <td className="px-6 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    job.status === "open"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {job.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-400 text-xs">
                  {new Date(job.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-3">
                  <form action={removeJob}>
                    <input type="hidden" name="jobId" value={job.id} />
                    <button
                      type="submit"
                      className="text-xs text-red-500 hover:underline"
                    >
                      Slet
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!jobs?.length && (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">Ingen jobopslag fundet.</p>
        )}
      </div>
    </div>
  );
}
