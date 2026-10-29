type Entry<T> = { value: T; expiresAt: number };
const cache = new Map<string, Entry<unknown>>();
export function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key) as Entry<T> | undefined;
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return undefined; }
  return entry.value;
}
export function setCached<T>(key: string, value: T, ttlMs = 60_000) { cache.set(key, { value, expiresAt: Date.now() + ttlMs }); }
export function invalidateCache(keyPrefix = "") { for (const key of cache.keys()) if (key.startsWith(keyPrefix)) cache.delete(key); }
