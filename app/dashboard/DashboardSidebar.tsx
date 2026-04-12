"use client";

import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/app/login/actions";

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
    { href: "/dashboard/student/package", label: "Skift pakke" },
    { href: "/dashboard/student/jobs", label: "Se jobs" },
    { href: "/dashboard/student/applications", label: "Mine ansøgninger" },
    { href: "/dashboard/messages", label: "Beskeder" },
  ],
  company: [
    { href: "/dashboard/company", label: "Oversigt" },
    { href: "/dashboard/company/profile", label: "Virksomhedsprofil" },
    { href: "/dashboard/company/jobs", label: "Mine jobs" },
    { href: "/dashboard/company/students", label: "Find studerende" },
    { href: "/dashboard/messages", label: "Beskeder" },
  ],
};

const roleLabels = { admin: "Admin", student: "Studerende", company: "Virksomhed" };

interface Props {
  userEmail: string;
  userRole: "admin" | "student" | "company";
}

export default function DashboardSidebar({ userEmail, userRole }: Props) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isPreview = searchParams.get("preview") === "admin";

  // When admin is in preview mode, determine which role is being previewed from the path
  let effectiveRole: "admin" | "student" | "company" = userRole;
  if (isPreview && userRole === "admin") {
    effectiveRole = pathname.includes("/company") ? "company" : "student";
  }

  const links = navLinks[effectiveRole];
  const roleLabel = roleLabels[effectiveRole];

  // Append ?preview=admin to all links so admin can navigate freely in preview mode
  const effectiveLinks = isPreview
    ? links.map((l) => ({ ...l, href: `${l.href}?preview=admin` }))
    : links;

  return (
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
        <p className="text-xs text-gray-400 mt-1 truncate">{userEmail}</p>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {effectiveLinks.map((link) => (
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
        {isPreview ? (
          <Link
            href="/dashboard/admin"
            className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors block"
          >
            Tilbage til admin
          </Link>
        ) : (
          <form action={signOut}>
            <button
              type="submit"
              className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Log ud
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}
