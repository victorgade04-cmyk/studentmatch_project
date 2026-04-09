import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "@/app/login/actions";
import Link from "next/link";

const navLinks = {
  admin: [
    { href: "/dashboard/admin", label: "Overview" },
    { href: "/dashboard/admin/users", label: "Users" },
    { href: "/dashboard/admin/jobs", label: "Jobs" },
    { href: "/dashboard/admin/applications", label: "Applications" },
  ],
  student: [
    { href: "/dashboard/student", label: "Overview" },
    { href: "/dashboard/student/profile", label: "My Profile" },
    { href: "/dashboard/student/jobs", label: "Browse Jobs" },
    { href: "/dashboard/student/applications", label: "My Applications" },
  ],
  company: [
    { href: "/dashboard/company", label: "Overview" },
    { href: "/dashboard/company/profile", label: "Company Profile" },
    { href: "/dashboard/company/jobs", label: "My Jobs" },
    { href: "/dashboard/company/students", label: "Browse Students" },
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

  const role = (user.user_metadata?.role || "student") as
    | "admin"
    | "student"
    | "company";
  const links = navLinks[role] || navLinks.student;

  const roleLabel = { admin: "Admin", student: "Student", company: "Company" }[
    role
  ];
  const roleColor = {
    admin: "bg-red-100 text-red-700",
    student: "bg-blue-100 text-blue-700",
    company: "bg-green-100 text-green-700",
  }[role];

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <Link href="/" className="text-lg font-bold text-indigo-600">
            StudentMatch
          </Link>
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleColor}`}>
              {roleLabel}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 truncate">{user.email}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors font-medium"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <form action={signOut}>
            <button
              type="submit"
              className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
