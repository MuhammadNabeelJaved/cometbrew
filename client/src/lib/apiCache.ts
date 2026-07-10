interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const _cache = new Map<string, CacheEntry>();

export const apiCache = {
  get(key: string): unknown | null {
    const entry = _cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      _cache.delete(key);
      return null;
    }
    return entry.data;
  },

  set(key: string, data: unknown, ttlMs: number): void {
    _cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  },

  invalidate(keyPrefix: string): void {
    for (const key of _cache.keys()) {
      if (key.startsWith(keyPrefix)) _cache.delete(key);
    }
  },

  clear(): void {
    _cache.clear();
  },

  /**
   * Read a value persisted in localStorage. Unlike the in-memory cache,
   * expired entries are still returned with `stale: true` so callers can
   * render last-known data instantly while revalidating in the background.
   */
  getPersistent(key: string): { data: unknown; stale: boolean } | null {
    try {
      const raw = localStorage.getItem(PERSIST_PREFIX + key);
      if (!raw) return null;
      const entry = JSON.parse(raw) as CacheEntry;
      return { data: entry.data, stale: Date.now() > entry.expiresAt };
    } catch {
      return null;
    }
  },

  setPersistent(key: string, data: unknown, ttlMs: number): void {
    try {
      localStorage.setItem(
        PERSIST_PREFIX + key,
        JSON.stringify({ data, expiresAt: Date.now() + ttlMs })
      );
    } catch {
      // localStorage full or unavailable — persistence is best-effort
    }
  },

  invalidatePersistent(keyPrefix: string): void {
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith(PERSIST_PREFIX + keyPrefix)) localStorage.removeItem(key);
      }
    } catch {
      // localStorage unavailable — nothing to invalidate
    }
  },
};

const PERSIST_PREFIX = 'apicache:';

/** Convenience TTL constants in milliseconds */
export const TTL = {
  ONE_MIN:  60_000,
  TWO_MIN:  120_000,
  FIVE_MIN: 300_000,
  TEN_MIN:  600_000,
} as const;
