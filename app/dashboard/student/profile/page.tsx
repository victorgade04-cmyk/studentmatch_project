"use client";

import { useActionState, useEffect, useState } from "react";
import { updateStudentProfile } from "../actions";
import { createClient } from "@/lib/supabase/client";
import { PACKAGES, PACKAGE_BADGE, PackageId } from "@/lib/packages";
import Link from "next/link";
import DocumentsSection from "./DocumentsSection";

const initial: { error?: string; success?: string } = {};

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [state, action, pending] = useActionState(updateStudentProfile, initial);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      supabase
        .from("student_profiles")
        .select("full_name, bio, skills, education, current_job, availability, hourly_rate, package")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setProfile(data);
          setLoading(false);
        });
    });
  }, [state]);

  if (loading) return <Loading />;

  const pkgId: PackageId = (profile?.package as PackageId) || "bronze";
  const pkg = PACKAGES[pkgId];
  const badgeClass = PACKAGE_BADGE[pkgId];
  const currentSkills: string[] = profile?.skills || [];
  const skillsStr = currentSkills.join(", ");

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-2xl font-black text-gray-900">Min profil</h1>
        <Link
          href="/dashboard/student/package"
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClass} hover:opacity-80 transition-opacity`}
        >
          {pkg.name}
        </Link>
      </div>
      <p className="text-gray-500 text-sm mb-8">
        Hold din profil opdateret, så virksomheder kan finde dig.
      </p>

      {/* Hourly rate (read-only) */}
      <div className="bg-gray-900 rounded-xl p-4 mb-6">
        <p className="text-sm font-semibold text-white">
          Timepris:{" "}
          {profile?.hourly_rate ? `${profile.hourly_rate} kr/t` : "Ikke sat endnu"}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          Din timepris sættes af admin og kan ikke ændres af dig.
        </p>
      </div>

      <form action={action} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        <Field
          label="Fulde navn"
          name="full_name"
          defaultValue={profile?.full_name || ""}
          placeholder="Sofie Hansen"
        />

        {/* Bio — only shown for Silver and Gold */}
        {pkg.hasBio ? (
          <TextareaField
            label="Om dig"
            name="bio"
            defaultValue={profile?.bio || ""}
            placeholder="Fortæl virksomheder lidt om dig selv…"
          />
        ) : (
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-500 mb-1">Om dig</p>
            <p className="text-xs text-gray-400">
              Personlig bio er ikke inkluderet i Bronze-pakken.{" "}
              <Link href="/dashboard/student/package" className="underline hover:text-gray-600">
                Opgrader til Silver
              </Link>{" "}
              for at tilføje en bio.
            </p>
          </div>
        )}

        {/* Skills with package limit */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Kompetencer (kommasepareret)
            </label>
            {pkg.maxSkills !== null && (
              <span className={`text-xs font-medium ${currentSkills.length >= pkg.maxSkills ? "text-red-500" : "text-gray-400"}`}>
                {currentSkills.length}/{pkg.maxSkills}
              </span>
            )}
          </div>
          <input
            name="skills"
            defaultValue={skillsStr}
            placeholder="Finance, Excel, Communication"
            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          {pkg.maxSkills !== null && (
            <p className="text-xs text-gray-400 mt-1.5">
              Din pakke tillader maks. {pkg.maxSkills} kompetencer.{" "}
              <Link href="/dashboard/student/package" className="underline hover:text-gray-600">
                Opgrader for ubegrænset adgang.
              </Link>
            </p>
          )}
        </div>

        {userId && <DocumentsSection userId={userId} pkgId={pkgId} />}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Baggrund</label>
          <input
            name="education"
            defaultValue={profile?.education || ""}
            placeholder="HA Erhvervsøkonomi, CBS…"
            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Valgfrit — skriv din uddannelse, eller spring over hvis du ikke har en.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nuværende stilling</label>
          <input
            name="current_job"
            defaultValue={profile?.current_job || ""}
            placeholder="Fx. barista, butiksmedarbejder, freelancer…"
            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Valgfrit — skriv dit nuværende job, eller spring over hvis du ikke har et.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Tilgængelighed
          </label>
          <select
            name="availability"
            defaultValue={profile?.availability || ""}
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

        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
            {state.success}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2.5 rounded-lg bg-gray-900 text-white font-semibold text-sm hover:bg-gray-700 disabled:opacity-60 transition-colors"
        >
          {pending ? "Gemmer…" : "Gem profil"}
        </button>
      </form>

    </div>
  );
}

function Field({ label, name, defaultValue, placeholder }: {
  label: string; name: string; defaultValue: string; placeholder: string;
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

function TextareaField({ label, name, defaultValue, placeholder }: {
  label: string; name: string; defaultValue: string; placeholder: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={4}
        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
      />
    </div>
  );
}

function Loading() {
  return (
    <div className="p-8 flex items-center justify-center h-64">
      <div className="text-gray-400 text-sm">Indlæser…</div>
    </div>
  );
}
