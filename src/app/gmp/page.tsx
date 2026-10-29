import type { Metadata } from "next";
import { GmpTracker } from "@/components/gmp-tracker";
export const metadata: Metadata = { title: "IPO GMP Tracker" };
export default function GmpPage() { return <GmpTracker/>; }
