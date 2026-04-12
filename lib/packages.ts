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
