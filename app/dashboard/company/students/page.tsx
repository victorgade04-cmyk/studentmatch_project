import { createClient } from "@/lib/supabase/server";

export default async function BrowseStudentsPage() {
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("student_profiles")
    .select("id, full_name, bio, skills, education, availability, hourly_rate, users(email)")
    .not("full_name", "is", null)
    .order("updated_at", { ascending: false });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Browse Students</h1>
      <p className="text-gray-500 text-sm mb-8">
        {students?.length ?? 0} students with profiles
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {students?.map((s: any) => (
          <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{s.full_name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{s.users?.email}</p>
              </div>
              {s.hourly_rate && (
                <span className="text-sm font-bold text-green-600 whitespace-nowrap">
                  {s.hourly_rate} kr/hr
                </span>
              )}
            </div>

            {s.availability && (
              <p className="text-xs text-gray-600 font-medium mb-2 bg-gray-100 px-2 py-0.5 rounded-full inline-block">
                {s.availability}
              </p>
            )}

            {s.bio && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{s.bio}</p>
            )}

            {s.education && (
              <p className="text-xs text-gray-500 mb-3">{s.education}</p>
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
          </div>
        ))}

        {!students?.length && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <p className="text-sm">No student profiles yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
