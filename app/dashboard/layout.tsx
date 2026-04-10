import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import AdminPreviewBar from "./AdminPreviewBar";
import DashboardSidebar from "./DashboardSidebar";

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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Admin preview bar — only shown when ?preview=admin is in the URL */}
      <Suspense>
        <AdminPreviewBar />
      </Suspense>

      <div className="flex flex-1">
        {/* Sidebar — client component so it can read search params for preview mode */}
        <Suspense>
          <DashboardSidebar userEmail={user.email!} userRole={role} />
        </Suspense>

        {/* Main */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
