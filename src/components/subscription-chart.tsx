"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
type Row = { day: number; retail?: number; nii?: number; qib?: number; total?: number };
export function SubscriptionChart({ data }: { data: Row[] }) {
  return <div className="subscription-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 4, right: 2, bottom: 0, left: -24 }} barGap={6}><CartesianGrid strokeDasharray="3 4" vertical={false} stroke="#edf0f5"/><XAxis dataKey="day" tickFormatter={(v)=>`Day ${v}`} axisLine={false} tickLine={false} tick={{ fill:"#8b96a7",fontSize:11 }}/><YAxis axisLine={false} tickLine={false} tick={{ fill:"#a2abba",fontSize:10 }}/><Tooltip formatter={(v)=>[`${v}x`]} labelFormatter={(v)=>`Day ${v}`}/><Bar dataKey="retail" name="Retail" stackId="a" fill="#287FFF" radius={[0,0,0,0]}/><Bar dataKey="nii" name="NII" stackId="a" fill="#8DB9FF"/><Bar dataKey="qib" name="QIB" stackId="a" fill="#C8DCFF" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>;
}
