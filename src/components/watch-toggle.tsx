"use client";
import { useWatchlistStore } from "@/lib/ui-store";
export function WatchToggle({ slug }: { slug: string }) {
  const watched = useWatchlistStore((state) => state.slugs.includes(slug)); const hydrated = useWatchlistStore((state) => state.hydrated); const toggle = useWatchlistStore((state) => state.toggle);
  return <button className={`watch-button ${watched ? "watching" : ""}`} onClick={() => toggle(slug)} aria-pressed={watched}><span>{watched ? "★" : "☆"}</span> {watched ? "In your watchlist" : "Add to watchlist"}{hydrated && watched && <i className="watch-check">✓</i>}</button>;
}
