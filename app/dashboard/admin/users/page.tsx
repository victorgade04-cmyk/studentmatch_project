"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { setHourlyRate, setStudentPackage, updateUserRole } from "../actions";
import { createTestUser, resetUserPassword } from "./actions";
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
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copiedField, setCopiedField] = useState<"email" | "password" | null>(null);
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
    setCredentials(null);
    setCopiedField(null);
  }

  function handleRegenerate() {
    const d = generateData(role);
    setName(d.name);
    setEmail(d.email);
    setError(null);
    setCredentials(null);
    setCopiedField(null);
  }

  async function handleCopy(text: string, field: "email" | "password") {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2500);
    } catch {
      // clipboard API unavailable — user can copy manually
    }
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
      setCredentials({ email: result.email, password: result.password });
      onCreated();
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

        {/* Credentials result */}
        {credentials && (
          <div className="space-y-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <p className="text-sm font-semibold text-green-800">Testbruger oprettet!</p>
            <p className="text-xs text-green-700">
              Åbn et inkognito vindue og log ind med disse oplysninger på{" "}
              <span className="font-medium">studentmatch.dk/login</span>
            </p>
            {(["email", "password"] as const).map((field) => (
              <div key={field} className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={credentials[field]}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="flex-1 min-w-0 border border-green-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(credentials[field], field)}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-green-700 text-white text-xs font-semibold hover:bg-green-800 transition-colors"
                >
                  {copiedField === field ? "Kopieret ✓" : field === "email" ? "Kopiér email" : "Kopiér kode"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {credentials ? "Luk" : "Annuller"}
          </button>
          {!credentials && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !name.trim() || !email.trim()}
              className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Opretter…" : "Opret & log ind som"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Types & helpers for quick-login ──────────────────────────────────────────

type SavedCredential = {
  email: string;
  password: string;
  role: "student" | "company";
  displayName: string;
  savedAt: number;
};

const LS_KEY = "admin_quick_logins";

function loadSaved(): SavedCredential[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function pushSaved(cred: SavedCredential) {
  const existing = loadSaved().filter((c) => c.email !== cred.email);
  const next = [cred, ...existing].slice(0, 3);
  localStorage.setItem(LS_KEY, JSON.stringify(next));
}

// ── CredentialPopup ────────────────────────────────────────────────────────────

function CredentialPopup({
  email,
  password,
  onClose,
}: {
  email: string;
  password: string;
  onClose: () => void;
}) {
  const [copiedField, setCopiedField] = useState<"email" | "password" | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  async function copy(text: string, field: "email" | "password") {
    try { await navigator.clipboard.writeText(text); } catch {}
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-gray-900">Log ind som bruger</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
        </div>

        <p className="text-xs text-gray-500">
          Nyt midlertidigt kodeord genereret. Åbn et inkognito-vindue og log ind på{" "}
          <span className="font-medium">studentmatch.dk/login</span>
        </p>

        <div className="space-y-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          {(["email", "password"] as const).map((field) => (
            <div key={field} className="flex gap-2">
              <input
                readOnly
                value={field === "email" ? email : password}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="flex-1 min-w-0 border border-blue-200 rounded-lg px-2.5 py-1.5 text-xs bg-white font-mono text-gray-700 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => copy(field === "email" ? email : password, field)}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 transition-colors"
              >
                {copiedField === field ? "Kopieret ✓" : field === "email" ? "Kopiér email" : "Kopiér kode"}
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Luk
        </button>
      </div>
    </div>
  );
}

// ── LoginAsButton ─────────────────────────────────────────────────────────────

function LoginAsButton({ user }: { user: User }) {
  const [loading, setLoading] = useState(false);
  const [creds, setCreds] = useState<{ email: string; password: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const result = await resetUserPassword(user.id);
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setCreds(result);
    pushSaved({
      email: result.email,
      password: result.password,
      role: user.role as "student" | "company",
      displayName: user.student_profiles?.full_name ?? user.email,
      savedAt: Date.now(),
    });
  }

  return (
    <>
      {creds && (
        <CredentialPopup
          email={creds.email}
          password={creds.password}
          onClose={() => setCreds(null)}
        />
      )}
      <div className="flex flex-col items-end gap-0.5">
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 transition-colors font-medium whitespace-nowrap"
        >
          {loading ? "…" : "Log ind som"}
        </button>
        {error && <span className="text-xs text-red-500 max-w-[120px] text-right leading-tight">{error}</span>}
      </div>
    </>
  );
}

// ── QuickAccessPanel ──────────────────────────────────────────────────────────

function QuickAccessPanel() {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<SavedCredential[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null);

  useEffect(() => { setSaved(loadSaved()); }, [open]);

  async function copy(text: string, key: string) {
    try { await navigator.clipboard.writeText(text); } catch {}
    setCopiedIdx(key);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  const roleLabel = (r: string) => r === "student" ? "Kandidat" : "Virksomhed";

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-72 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-black text-gray-900">Hurtig login</span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 text-lg leading-none">✕</button>
          </div>
          {saved.length === 0 ? (
            <p className="px-4 py-5 text-xs text-gray-400 text-center">Ingen gemte logins endnu.<br />Klik "Log ind som" på en bruger.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {saved.map((c, i) => (
                <div key={c.email} className="px-4 py-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{c.displayName}</p>
                      <p className="text-xs text-gray-400 truncate">{c.email}</p>
                      <span className="inline-block text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full mt-0.5">
                        {roleLabel(c.role)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => copy(c.email, `${i}-email`)}
                      className="flex-1 text-xs py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
                    >
                      {copiedIdx === `${i}-email` ? "✓ Email" : "Kopiér email"}
                    </button>
                    <button
                      type="button"
                      onClick={() => copy(c.password, `${i}-pw`)}
                      className="flex-1 text-xs py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
                    >
                      {copiedIdx === `${i}-pw` ? "✓ Kode" : "Kopiér kode"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold shadow-lg hover:bg-gray-700 transition-colors"
      >
        Hurtig login
        {saved.length > 0 && (
          <span className="bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
            {saved.length}
          </span>
        )}
      </button>
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
      <QuickAccessPanel />

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
      <td className="px-6 py-3">
        {(user.role === "student" || user.role === "company") && (
          <LoginAsButton user={user} />
        )}
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
