"use client";

import { useActionState, useEffect, useState } from "react";
import { updateStudentProfile } from "../actions";
import { createClient } from "@/lib/supabase/client";

const initial: { error?: string; success?: string } = {};

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [state, action, pending] = useActionState(updateStudentProfile, initial);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("student_profiles")
        .select("full_name, bio, skills, education, availability, hourly_rate")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setProfile(data);
          setLoading(false);
        });
    });
  }, [state]);

  if (loading) return <Loading />;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-black text-gray-900 mb-1">Min profil</h1>
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
        <TextareaField
          label="Om dig"
          name="bio"
          defaultValue={profile?.bio || ""}
          placeholder="Fortæl virksomheder lidt om dig selv…"
        />
        <Field
          label="Kompetencer (kommasepareret)"
          name="skills"
          defaultValue={profile?.skills?.join(", ") || ""}
          placeholder="Finance, Excel, Communication"
        />
        <Field
          label="Uddannelse"
          name="education"
          defaultValue={profile?.education || ""}
          placeholder="HA Erhvervsøkonomi, CBS…"
        />
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
