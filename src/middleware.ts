import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { authSecret } from "@/lib/auth-secret";
export async function middleware(request: NextRequest) {
  // /admin is the sign-in screen; any nested admin page requires a valid JWT.
  if (request.nextUrl.pathname === "/admin") return NextResponse.next();
  const token = authSecret ? await getToken({ req: request, secret: authSecret }) : null;
  if (!token) {
    const signInUrl = new URL("/admin", request.url);
    signInUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(signInUrl);
  }
  return NextResponse.next();
}
export const config = { matcher: ["/admin/:path*"] };
