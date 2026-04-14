"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PACKAGES, PACKAGE_BADGE, PackageId } from "@/lib/packages";
import { setStudentPackage } from "../../actions";

interface Profile {
  full_name: string | null;
  bio: string | null;
  skills: string[] | null;
  education: string | null;
  availability: string | null;
  hourly_rate: number | null;
  package: string | null;
  users: { email: string } | null;
}

interface Doc {
  id: string;
  file_name: string;
  file_size: number;
}

export default function AdminStudentPage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [pkgId, setPkgId] = useState<PackageId>("bronze");
  const [saving, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<"idle" | "ok" | "error">("idle");

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase
        .from("student_profiles")
        .select("full_name, bio, skills, education, availability, hourly_rate, package, users(email)")
        .eq("id", id)
        .single(),
      supabase
        .from("student_documents")
        .select("id, file_name, file_size")
        .eq("student_id", id)
        .order("uploaded_at", { ascending: false }),
    ]).then(([{ data: p }, { data: d }]) => {
      if (p) {
        setProfile(p as unknown as Profile);
        setPkgId(((p.package as PackageId) || "bronze"));
      }
      setDocs((d as Doc[]) || []);
      setLoading(false);
    });
  }, [id]);

  function handlePackageChange(newPkg: string) {
    setSaveStatus("idle");
    const fd = new FormData();
    fd.append("studentId", id);
    fd.append("package", newPkg);
    startTransition(async () => {
      const res = await setStudentPackage({}, fd);
      if (res.success) {
        setPkgId(newPkg as PackageId);
        setSaveStatus("ok");
      } else {
        setSaveStatus("error");
      }
    });
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Indlæser…</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8">
        <Link href="/dashboard/admin/users" className="text-sm text-gray-400 hover:text-gray-700">
          ← Brugere
        </Link>
        <p className="text-sm text-gray-500 mt-6">Kandidat ikke fundet.</p>
      </div>
    );
  }

  const pkg = PACKAGES[pkgId];
  const badgeClass = PACKAGE_BADGE[pkgId];

  return (
    <div className="p-8 max-w-2xl">
      <Link
        href="/dashboard/admin/users"
        className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors"
      >
        ← Brugere
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mt-5 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            {profile.full_name || <span className="text-gray-400 italic">Unavngivet</span>}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{profile.users?.email}</p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
          {pkg.name}
        </span>
      </div>

      {/* Package selector */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">Pakke</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Ændres med det samme — ingen gem-knap nødvendig.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            {saveStatus === "ok" && (
              <span className="text-xs font-medium text-green-600">Gemt ✓</span>
            )}
            {saveStatus === "error" && (
              <span className="text-xs font-medium text-red-500">Fejl</span>
            )}
            <select
              value={pkgId}
              disabled={saving}
              onChange={(e) => handlePackageChange(e.target.value)}
              className="border border-gray-200 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50 transition-opacity"
            >
              <option value="bronze">Bronze — Gratis</option>
              <option value="silver">Silver — 39 kr/md</option>
              <option value="gold">Gold — 79 kr/md</option>
            </select>
          </div>
        </div>

        {/* Package features summary */}
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-x-6 gap-y-1.5">
          <Feature
            label="Kompetencer"
            value={pkg.maxSkills === null ? "Ubegrænset" : `Maks. ${pkg.maxSkills}`}
          />
          <Feature
            label="Fil-uploads"
            value={pkg.maxUploads === null ? "Ubegrænset" : `Maks. ${pkg.maxUploads}`}
          />
          <Feature
            label="Timer/uge"
            value={pkg.maxHoursPerWeek === null ? "Ubegrænset" : `Maks. ${pkg.maxHoursPerWeek}`}
          />
          <Feature label="Bio" value={pkg.hasBio ? "Ja" : "Nej"} />
        </div>
      </div>

      {/* Profile info (read-only) */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Profiloplysninger</p>

        <Row label="Timepris" value={profile.hourly_rate ? `${profile.hourly_rate} kr/t` : null} />
        <Row label="Uddannelse" value={profile.education} />
        <Row label="Tilgængelighed" value={profile.availability} />

        {profile.bio && (
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1">Bio</p>
            <p className="text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {profile.skills && profile.skills.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2">
              Kompetencer ({profile.skills.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((s) => (
                <span key={s} className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Documents */}
      {docs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mt-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
            Dokumenter ({docs.length})
          </p>
          <ul className="space-y-2">
            {docs.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 text-sm">
                <div className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-gray-500">PDF</span>
                </div>
                <span className="text-gray-800 flex-1 truncate">{doc.file_name}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {Math.round(doc.file_size / 1024)} KB
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Feature({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-semibold text-gray-800">{value}</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-gray-400">{label}</span>
      <span className="text-sm text-gray-700">
        {value || <span className="text-gray-300">—</span>}
      </span>
    </div>
  );
}
