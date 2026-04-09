"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AdminPreviewBar() {
  const params = useSearchParams();
  const preview = params.get("preview");

  if (preview !== "admin") return null;

  // Detect which role is being previewed from the current path
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const role = path.includes("/student") ? "studerende" : "virksomhed";

  return (
    <div className="w-full bg-gray-900 text-white px-5 py-2.5 flex items-center justify-between text-sm z-40">
      <div className="flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        <span className="font-medium">
          Du ser som <span className="font-bold capitalize">{role}</span> — admin preview tilstand
        </span>
      </div>
      <Link
        href="/dashboard/admin"
        className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 transition-colors px-3 py-1 rounded-lg text-xs font-semibold"
      >
        ← Tilbage til admin
      </Link>
    </div>
  );
}
