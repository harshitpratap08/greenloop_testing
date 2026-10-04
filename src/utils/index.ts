import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDate(iso: string): string {
  if (!iso) return "";
  const [datePart] = iso.split("T");
  const [yyyy, mm, dd] = datePart.split("-");
  if (!yyyy || !mm || !dd) return iso;
  return `${parseInt(dd, 10)} ${MONTHS[parseInt(mm, 10) - 1]} ${yyyy}`;
}

export function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function formatINRPerT(value: number): string {
  return `${formatINR(value)}/tonne`;
}

/** Human label for a material type key, including provider-defined custom types. */
export function materialTypeLabel(type: string): string {
  const known: Record<string, string> = {
    concrete: "Concrete",
    brick: "Brick",
    steel: "Steel",
    timber: "Timber",
    plasterboard: "Plasterboard",
    glass: "Glass",
  };
  if (known[type]) return known[type];
  if (!type) return "Material";
  return type
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatStamp(iso: string): string {
  if (!iso) return "";
  const d = formatDate(iso);
  if (iso.includes("T")) {
    const time = iso.split("T")[1].substring(0, 5);
    return `${d} · ${time}`;
  }
  return d;
}
