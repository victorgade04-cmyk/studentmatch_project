"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  COMPANY_PACKAGES,
  COMPANY_PACKAGE_BADGE,
  CompanyPackageId,
} from "@/lib/packages";

const packageOrder: CompanyPackageId[] = ["startup", "small", "medium", "enterprise"];

export default function CompanyPackagePage() {
  const [currentPkg, setCurrentPkg] = useState<CompanyPackageId>("startup");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // select("*") avoids a 400 if the package column hasn't been added yet.
        // maybeSingle() returns null data (not an error) when no profile row exists.
        const { data } = await supabase
          .from("company_profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        const pkg = (data as any)?.package as CompanyPackageId | undefined;
        if (pkg && pkg in COMPANY_PACKAGES) {
          setCurrentPkg(pkg);
        }
      } catch {
        // leave currentPkg at the "startup" default
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
        Oversigt over tilgængelige pakker og din nuværende adgang.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {packageOrder.map((pkgId) => {
          const pkg = COMPANY_PACKAGES[pkgId];
          const badgeClass = COMPANY_PACKAGE_BADGE[pkgId];
          const isCurrent = currentPkg === pkgId;

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

              <div className="mb-0.5">
                <span className="text-2xl font-black text-gray-900">{pkg.price}</span>
              </div>
              <p className="text-xs text-gray-400 mb-5">Pr. måned</p>

              <ul className="space-y-2.5 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-xs flex-shrink-0">✓</span>
                  <span>{pkg.employees} medarbejdere</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-xs flex-shrink-0">✓</span>
                  <span>
                    {pkg.maxJobs === null
                      ? "Ubegrænsede jobopslag"
                      : `Maks. ${pkg.maxJobs} aktive jobopslag`}
                  </span>
                </li>
              </ul>
            </div>
          );
        })}
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
        <p className="text-sm font-semibold text-gray-900 mb-1">Ønsker du at skifte pakke?</p>
        <p className="text-sm text-gray-500">
          Kontakt os på{" "}
          <a
            href="mailto:kontakt@studentmatch.dk"
            className="font-semibold text-gray-900 hover:underline"
          >
            kontakt@studentmatch.dk
          </a>{" "}
          for at opgradere din pakke.
        </p>
      </div>
    </div>
  );
}
