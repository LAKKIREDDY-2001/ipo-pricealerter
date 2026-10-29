import { syncIpoGuruSnapshot } from "../src/scripts/scrape";

// Seed from the configured provider only. No synthetic IPO records or chart points are created.
syncIpoGuruSnapshot().catch((error) => {
  console.error("IPO Guru data sync failed during seed.", error instanceof Error ? error.message : "sync_failed");
  process.exitCode = 1;
});
