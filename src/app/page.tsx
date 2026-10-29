import { Dashboard } from "@/components/dashboard";
import { getIpoFeed } from "@/lib/server-data";

export const dynamic = "force-dynamic";
export default async function HomePage() {
  const feed = await getIpoFeed();
  return <Dashboard initialFeed={feed} />;
}
