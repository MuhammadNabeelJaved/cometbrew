/**
 * In-memory performance stats store.
 * Singleton module — imported wherever metrics need to be recorded or read.
 *
 * Tracks:
 *  - Request counts and response times (60-bucket sliding window, 1 bucket = 1 minute)
 *  - Cache hits / misses
 *  - Web Vitals (last 200 entries, circular buffer)
 *  - Per-route error counts
 */

// ─── Request tracking ────────────────────────────────────────────────────────
// One bucket per minute, keep 60 minutes of history
const BUCKET_COUNT = 60;

// Each bucket: { ts (minute epoch), count, errors, totalMs }
const _buckets = Array.from({ length: BUCKET_COUNT }, () => ({ ts: 0, count: 0, errors: 0, totalMs: 0 }));
let _bucketIdx = 0;

function _currentMinute() {
  return Math.floor(Date.now() / 60_000);
}

function _getBucket() {
  const now = _currentMinute();
  let b = _buckets[_bucketIdx];
  if (b.ts !== now) {
    // Advance to next bucket, reset it
    _bucketIdx = (_bucketIdx + 1) % BUCKET_COUNT;
    b = _buckets[_bucketIdx];
    b.ts = now; b.count = 0; b.errors = 0; b.totalMs = 0;
  }
  return b;
}

export function recordRequest(durationMs, isError) {
  const b = _getBucket();
  b.count += 1;
  b.totalMs += durationMs;
  if (isError) b.errors += 1;
}

// ─── Cache tracking ──────────────────────────────────────────────────────────
const _cache = { hits: 0, misses: 0 };

export function recordCacheHit()  { _cache.hits  += 1; }
export function recordCacheMiss() { _cache.misses += 1; }

// ─── Web Vitals ──────────────────────────────────────────────────────────────
const VITALS_BUFFER_SIZE = 200;
const _vitals = [];

export function recordVital(name, value, rating) {
  if (_vitals.length >= VITALS_BUFFER_SIZE) _vitals.shift();
  _vitals.push({ name, value, rating, ts: Date.now() });
}

// ─── Read aggregates ─────────────────────────────────────────────────────────

/** Returns per-minute request/error/latency data for the last N minutes. */
export function getRequestHistory(minutes = 60) {
  const now = _currentMinute();
  const result = [];
  for (let i = 0; i < Math.min(minutes, BUCKET_COUNT); i++) {
    const b = _buckets[(_bucketIdx - i + BUCKET_COUNT) % BUCKET_COUNT];
    if (b.ts === 0) continue; // never written
    result.unshift({
      minute: b.ts * 60_000, // ms epoch
      count: b.count,
      errors: b.errors,
      avgMs: b.count > 0 ? Math.round(b.totalMs / b.count) : 0,
    });
  }
  return result;
}

/** Totals across the stored window. */
export function getRequestTotals() {
  let totalReqs = 0, totalErrors = 0, totalMs = 0, buckets = 0;
  for (const b of _buckets) {
    if (b.ts === 0) continue;
    totalReqs   += b.count;
    totalErrors += b.errors;
    totalMs     += b.totalMs;
    buckets++;
  }
  const currentBucket = _buckets[_bucketIdx];
  return {
    totalRequests:  totalReqs,
    totalErrors,
    errorRate:      totalReqs > 0 ? +((totalErrors / totalReqs) * 100).toFixed(1) : 0,
    avgResponseMs:  totalReqs > 0 ? Math.round(totalMs / totalReqs) : 0,
    reqsPerMin:     currentBucket.count, // current minute
  };
}

/** Cache summary. */
export function getCacheStats() {
  const total = _cache.hits + _cache.misses;
  return {
    hits:    _cache.hits,
    misses:  _cache.misses,
    total,
    hitRate: total > 0 ? +(((_cache.hits / total) * 100).toFixed(1)) : 0,
  };
}

/** Aggregated Web Vitals per metric name. */
export function getVitalsStats() {
  const grouped = {};
  for (const v of _vitals) {
    if (!grouped[v.name]) grouped[v.name] = { values: [], ratings: { good: 0, 'needs-improvement': 0, poor: 0 } };
    grouped[v.name].values.push(v.value);
    grouped[v.name].ratings[v.rating] = (grouped[v.name].ratings[v.rating] || 0) + 1;
  }
  const result = {};
  for (const [name, data] of Object.entries(grouped)) {
    const sorted = [...data.values].sort((a, b) => a - b);
    const avg = sorted.reduce((s, v) => s + v, 0) / sorted.length;
    const p75 = sorted[Math.floor(sorted.length * 0.75)] ?? 0;
    result[name] = {
      avg:  +avg.toFixed(1),
      p75:  +p75.toFixed(1),
      count: sorted.length,
      ratings: data.ratings,
    };
  }
  return result;
}

/** Raw vitals entries (last N). */
export function getRecentVitals(n = 50) {
  return _vitals.slice(-n);
}
