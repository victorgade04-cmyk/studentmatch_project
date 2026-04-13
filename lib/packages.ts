export type PackageId = "bronze" | "silver" | "gold";

export interface PackageDef {
  id: PackageId;
  name: string;
  price: string;
  priceNum: number;
  maxSkills: number | null;       // null = unlimited
  maxUploads: number | null;
  maxHoursPerWeek: number | null;
  maxTasks: number;
  hasBio: boolean;
  features: string[];
}

export const PACKAGES: Record<PackageId, PackageDef> = {
  bronze: {
    id: "bronze",
    name: "Bronze",
    price: "Gratis",
    priceNum: 0,
    maxSkills: 3,
    maxUploads: 1,
    maxHoursPerWeek: 5,
    maxTasks: 2,
    hasBio: false,
    features: [
      "Uddannelsesnavn og -sted",
      "Maks. 3 kompetencer",
      "1 fil/dokument upload (CV)",
      "Maks. 5 timer/uge",
      "Maks. 2 aktive opgaver",
    ],
  },
  silver: {
    id: "silver",
    name: "Silver",
    price: "39 kr/md",
    priceNum: 39,
    maxSkills: null,
    maxUploads: 3,
    maxHoursPerWeek: 10,
    maxTasks: 2,
    hasBio: true,
    features: [
      "Uddannelsesnavn og -sted",
      "Ubegrænsede kompetencer",
      "3 fil/dokument uploads",
      "Personlig bio",
      "Maks. 10 timer/uge",
      "Maks. 2 aktive opgaver",
    ],
  },
  gold: {
    id: "gold",
    name: "Gold",
    price: "79 kr/md",
    priceNum: 79,
    maxSkills: null,
    maxUploads: null,
    maxHoursPerWeek: null,
    maxTasks: 2,
    hasBio: true,
    features: [
      "Alt ubegrænset",
      "Ubegrænsede kompetencer",
      "Ubegrænsede fil/dokument uploads",
      "Personlig bio",
      "Ubegrænsede timer/uge",
      "Maks. 2 aktive opgaver",
    ],
  },
};

export const PACKAGE_BADGE: Record<PackageId, string> = {
  bronze: "bg-amber-100 text-amber-700",
  silver: "bg-gray-100 text-gray-600",
  gold: "bg-yellow-100 text-yellow-700",
};

// ── Company packages ────────────────────────────────────────────────────────

export type CompanyPackageId = "startup" | "small" | "medium" | "enterprise";

export interface CompanyPackageDef {
  id: CompanyPackageId;
  name: string;
  employees: string;
  price: string;
  priceNum: number;
  maxJobs: number | null; // null = unlimited
}

export const COMPANY_PACKAGES: Record<CompanyPackageId, CompanyPackageDef> = {
  startup: {
    id: "startup",
    name: "Startup",
    employees: "1-10",
    price: "500 kr/md",
    priceNum: 500,
    maxJobs: 2,
  },
  small: {
    id: "small",
    name: "Small",
    employees: "11-50",
    price: "2.000 kr/md",
    priceNum: 2000,
    maxJobs: 5,
  },
  medium: {
    id: "medium",
    name: "Medium",
    employees: "51-100",
    price: "5.000 kr/md",
    priceNum: 5000,
    maxJobs: 10,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    employees: "100+",
    price: "10.000 kr/md",
    priceNum: 10000,
    maxJobs: null,
  },
};

export const COMPANY_PACKAGE_BADGE: Record<CompanyPackageId, string> = {
  startup:    "bg-sky-100 text-sky-700",
  small:      "bg-violet-100 text-violet-700",
  medium:     "bg-orange-100 text-orange-700",
  enterprise: "bg-emerald-100 text-emerald-700",
};
