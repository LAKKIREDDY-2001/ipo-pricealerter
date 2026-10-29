// Local-only fallback keeps the admin sign-in page usable in a fresh development checkout.
// Production deployments must set NEXTAUTH_SECRET explicitly.
export const authSecret = process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV === "development" ? "pricealerter-local-development-secret" : undefined);
