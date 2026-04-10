import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function BrowseStudentsPage() {
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("student_profiles")
    .select("id, full_name, bio, skills, education, availability, hourly_rate, users(email)")
    .not("full_name", "is", null)
    .order("updated_at", { ascending: false });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-gray-900 mb-1">Find studerende</h1>
      <p className="text-gray-500 text-sm mb-8">
        {students?.length ?? 0} studerende med profiler
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {students?.map((s: any) => (
          <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-900">{s.full_name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{s.users?.email}</p>
              </div>
              {s.hourly_rate && (
                <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
                  {s.hourly_rate} kr/t
                </span>
              )}
            </div>

            {s.availability && (
              <span className="text-xs text-gray-600 font-medium bg-gray-100 px-2.5 py-1 rounded-full self-start">
                {s.availability}
              </span>
            )}

            {s.bio && (
              <p className="text-sm text-gray-600 line-clamp-2">{s.bio}</p>
            )}

            {s.education && (
              <p className="text-xs text-gray-500">{s.education}</p>
            )}

            {s.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {s.skills.map((skill: string) => (
                  <span
                    key={skill}
                    className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}

            <Link
              href={`/dashboard/messages?with=${s.id}`}
              className="mt-auto text-center text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 transition-colors rounded-lg px-4 py-2"
            >
              Send besked
            </Link>
          </div>
        ))}

        {!students?.length && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <p className="text-sm">Ingen studerendes profiler endnu. Kig tilbage snart!</p>
          </div>
        )}
      </div>
    </div>
  );
}
