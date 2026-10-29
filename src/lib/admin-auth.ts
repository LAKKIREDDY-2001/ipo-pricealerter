import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user ? null : NextResponse.json({ error: "Admin sign-in required" }, { status: 401 });
}
