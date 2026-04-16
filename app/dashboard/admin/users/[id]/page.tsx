"use client";

import { useEffect, useState, useActionState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  updateStudentProfileAdmin,
  updateCompanyProfileAdmin,
  deleteUserAdmin,
} from "../../actions";
import { PackageId } from "@/lib/packages";
import SkillsInput from "@/app/dashboard/student/profile/SkillsInput";

type Document = {
  name: string;
  url: string;
};

type StudentProfile = {
  full_name: string | null;
  bio: string | null;
  skills: string[] | null;
  education: string | null;
  current_job: string | null;
  availability: string | null;
  hourly_rate: number | null;
  package: string | null;
};

type CompanyProfile = {
  company_name: string | null;
  description: string | null;
  contact_email: string | null;
  website: string | null;
  package: string | null;
};

type UserData = {
  id: string;
  email: string;
  role: string;
  created_at: string;
  student_profiles: StudentProfile | null;
  company_profiles: CompanyProfile | null;
};

export default function AdminUserProfilePage() {
  const { id: userId } = useParams<{ id: string }>();
  const router = useRouter();

  const [user, setUser] = useState<UserData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteState, deleteAction, deleting] = useActionState(deleteUserAdmin, {});
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  const [studentState, studentAction, savingStudent] = useActionState(
    updateStudentProfileAdmin,
    {}
  );
  const [companyState, companyAction, savingCompany] = useActionState(
    updateCompanyProfileAdmin,
    {}
  );

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("users")
      .select(
        `id, email, role, created_at,
         student_profiles(full_name, bio, skills, education, current_job, availability, hourly_rate, package),
         company_profiles(company_name, description, contact_email, website, package)`
      )
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        setUser(data as unknown as UserData);
        setLoading(false);
      });
  }, [userId, studentState, companyState]);

  // Fetch student documents
  useEffect(() => {
    if (!user || user.role !== "student") return;
    const supabase = createClient();
    supabase.storage
      .from("student-documents")
      .list(userId, { limit: 20, offset: 0 })
      .then(async ({ data: files }) => {
        if (!files?.length) return;
        const docs: Document[] = await Promise.all(
          files.map(async (file) => {
            const { data } = await supabase.storage
              .from("student-documents")
              .createSignedUrl(`${userId}/${file.name}`, 3600);
            return { name: file.name, url: data?.signedUrl ?? "" };
          })
        );
        setDocuments(docs.filter((d) => d.url));
      });
  }, [user, userId]);

  // Redirect after successful delete
  useEffect(() => {
    if (deleteState?.success) {
      router.push("/dashboard/admin/users");
    }
  }, [deleteState, router]);

  function handleDeleteClick() {
    if (
      window.confirm(
        "Er du sikker på at du vil slette denne bruger? Dette kan ikke fortrydes."
      )
    ) {
      setDeleteConfirmed(true);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Indlæser…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8">
        <p className="text-red-500 text-sm">Bruger ikke fundet.</p>
        <Link
          href="/dashboard/admin/users"
          className="text-sm text-gray-500 hover:text-gray-900 mt-4 inline-block"
        >
          ← Tilbage til brugere
        </Link>
      </div>
    );
  }

  const sp = user.student_profiles;
  const cp = user.company_profiles;
  const pkgId = ((sp?.package || cp?.package || "bronze") as PackageId);

  return (
    <div className="p-8 max-w-2xl">
      {/* Back */}
      <Link
        href="/dashboard/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-900 transition-colors mb-6"
      >
        ← Tilbage til brugere
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-0.5">
            {sp?.full_name || cp?.company_name || user.email}
          </h1>
          <p className="text-sm text-gray-500">{user.email}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {user.role === "student"
              ? "Arbejdssøgende"
              : user.role === "company"
              ? "Virksomhed"
              : "Admin"}{" "}
            · Oprettet {new Date(user.created_at).toLocaleDateString("da-DK")}
          </p>
        </div>
        <Link
          href={`/dashboard/messages?user=${user.id}`}
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Send besked
        </Link>
      </div>

      {/* Student profile form */}
      {user.role === "student" && sp && (
        <form action={studentAction} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5 mb-6">
          <input type="hidden" name="userId" value={user.id} />

          <h2 className="font-bold text-gray-900">Profiloplysninger</h2>

          <Field label="Fulde navn" name="full_name" defaultValue={sp.full_name || ""} placeholder="Sofie Hansen" />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Om kandidaten</label>
            <textarea
              name="bio"
              defaultValue={sp.bio || ""}
              placeholder="Kort bio…"
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
          </div>

          <SkillsInput initialSkills={sp.skills || []} maxSkills={null} />

          <Field label="Baggrund" name="education" defaultValue={sp.education || ""} placeholder="HA Erhvervsøkonomi, CBS…" />
          <Field label="Nuværende stilling" name="current_job" defaultValue={sp.current_job || ""} placeholder="Fx barista, freelancer…" />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tilgængelighed</label>
            <select
              name="availability"
              defaultValue={sp.availability || ""}
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="">Vælg tilgængelighed</option>
              <option value="Full-time">Fuld tid</option>
              <option value="Part-time">Deltid</option>
              <option value="Weekends only">Kun weekender</option>
              <option value="Remote only">Kun remote</option>
              <option value="Freelance">Freelance / Projektbaseret</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Timepris (kr/t)</label>
            <input
              name="hourly_rate"
              type="number"
              min="0"
              step="0.01"
              defaultValue={sp.hourly_rate ?? ""}
              placeholder="0.00"
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Pakke</label>
            <select
              name="package"
              defaultValue={sp.package || "bronze"}
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
            </select>
          </div>

          {studentState?.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {studentState.error}
            </p>
          )}
          {studentState?.success && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
              {studentState.success}
            </p>
          )}

          <button
            type="submit"
            disabled={savingStudent}
            className="px-5 py-2.5 rounded-lg bg-gray-900 text-white font-semibold text-sm hover:bg-gray-700 disabled:opacity-60 transition-colors"
          >
            {savingStudent ? "Gemmer…" : "Gem ændringer"}
          </button>
        </form>
      )}

      {/* Company profile form */}
      {user.role === "company" && cp && (
        <form action={companyAction} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5 mb-6">
          <input type="hidden" name="userId" value={user.id} />

          <h2 className="font-bold text-gray-900">Virksomhedsprofil</h2>

          <Field label="Virksomhedsnavn" name="company_name" defaultValue={cp.company_name || ""} placeholder="Acme A/S" />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Beskrivelse</label>
            <textarea
              name="description"
              defaultValue={cp.description || ""}
              placeholder="Kort om virksomheden…"
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
          </div>

          <Field label="Kontakt-email" name="contact_email" defaultValue={cp.contact_email || ""} placeholder="kontakt@virksomhed.dk" />
          <Field label="Hjemmeside" name="website" defaultValue={cp.website || ""} placeholder="https://virksomhed.dk" />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Pakke</label>
            <select
              name="package"
              defaultValue={cp.package || "startup"}
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="startup">Startup</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          {companyState?.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {companyState.error}
            </p>
          )}
          {companyState?.success && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
              {companyState.success}
            </p>
          )}

          <button
            type="submit"
            disabled={savingCompany}
            className="px-5 py-2.5 rounded-lg bg-gray-900 text-white font-semibold text-sm hover:bg-gray-700 disabled:opacity-60 transition-colors"
          >
            {savingCompany ? "Gemmer…" : "Gem ændringer"}
          </button>
        </form>
      )}

      {/* Student documents */}
      {user.role === "student" && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">Dokumenter</h2>
          {documents.length === 0 ? (
            <p className="text-sm text-gray-400">Ingen dokumenter uploadet.</p>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc.name}>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-700 hover:text-gray-900 underline"
                  >
                    {doc.name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-red-100 p-6">
        <h2 className="font-bold text-red-700 mb-1">Slet bruger</h2>
        <p className="text-sm text-gray-500 mb-4">
          Sletter brugeren permanent fra systemet inkl. profil og alle data. Kan ikke fortrydes.
        </p>

        {deleteConfirmed ? (
          <form action={deleteAction}>
            <input type="hidden" name="userId" value={user.id} />
            <button
              type="submit"
              disabled={deleting}
              className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-semibold text-sm hover:bg-red-700 disabled:opacity-60 transition-colors"
            >
              {deleting ? "Sletter…" : "Bekræft sletning"}
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={handleDeleteClick}
            className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors"
          >
            Slet bruger
          </button>
        )}

        {deleteState?.error && (
          <p className="text-sm text-red-600 mt-3">{deleteState.error}</p>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
    </div>
  );
}
