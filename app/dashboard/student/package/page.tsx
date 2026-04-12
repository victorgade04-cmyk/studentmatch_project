"use client";

import { useActionState, useState, useEffect } from "react";
import { updateStudentPackage } from "./actions";
import { PACKAGES, PACKAGE_BADGE, PackageId } from "@/lib/packages";
import { createClient } from "@/lib/supabase/client";

const initial: { error?: string; success?: string } = {};
const packageOrder: PackageId[] = ["bronze", "silver", "gold"];

export default function PackagePage() {
  const [currentPackage, setCurrentPackage] = useState<PackageId>("bronze");
  const [loading, setLoading] = useState(true);
  const [state, action, pending] = useActionState(updateStudentPackage, initial);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("student_profiles")
        .select("package")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.package) setCurrentPackage(data.package as PackageId);
          setLoading(false);
        });
    });
  }, [state]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Indlæser…</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-black text-gray-900 mb-1">Din pakke</h1>
      <p className="text-gray-500 text-sm mb-8">
        Vælg den pakke der passer bedst til dig. Du kan opgradere eller nedgradere til enhver tid.
      </p>

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
          {state.success}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {packageOrder.map((pkgId) => {
          const pkg = PACKAGES[pkgId];
          const isCurrent = currentPackage === pkgId;
          const badgeClass = PACKAGE_BADGE[pkgId];

          return (
            <div
              key={pkgId}
              className={`relative rounded-2xl border-2 p-6 transition-all ${
                isCurrent
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-100 bg-white hover:border-gray-300"
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  Nuværende pakke
                </div>
              )}

              <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold mb-4 ${badgeClass}`}>
                {pkg.name}
              </div>

              <div className="mb-1">
                <span className="text-3xl font-black text-gray-900">{pkg.price}</span>
              </div>
              <p className="text-gray-400 text-xs mb-5">
                {pkgId === "bronze" ? "Altid gratis" : "Pr. måned"}
              </p>

              <ul className="space-y-2.5 mb-6">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-xs flex-shrink-0">
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <form action={action}>
                <input type="hidden" name="package" value={pkgId} />
                <button
                  type="submit"
                  disabled={pending || isCurrent}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isCurrent
                      ? "bg-gray-900 text-white cursor-default"
                      : "border border-gray-200 text-gray-700 hover:bg-gray-900 hover:text-white hover:border-gray-900"
                  } disabled:opacity-60`}
                >
                  {isCurrent ? "Aktiv" : pending ? "Skifter…" : "Vælg pakke"}
                </button>
              </form>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-8">
        Betaling håndteres manuelt — kontakt os for at opgradere til Silver eller Gold.
      </p>
    </div>
  );
}
