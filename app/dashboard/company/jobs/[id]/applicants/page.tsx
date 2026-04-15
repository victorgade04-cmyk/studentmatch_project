import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PACKAGE_BADGE, PackageId } from "@/lib/packages";

type Applicant = {
  id: string;
  created_at: string;
  status: string;
  cover_letter: string | null;
  student_id: string;
  student_profiles: {
    full_name: string | null;
    education: string | null;
    current_job: string | null;
    skills: string[] | null;
    availability: string | null;
    hourly_rate: number | null;
    package: PackageId | null;
  } | null;
};

const AVAILABILITY_DA: Record<string, string> = {
  "Full-time": "Fuld tid",
  "Part-time": "Deltid",
  "Weekends only": "Kun weekender",
  "Remote only": "Kun remote",
  "Freelance": "Freelance / Projektbaseret",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const STATUS_DA: Record<string, string> = {
  pending: "Afventer",
  approved: "Godkendt",
  rejected: "Afvist",
};

function formatDeadline(deadline: string): string {
  return new Date(deadline).toLocaleDateString("da-DK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ApplicantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: jobId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.user_metadata?.role !== "company") redirect("/dashboard");

  // Fetch job and verify ownership
  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, deadline, status, created_at")
    .eq("id", jobId)
    .eq("company_id", user.id)
    .maybeSingle();

  if (!job) redirect("/dashboard/company/jobs");

  // Fetch applicants with full student profile
  const { data: applications } = await supabase
    .from("applications")
    .select(
      `id, created_at, status, cover_letter, student_id,
       student_profiles(full_name, education, current_job, skills, availability, hourly_rate, package)`
    )
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  const applicants = (applications as unknown as Applicant[]) || [];

  const today = new Date().toDateString();
  const deadlineDate = job.deadline ? new Date(job.deadline) : null;
  const deadlineNotPassed =
    deadlineDate !== null && deadlineDate >= new Date(today);

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <Link
        href="/dashboard/company/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-900 transition-colors mb-6"
      >
        ← Tilbage til mine jobs
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 mb-1">{job.title}</h1>
        <p className="text-gray-500 text-sm">
          {applicants.length}{" "}
          {applicants.length === 1 ? "ansøger" : "ansøgere"}
        </p>
      </div>

      {/* Deadline notice */}
      {deadlineNotPassed && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8 flex items-start gap-3">
          <span className="text-yellow-500 mt-0.5 flex-shrink-0">⚠</span>
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">Ansøgningsfristen er endnu ikke udløbet</span>{" "}
            — {formatDeadline(job.deadline!)}. Du kan allerede se ansøgerne nedenfor.
          </p>
        </div>
      )}

      {/* Applicants */}
      {applicants.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">Ingen ansøgere endnu.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applicants.map((app) => {
            const profile = app.student_profiles;
            const pkgId = (profile?.package ?? "bronze") as PackageId;
            const badgeClass = PACKAGE_BADGE[pkgId];
            const pkgLabel =
              pkgId.charAt(0).toUpperCase() + pkgId.slice(1);

            return (
              <div
                key={app.id}
                className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Left — candidate info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <h2 className="font-bold text-gray-900">
                        {profile?.full_name || "Unavngiven kandidat"}
                      </h2>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}
                      >
                        {pkgLabel}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[app.status] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {STATUS_DA[app.status] ?? app.status}
                      </span>
                    </div>

                    <div className="space-y-1 mb-4 text-sm text-gray-500">
                      {profile?.current_job && (
                        <p>
                          <span className="font-medium text-gray-700">Nuværende stilling:</span>{" "}
                          {profile.current_job}
                        </p>
                      )}
                      {profile?.education && (
                        <p>
                          <span className="font-medium text-gray-700">Baggrund:</span>{" "}
                          {profile.education}
                        </p>
                      )}
                      {profile?.availability && (
                        <p>
                          <span className="font-medium text-gray-700">Tilgængelighed:</span>{" "}
                          {AVAILABILITY_DA[profile.availability] ?? profile.availability}
                        </p>
                      )}
                      {profile?.hourly_rate && (
                        <p>
                          <span className="font-medium text-gray-700">Timepris:</span>{" "}
                          {profile.hourly_rate} kr/t
                        </p>
                      )}
                    </div>

                    {/* Skills */}
                    {profile?.skills && profile.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {profile.skills.map((skill) => (
                          <span
                            key={skill}
                            className="bg-gray-100 text-gray-700 text-xs px-2.5 py-0.5 rounded-full font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Cover letter */}
                    {app.cover_letter && (
                      <details className="mt-1">
                        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 select-none">
                          Vis ansøgningstekst
                        </summary>
                        <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed whitespace-pre-line">
                          {app.cover_letter}
                        </p>
                      </details>
                    )}

                    <p className="text-xs text-gray-400 mt-3">
                      Ansøgt {new Date(app.created_at).toLocaleDateString("da-DK")}
                    </p>
                  </div>

                  {/* Right — actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Link
                      href={`/dashboard/company/students/${app.student_id}`}
                      className="px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 transition-colors text-center whitespace-nowrap"
                    >
                      Se fuld profil
                    </Link>
                    <Link
                      href={`/dashboard/messages?with=${app.student_id}`}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors text-center whitespace-nowrap"
                    >
                      Send besked
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
