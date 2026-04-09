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
      <h1 className="text-2xl font-bold text-gray-900 mb-1">My Profile</h1>
      <p className="text-gray-500 text-sm mb-8">
        Keep your profile up to date so companies can find you.
      </p>

      {/* Hourly rate (read-only) */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
        <span className="text-2xl">💰</span>
        <div>
          <p className="text-sm font-semibold text-amber-800">
            Hourly Rate:{" "}
            {profile?.hourly_rate ? `${profile.hourly_rate} kr/hr` : "Not set yet"}
          </p>
          <p className="text-xs text-amber-600 mt-0.5">
            Your hourly rate is set by the admin and cannot be changed by you.
          </p>
        </div>
      </div>

      <form action={action} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <Field
          label="Full Name"
          name="full_name"
          defaultValue={profile?.full_name || ""}
          placeholder="Jane Doe"
        />
        <TextareaField
          label="Bio"
          name="bio"
          defaultValue={profile?.bio || ""}
          placeholder="Tell companies about yourself…"
        />
        <Field
          label="Skills (comma-separated)"
          name="skills"
          defaultValue={profile?.skills?.join(", ") || ""}
          placeholder="React, TypeScript, Node.js"
        />
        <Field
          label="Education"
          name="education"
          defaultValue={profile?.education || ""}
          placeholder="BSc Computer Science, University of…"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Availability
          </label>
          <select
            name="availability"
            defaultValue={profile?.availability || ""}
            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select availability</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Weekends only">Weekends only</option>
            <option value="Remote only">Remote only</option>
            <option value="Freelance">Freelance / Project-based</option>
          </select>
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
            {state.success}
          </p>
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
        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}

function TextareaField({
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
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={4}
        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
      />
    </div>
  );
}

function Loading() {
  return (
    <div className="p-8 flex items-center justify-center h-64">
      <div className="text-gray-400 text-sm">Loading…</div>
    </div>
  );
}
