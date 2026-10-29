import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: { default: "Pricealerter — IPOs, made clear", template: "%s | Pricealerter" },
  description: "Track Indian IPO dates, subscription, price bands and grey market premium in one clear dashboard.",
  openGraph: { title: "Pricealerter — IPOs, made clear", description: "Your clear view of India's IPO market.", type: "website" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-IN"><body><Providers><SiteHeader /><main>{children}</main><footer className="site-footer"><div className="footer-inner"><div className="brand-lockup"><span className="brand-mark small"><span>₹</span></span><span>Pricealerter</span></div><span>Made for clearer IPO decisions.</span><span className="footer-links"><a href="/calendar">Calendar</a><a href="/gmp">GMP tracker</a><a href="/admin">Admin</a><a href="https://www.ipoguru.in/" target="_blank" rel="noreferrer">IPO data by IPO Guru</a></span><span className="footer-copy">© 2026 Pricealerter</span></div><div className="disclaimer">Pricealerter is an information tool, not investment advice. GMP is unofficial and can be volatile. Always verify details in the offer documents.</div></footer></Providers></body></html>
}
