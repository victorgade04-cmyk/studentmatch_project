"use client";

import { useActionState, useEffect, useState } from "react";
import { updateCompanyProfile } from "../actions";
import { createClient } from "@/lib/supabase/client";

const initial: { error?: string; success?: string } = {};

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [state, action, pending] = useActionState(updateCompanyProfile, initial);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("company_profiles")
        .select("company_name, description, contact_email, website")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setProfile(data);
          setLoading(false);
        });
    });
  }, [state]);

  if (loading) return <div className="p-8 text-gray-400 text-sm">Indlæser…</div>;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-black text-gray-900 mb-1">Virksomhedsprofil</h1>
      <p className="text-gray-500 text-sm mb-8">
        Kandidater kan se dette, når de søger efter virksomheder.
      </p>

      <form action={action} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        {[
          { label: "Virksomhedsnavn", name: "company_name", value: profile?.company_name || "", type: "text", placeholder: "Acme ApS" },
          { label: "Kontakt e-mail", name: "contact_email", value: profile?.contact_email || "", type: "email", placeholder: "jobs@acme.dk" },
          { label: "Hjemmeside", name: "website", value: profile?.website || "", type: "url", placeholder: "https://acme.dk" },
        ].map((f) => (
          <div key={f.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
            <input
              name={f.name}
              type={f.type}
              defaultValue={f.value}
              placeholder={f.placeholder}
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Beskrivelse</label>
          <textarea
            name="description"
            defaultValue={profile?.description || ""}
            placeholder="Fortæl kandidater om din virksomhed, kultur og hvad I laver…"
            rows={5}
            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">{state.success}</p>
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
