"use client";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { GmpObservation } from "@/lib/data";

function observationTime(point: GmpObservation | undefined) {
  if (!point) return "";
  const value = point.timestamp ?? point.date;
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", ...(point.timestamp ? { hour: "2-digit", minute: "2-digit" } : {}) }).format(new Date(value)) + (point.timestamp ? " IST" : "");
}

export function GmpChart({ data }: { data: GmpObservation[] }) {
  return <div className="gmp-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 6, right: 2, bottom: 0, left: 2 }}><defs><linearGradient id="gmpFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#18A878" stopOpacity={.22} /><stop offset="100%" stopColor="#18A878" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#99A2B2", fontSize: 10 }} tickMargin={7} /><Tooltip content={({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const point = payload[0]?.payload as GmpObservation | undefined;
    return <div className="chart-tooltip"><b>{observationTime(point)}</b><span>GMP ₹{point?.gmp ?? "—"}</span></div>;
  }} /><Area type="monotone" dataKey="gmp" stroke="#18A878" strokeWidth={2.4} fill="url(#gmpFill)" activeDot={{ r: 4, fill: "#18A878", stroke: "white", strokeWidth: 2 }} /></AreaChart></ResponsiveContainer></div>;
}
