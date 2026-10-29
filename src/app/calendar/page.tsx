import type { Metadata } from "next";
import { IpoCalendar } from "@/components/calendar";
import { getIpoFeed } from "@/lib/server-data";
export const metadata: Metadata = { title: "IPO Calendar" };
export const dynamic = "force-dynamic";
export default async function CalendarPage() { return <IpoCalendar initialFeed={await getIpoFeed()} />; }
