"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const SESSION_KEY = "sm_impersonated";

export default function ImpersonationBanner() {
  const params = useSearchParams();
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Persist the flag when the page first lands with ?impersonated=true
    if (params.get("impersonated") === "true") {
      sessionStorage.setItem(SESSION_KEY, "true");
    }
    setActive(sessionStorage.getItem(SESSION_KEY) === "true");
  }, [params]);

  async function handleExit() {
    sessionStorage.removeItem(SESSION_KEY);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.close();
    // Fallback if window.close() is blocked
    window.location.href = "/login";
  }

  if (!active) return null;

  return (
    <div className="w-full bg-amber-500 text-white px-5 py-2.5 flex items-center justify-between text-sm z-40">
      <div className="flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse flex-shrink-0" />
        <span className="font-medium">
          Du er logget ind som en anden bruger —{" "}
          <span className="font-bold">admin-impersonation</span>
        </span>
      </div>
      <button
        onClick={handleExit}
        className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap"
      >
        Afslut session
      </button>
    </div>
  );
}
