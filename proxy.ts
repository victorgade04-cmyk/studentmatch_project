import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public routes
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/auth/")
  ) {
    if (user && pathname === "/login") {
      const role = user.user_metadata?.role || "student";
      return NextResponse.redirect(
        new URL(`/dashboard/${role}`, request.url)
      );
    }
    return supabaseResponse;
  }

  // Require auth for everything else
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = user.user_metadata?.role || "student";

  // Redirect /dashboard → role dashboard
  if (pathname === "/dashboard") {
    return NextResponse.redirect(
      new URL(`/dashboard/${role}`, request.url)
    );
  }

  // Admin preview: allow admins to view student/company dashboards with ?preview=admin
  const isAdminPreview =
    role === "admin" && request.nextUrl.searchParams.get("preview") === "admin";

  // Guard role-specific routes
  if (pathname.startsWith("/dashboard/admin") && role !== "admin") {
    return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
  }
  if (pathname.startsWith("/dashboard/student") && role !== "student" && !isAdminPreview) {
    return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
  }
  if (pathname.startsWith("/dashboard/company") && role !== "company" && !isAdminPreview) {
    return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
