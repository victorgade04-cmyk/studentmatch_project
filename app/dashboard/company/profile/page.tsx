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

  if (loading) return <div className="p-8 text-gray-400 text-sm">Loading…</div>;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Company Profile</h1>
      <p className="text-gray-500 text-sm mb-8">Students will see this when browsing companies.</p>

      <form action={action} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        {[
          { label: "Company Name", name: "company_name", value: profile?.company_name || "", type: "text", placeholder: "Acme Corp" },
          { label: "Contact Email", name: "contact_email", value: profile?.contact_email || "", type: "email", placeholder: "jobs@acme.com" },
          { label: "Website", name: "website", value: profile?.website || "", type: "url", placeholder: "https://acme.com" },
        ].map((f) => (
          <div key={f.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
            <input
              name={f.name}
              type={f.type}
              defaultValue={f.value}
              placeholder={f.placeholder}
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea
            name="description"
            defaultValue={profile?.description || ""}
            placeholder="Tell students about your company, culture, and what you do…"
            rows={5}
            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">{state.success}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {pending ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}
