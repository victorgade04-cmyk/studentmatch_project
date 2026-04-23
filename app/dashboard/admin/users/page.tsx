"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { setHourlyRate, setStudentPackage, updateUserRole } from "../actions";
import { createTestUser } from "./actions";
import { PACKAGE_BADGE, PackageId } from "@/lib/packages";
import { createClient } from "@/lib/supabase/client";

type User = {
  id: string;
  email: string;
  role: string;
  created_at: string;
  student_profiles: { full_name: string | null; hourly_rate: number | null; package: string | null } | null;
};

// ── Test-user data pools ──────────────────────────────────────────────────────

const STUDENT_FIRST = [
  "Anders", "Anna", "Camilla", "Christian", "Emma", "Frederik", "Freja",
  "Hannah", "Ida", "Jakob", "Jesper", "Jonas", "Julie", "Karen", "Kasper",
  "Laura", "Lars", "Line", "Louise", "Mads", "Maja", "Maria", "Martin",
  "Mette", "Mikkel", "Nanna", "Nicolai", "Oliver", "Pernille", "Peter",
  "Rasmus", "Sara", "Simon", "Sofie", "Søren", "Thomas", "Tine", "Tobias",
  "Victor", "Stine",
];
const STUDENT_LAST = [
  "Andersen", "Christensen", "Hansen", "Henriksen", "Jakobsen", "Jensen",
  "Jørgensen", "Kristensen", "Larsen", "Madsen", "Mikkelsen", "Mortensen",
  "Nielsen", "Olsen", "Pedersen", "Petersen", "Poulsen", "Rasmussen",
  "Sørensen", "Thomsen",
];
const COMPANY_NAMES = [
  "Nordisk Solutions", "Borealis Consulting", "Vikinge Data", "Øresund Tech",
  "Kronborg Kreativ", "Danbo Logistics", "Fjord Digital", "Amager Innovation",
  "Fynske Systemer", "Jyllands Tech", "Frederiksberg Group", "Roskilde Consult",
  "Odense Digital", "Aarhus Software", "Aalborg Industries", "Helsingør Media",
  "Silkeborg Analytics", "Vejle Ventures", "Kolding Connect", "Esbjerg Group",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomSuffix(): string {
  return Math.random().toString(36).substring(2, 8);
}
function generateData(role: "student" | "company"): { name: string; email: string } {
  if (role === "student") {
    const name = `${pick(STUDENT_FIRST)} ${pick(STUDENT_LAST)}`;
    const email = `test-kandidat-${randomSuffix()}@studentmatch.dk`;
    return { name, email };
  }
  const name = pick(COMPANY_NAMES);
  const email = `test-virksomhed-${randomSuffix()}@studentmatch.dk`;
  return { name, email };
}

// ── Create-test-user modal ────────────────────────────────────────────────────

function CreateTestUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [role, setRole] = useState<"student" | "company">("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Generate initial values on mount
  useEffect(() => {
    const d = generateData("student");
    setName(d.name);
    setEmail(d.email);
  }, []);

  function handleRoleChange(r: "student" | "company") {
    setRole(r);
    const d = generateData(r);
    setName(d.name);
    setEmail(d.email);
    setError(null);
  }

  function handleRegenerate() {
    const d = generateData(role);
    setName(d.name);
    setEmail(d.email);
    setError(null);
  }

  async function handleSubmit() {
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    setError(null);
    const result = await createTestUser(role, name.trim(), email.trim());
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
    } else {
      window.open(result.url, "_blank", "noopener,noreferrer");
      onCreated();
      onClose();
    }
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-gray-900">Opret testbruger</h2>
            <p className="text-xs text-gray-400 mt-0.5">Fiktive data — åbner ny fane og logger ind med det samme</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Role selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rolle</label>
          <div className="flex gap-2">
            {(["student", "company"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleChange(r)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                  role === r
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {r === "student" ? "Kandidat" : "Virksomhed"}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {role === "student" ? "Navn" : "Virksomhedsnavn"}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {/* Regenerate link */}
        <button
          type="button"
          onClick={handleRegenerate}
          className="text-xs text-gray-400 hover:text-gray-700 underline transition-colors"
        >
          Generer nye tilfældige data
        </button>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Annuller
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !name.trim() || !email.trim()}
            className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Opretter…" : "Opret & log ind som"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  function fetchUsers() {
    const supabase = createClient();
    supabase
      .from("users")
      .select("id, email, role, created_at, student_profiles(full_name, hourly_rate, package)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setUsers((data as unknown as User[]) || []);
        setLoading(false);
      });
  }

  useEffect(() => { fetchUsers(); }, []);

  if (loading) return <Loading />;

  return (
    <>
      {showModal && (
        <CreateTestUserModal
          onClose={() => setShowModal(false)}
          onCreated={fetchUsers}
        />
      )}

      <div className="p-8">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Brugerstyring</h1>
            <p className="text-gray-500 text-sm">
              Administrer roller og indstil timepris for arbejdssøgende
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            + Opret testbruger
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Rolle</th>
                <th className="px-6 py-3 text-left">Navn</th>
                <th className="px-6 py-3 text-left">Timepris (kr/t)</th>
                <th className="px-6 py-3 text-left">Pakke</th>
                <th className="px-6 py-3 text-left">Oprettet</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <UserRow key={u.id} user={u} onUpdated={fetchUsers} />
              ))}
            </tbody>
          </table>
          {!users.length && (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">Ingen brugere fundet.</p>
          )}
        </div>
      </div>
    </>
  );
}

// ── Existing UserRow (unchanged) ──────────────────────────────────────────────

function UserRow({ user, onUpdated }: { user: User; onUpdated: () => void }) {
  const [rateState, rateAction, savingRate] = useActionState(
    async (prev: any, fd: FormData) => {
      const res = await setHourlyRate(prev, fd);
      if (res.success) onUpdated();
      return res;
    },
    {}
  );
  const [roleState, roleAction, savingRole] = useActionState(
    async (prev: any, fd: FormData) => {
      const res = await updateUserRole(prev, fd);
      if (res.success) onUpdated();
      return res;
    },
    {}
  );
  const [pkgState, pkgAction, savingPkg] = useActionState(
    async (prev: any, fd: FormData) => {
      const res = await setStudentPackage(prev, fd);
      if (res.success) onUpdated();
      return res;
    },
    {}
  );

  const currentPkg = (user.student_profiles?.package as PackageId) || "bronze";

  return (
    <tr className="hover:bg-gray-50/50">
      <td className="px-6 py-3 font-medium text-gray-800">{user.email}</td>
      <td className="px-6 py-3">
        <form action={roleAction} className="flex items-center gap-2">
          <input type="hidden" name="userId" value={user.id} />
          <select
            name="role"
            defaultValue={user.role}
            className="border border-gray-200 rounded-lg text-xs px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="student">student</option>
            <option value="company">company</option>
            <option value="admin">admin</option>
          </select>
          <button type="submit" disabled={savingRole} className="text-xs text-gray-700 hover:underline disabled:opacity-50">
            {savingRole ? "…" : "Gem"}
          </button>
        </form>
      </td>
      <td className="px-6 py-3 text-gray-600">
        {user.student_profiles?.full_name || <span className="text-gray-300">—</span>}
      </td>
      <td className="px-6 py-3">
        {user.role === "student" ? (
          <form action={rateAction} className="flex items-center gap-2">
            <input type="hidden" name="studentId" value={user.id} />
            <input
              name="rate"
              type="number"
              min="0"
              step="0.01"
              defaultValue={user.student_profiles?.hourly_rate ?? ""}
              placeholder="0.00"
              className="border border-gray-200 rounded-lg text-xs px-2 py-1 w-20 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button type="submit" disabled={savingRate} className="text-xs text-gray-700 hover:underline disabled:opacity-50">
              {savingRate ? "…" : "Gem"}
            </button>
            {rateState?.success && <span className="text-xs text-green-600">✓</span>}
            {rateState?.error && <span className="text-xs text-red-500">{rateState.error}</span>}
          </form>
        ) : (
          <span className="text-gray-300 text-xs">N/A</span>
        )}
      </td>
      <td className="px-6 py-3">
        {user.role === "student" ? (
          <form action={pkgAction} className="flex items-center gap-2">
            <input type="hidden" name="studentId" value={user.id} />
            <select
              name="package"
              defaultValue={currentPkg}
              key={currentPkg}
              className="border border-gray-200 rounded-lg text-xs px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
            </select>
            <button type="submit" disabled={savingPkg} className="text-xs text-gray-700 hover:underline disabled:opacity-50">
              {savingPkg ? "…" : "Gem"}
            </button>
            {pkgState?.success === "ok" && (
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${PACKAGE_BADGE[currentPkg]}`}>✓</span>
            )}
            {pkgState?.error && <span className="text-xs text-red-500">{pkgState.error}</span>}
          </form>
        ) : (
          <span className="text-gray-300 text-xs">N/A</span>
        )}
      </td>
      <td className="px-6 py-3 text-gray-400 text-xs">
        {new Date(user.created_at).toLocaleDateString()}
      </td>
      <td className="px-6 py-3">
        <Link
          href={`/dashboard/admin/users/${user.id}`}
          className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          Se profil →
        </Link>
      </td>
    </tr>
  );
}

function Loading() {
  return (
    <div className="p-8 flex items-center justify-center h-64">
      <div className="text-gray-400 text-sm">Indlæser…</div>
    </div>
  );
}
