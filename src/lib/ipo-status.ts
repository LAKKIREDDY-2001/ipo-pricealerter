import type { IpoStatus } from "@/lib/data";

export function ipoStatusForDates(openDate: string, closeDate: string, listingDate?: string): IpoStatus {
  const now = new Date();
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Kolkata" }).format(now);
  if (listingDate && listingDate <= today) return "LISTED";
  if (!openDate || openDate > today) return "UPCOMING";
  const istTime = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hourCycle: "h23", hour: "2-digit", minute: "2-digit" }).format(now);
  if (closeDate && (closeDate < today || (closeDate === today && istTime >= "17:00"))) return "CLOSED";
  return "OPEN";
}
