"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { setHourlyRate, setStudentPackage, updateUserRole } from "../actions";
import { PACKAGE_BADGE, PackageId } from "@/lib/packages";

type User = {
  id: string;
  email: string;
  role: string;
  created_at: string;
  student_profiles: { full_name: string | null; hourly_rate: number | null; package: string | null } | null;
};

// This page is a client component because it has inline mini-forms
// Data is fetched via a server component wrapper below
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("users")
      .select("id, email, role, created_at, student_profiles(full_name, hourly_rate, package)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setUsers((data as unknown as User[]) || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Brugerstyring</h1>
      <p className="text-gray-500 text-sm mb-8">
        Administrer roller og indstil timepris for arbejdssøgende
      </p>

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
              <UserRow key={u.id} user={u} onUpdated={() => {
                // re-fetch
                const supabase = createClient();
                supabase
                  .from("users")
                  .select("id, email, role, created_at, student_profiles(full_name, hourly_rate, package)")
                  .order("created_at", { ascending: false })
                  .then(({ data }) => setUsers((data as unknown as User[]) || []));
              }} />
            ))}
          </tbody>
        </table>
        {!users.length && (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">Ingen brugere fundet.</p>
        )}
      </div>
    </div>
  );
}

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
          <button
            type="submit"
            disabled={savingRole}
            className="text-xs text-gray-700 hover:underline disabled:opacity-50"
          >
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
            <button
              type="submit"
              disabled={savingRate}
              className="text-xs text-gray-700 hover:underline disabled:opacity-50"
            >
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
            <button
              type="submit"
              disabled={savingPkg}
              className="text-xs text-gray-700 hover:underline disabled:opacity-50"
            >
              {savingPkg ? "…" : "Gem"}
            </button>
            {pkgState?.success === "ok" && (
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${PACKAGE_BADGE[currentPkg]}`}>
                ✓
              </span>
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
