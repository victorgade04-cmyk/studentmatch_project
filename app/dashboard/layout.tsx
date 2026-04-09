import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "@/app/login/actions";
import Link from "next/link";
import { Suspense } from "react";
import AdminPreviewBar from "./AdminPreviewBar";

const navLinks = {
  admin: [
    { href: "/dashboard/admin", label: "Oversigt" },
    { href: "/dashboard/admin/users", label: "Brugere" },
    { href: "/dashboard/admin/jobs", label: "Jobs" },
    { href: "/dashboard/admin/applications", label: "Ansøgninger" },
  ],
  student: [
    { href: "/dashboard/student", label: "Oversigt" },
    { href: "/dashboard/student/profile", label: "Min profil" },
    { href: "/dashboard/student/jobs", label: "Se jobs" },
    { href: "/dashboard/student/applications", label: "Mine ansøgninger" },
  ],
  company: [
    { href: "/dashboard/company", label: "Oversigt" },
    { href: "/dashboard/company/profile", label: "Virksomhedsprofil" },
    { href: "/dashboard/company/jobs", label: "Mine jobs" },
    { href: "/dashboard/company/students", label: "Find studerende" },
  ],
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = (user.user_metadata?.role || "student") as "admin" | "student" | "company";
  const links = navLinks[role] || navLinks.student;

  const roleLabel = { admin: "Admin", student: "Studerende", company: "Virksomhed" }[role];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Admin preview bar — only shown when ?preview=admin is in the URL */}
      <Suspense>
        <AdminPreviewBar />
      </Suspense>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
          <div className="p-5 border-b border-gray-100">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
                <span className="text-white text-xs font-bold">SM</span>
              </div>
              <span className="font-bold text-gray-900 text-sm">StudentMatch</span>
            </Link>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {roleLabel}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1 truncate">{user.email}</p>
          </div>

          <nav className="flex-1 p-3 space-y-0.5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="p-3 border-t border-gray-100">
            <form action={signOut}>
              <button
                type="submit"
                className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Log ud
              </button>
            </form>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
