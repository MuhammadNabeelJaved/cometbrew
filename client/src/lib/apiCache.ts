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
};

/** Convenience TTL constants in milliseconds */
export const TTL = {
  ONE_MIN:  60_000,
  TWO_MIN:  120_000,
  FIVE_MIN: 300_000,
  TEN_MIN:  600_000,
} as const;
