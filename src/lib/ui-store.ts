import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type DashboardTab = "All IPOs" | "Open" | "Upcoming" | "Live" | "Closed" | "Listed";
type UiState = { tab: DashboardTab; board: string; exchange: string; query: string; sort: string; set: (key: "tab"|"board"|"exchange"|"query"|"sort", value: string) => void; clear: () => void };
export const useUiStore = create<UiState>((set) => ({ tab: "All IPOs", board: "All boards", exchange: "All exchanges", query: "", sort: "Recommended", set: (key, value) => set({ [key]: value } as Pick<UiState, typeof key>), clear: () => set({ tab: "All IPOs", board: "All boards", exchange: "All exchanges", query: "", sort: "Recommended" }) }));

type WatchlistState = { slugs: string[]; hydrated: boolean; toggle: (slug: string) => void; setHydrated: (value: boolean) => void };
export const useWatchlistStore = create<WatchlistState>()(persist((set) => ({
  slugs: [], hydrated: false,
  toggle: (slug) => set((state) => ({ slugs: state.slugs.includes(slug) ? state.slugs.filter((item) => item !== slug) : [...state.slugs, slug] })),
  setHydrated: (hydrated) => set({ hydrated })
}), { name: "pricealerter-watchlist", storage: createJSONStorage(() => localStorage), partialize: (state) => ({ slugs: state.slugs } as WatchlistState), onRehydrateStorage: () => (state) => state?.setHydrated(true) }));
