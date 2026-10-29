import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authSecret } from "@/lib/auth-secret";
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/admin" },
  providers: [CredentialsProvider({
    name: "Admin credentials",
    credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
    async authorize(credentials) {
      if (!credentials || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) return null;
      if (credentials.email !== process.env.ADMIN_EMAIL || credentials.password !== process.env.ADMIN_PASSWORD) return null;
      return { id: credentials.email, email: credentials.email, name: "Pricealerter admin" };
    }
  })],
  secret: authSecret
};
