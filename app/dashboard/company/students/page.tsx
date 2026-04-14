import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function BrowseStudentsPage() {
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("student_profiles")
    .select("id, full_name, bio, skills, education, availability, hourly_rate, users(email)")
    .not("full_name", "is", null)
    .order("updated_at", { ascending: false });

  // Fetch documents for all students in one query
  const studentIds = students?.map((s: any) => s.id) ?? [];
  let docsByStudent: Record<string, { id: string; file_name: string; file_path: string; file_size: number; signedUrl: string | null }[]> = {};

  if (studentIds.length > 0) {
    const { data: allDocs } = await supabase
      .from("student_documents")
      .select("id, student_id, file_name, file_path, file_size")
      .in("student_id", studentIds)
      .order("uploaded_at", { ascending: true });

    if (allDocs && allDocs.length > 0) {
      // Batch-generate signed URLs (1 hour expiry)
      const paths = allDocs.map((d: any) => d.file_path);
      const { data: urlData } = await supabase.storage
        .from("student-documents")
        .createSignedUrls(paths, 3600);

      const signedByPath: Record<string, string> = {};
      urlData?.forEach((item: any) => {
        if (item.signedUrl && item.path) signedByPath[item.path] = item.signedUrl;
      });

      allDocs.forEach((doc: any) => {
        if (!docsByStudent[doc.student_id]) docsByStudent[doc.student_id] = [];
        docsByStudent[doc.student_id].push({
          id: doc.id,
          file_name: doc.file_name,
          file_path: doc.file_path,
          file_size: doc.file_size,
          signedUrl: signedByPath[doc.file_path] ?? null,
        });
      });
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-gray-900 mb-1">Find kandidater</h1>
      <p className="text-gray-500 text-sm mb-8">
        {students?.length ?? 0} kandidater med profiler
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {students?.map((s: any) => {
          const docs = docsByStudent[s.id] ?? [];
          return (
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

              {docs.length > 0 && (
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs font-semibold text-gray-500 mb-2">
                    Dokumenter ({docs.length})
                  </p>
                  <ul className="space-y-1.5">
                    {docs.map((doc) => (
                      <li key={doc.id} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-gray-500">PDF</span>
                        </div>
                        <span className="text-xs text-gray-700 truncate flex-1 min-w-0">
                          {doc.file_name}
                        </span>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {Math.round(doc.file_size / 1024)} KB
                        </span>
                        {doc.signedUrl ? (
                          <a
                            href={doc.signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-gray-900 hover:underline flex-shrink-0"
                          >
                            Åbn
                          </a>
                        ) : (
                          <span className="text-xs text-gray-300 flex-shrink-0">—</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Link
                href={`/dashboard/messages?with=${s.id}`}
                className="mt-auto text-center text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 transition-colors rounded-lg px-4 py-2"
              >
                Send besked
              </Link>
            </div>
          );
        })}

        {!students?.length && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <p className="text-sm">Ingen kandidatprofiler endnu. Kig tilbage snart!</p>
          </div>
        )}
      </div>
    </div>
  );
}
