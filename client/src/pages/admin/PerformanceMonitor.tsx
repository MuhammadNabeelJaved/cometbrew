/**
 * Admin — Performance Monitor
 * Real-time server health, cache stats, request metrics, and Web Vitals.
 * Auto-refreshes every 30 seconds; manual refresh available.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Database, Zap, Server, RefreshCw, Clock,
  MemoryStick, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, XCircle, Wifi, WifiOff, BarChart3, Globe,
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import apiClient from '../../api/apiClient';

// ─── Types ───────────────────────────────────────────────────────────────────

interface HealthStats {
  timestamp: string;
  uptime: number;
  uptimeFormatted: string;
  status: 'ok' | 'degraded';
  services: { db: string; redis: string };
  memory: {
    heapUsedMB: number;
    heapTotalMB: number;
    externalMB: number;
    rssMB: number;
    heapUsedPct: number;
  };
  requests: {
    totalRequests: number;
    totalErrors: number;
    errorRate: number;
    avgResponseMs: number;
    reqsPerMin: number;
  };
  requestHistory: Array<{ minute: number; count: number; errors: number; avgMs: number }>;
  cache: { hits: number; misses: number; total: number; hitRate: number; cachedKeys: number };
  vitals: Record<string, { avg: number; p75: number; count: number; ratings: Record<string, number> }>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const REFRESH_INTERVAL = 30_000; // 30 seconds

const VITAL_THRESHOLDS: Record<string, { good: number; poor: number; unit: string }> = {
  LCP:  { good: 2500,  poor: 4000,  unit: 'ms' },
  FID:  { good: 100,   poor: 300,   unit: 'ms' },
  CLS:  { good: 0.1,   poor: 0.25,  unit: '' },
  TTFB: { good: 800,   poor: 1800,  unit: 'ms' },
  FCP:  { good: 1800,  poor: 3000,  unit: 'ms' },
  INP:  { good: 200,   poor: 500,   unit: 'ms' },
};

function vitalRating(name: string, avg: number): 'good' | 'needs-improvement' | 'poor' {
  const t = VITAL_THRESHOLDS[name];
  if (!t) return 'good';
  if (avg <= t.good) return 'good';
  if (avg <= t.poor) return 'needs-improvement';
  return 'poor';
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const ok = status === 'connected' || status === 'ok';
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'} shadow-[0_0_6px_currentColor]`} />
  );
}

function StatCard({
  icon: Icon, label, value, sub, accent = false, warn = false,
}: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; accent?: boolean; warn?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-5 flex items-start gap-4 ${
        warn ? 'border-amber-500/30 bg-amber-500/5' : accent ? 'border-primary/30 bg-primary/5' : 'border-border/50 bg-card'
      }`}
    >
      <div className={`p-2 rounded-xl ${warn ? 'bg-amber-500/10 text-amber-500' : accent ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
}

function MiniBarChart({ history }: { history: HealthStats['requestHistory'] }) {
  if (!history.length) return (
    <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">No data yet</div>
  );
  const max = Math.max(...history.map(b => b.count), 1);
  return (
    <div className="flex items-end gap-0.5 h-20 w-full">
      {history.map((b, i) => {
        const pct = (b.count / max) * 100;
        const errPct = b.count > 0 ? (b.errors / b.count) * 100 : 0;
        const time = new Date(b.minute).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative" title={`${time} — ${b.count} reqs, ${b.errors} errors, avg ${b.avgMs}ms`}>
            <div className="w-full flex flex-col justify-end" style={{ height: `${Math.max(pct, 4)}%` }}>
              <div className="w-full bg-red-500/70 rounded-t-none" style={{ height: `${errPct}%`, minHeight: b.errors > 0 ? '2px' : '0' }} />
              <div className="w-full bg-primary/50 rounded-t-sm flex-1" style={{ height: `${100 - errPct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VitalBadge({ rating }: { rating: string }) {
  const map: Record<string, string> = {
    good: 'bg-green-500/10 text-green-500 border-green-500/20',
    'needs-improvement': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    poor: 'bg-red-500/10 text-red-500 border-red-500/20',
  };
  return <Badge className={`border text-xs font-medium ${map[rating] ?? map.good}`}>{rating === 'needs-improvement' ? 'Needs Work' : rating.charAt(0).toUpperCase() + rating.slice(1)}</Badge>;
}

function MemoryBar({ used, total, label }: { used: number; total: number; label: string }) {
  const pct = Math.min(Math.round((used / total) * 100), 100);
  const color = pct > 85 ? 'bg-red-500' : pct > 65 ? 'bg-amber-500' : 'bg-primary';
  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{label}</span>
        <span>{used} / {total} MB ({pct}%)</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PerformanceMonitor() {
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/health/stats');
      setStats(res.data);
      setLastRefresh(new Date());
      setCountdown(REFRESH_INTERVAL / 1000);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load performance stats');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh
  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => fetchStats(true), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [lastRefresh]);

  // ── Render ──
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Performance Monitor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time server health, cache, and Web Vitals
            {lastRefresh && (
              <span className="ml-2 text-xs">· Last updated: {lastRefresh.toLocaleTimeString()}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground tabular-nums">
            Refresh in {countdown}s
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchStats()}
            disabled={loading}
            className="gap-2 rounded-full"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading && !stats && (
        <div className="flex items-center justify-center h-64">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
          </div>
        </div>
      )}

      {stats && (
        <>
          {/* ── Services Status ── */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Services</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className={`rounded-2xl border p-5 flex items-center gap-3 ${stats.status === 'ok' ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                {stats.status === 'ok'
                  ? <CheckCircle className="h-6 w-6 text-green-500" />
                  : <XCircle className="h-6 w-6 text-red-500" />
                }
                <div>
                  <p className="text-xs text-muted-foreground">Server</p>
                  <p className="font-semibold text-foreground capitalize">{stats.status}</p>
                </div>
              </div>

              <div className={`rounded-2xl border p-5 flex items-center gap-3 ${stats.services.db === 'connected' ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                <Database className={`h-6 w-6 ${stats.services.db === 'connected' ? 'text-green-500' : 'text-red-500'}`} />
                <div>
                  <p className="text-xs text-muted-foreground">MongoDB</p>
                  <p className="font-semibold text-foreground capitalize">{stats.services.db}</p>
                </div>
              </div>

              <div className={`rounded-2xl border p-5 flex items-center gap-3 ${stats.services.redis === 'connected' ? 'border-green-500/30 bg-green-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
                {stats.services.redis === 'connected'
                  ? <Wifi className="h-6 w-6 text-green-500" />
                  : <WifiOff className="h-6 w-6 text-amber-500" />
                }
                <div>
                  <p className="text-xs text-muted-foreground">Redis Cache</p>
                  <p className="font-semibold text-foreground capitalize">{stats.services.redis}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/50 bg-card p-5 flex items-center gap-3">
                <Clock className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Uptime</p>
                  <p className="font-semibold text-foreground">{stats.uptimeFormatted}</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Request Metrics ── */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Request Metrics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <StatCard icon={TrendingUp}   label="Total Requests"    value={stats.requests.totalRequests.toLocaleString()} accent />
              <StatCard icon={Activity}     label="Reqs / This Minute" value={stats.requests.reqsPerMin} />
              <StatCard icon={Clock}        label="Avg Response Time"  value={`${stats.requests.avgResponseMs} ms`} accent={stats.requests.avgResponseMs < 300} warn={stats.requests.avgResponseMs > 800} />
              <StatCard icon={AlertTriangle} label="Error Rate"        value={`${stats.requests.errorRate}%`} warn={stats.requests.errorRate > 5} sub={`${stats.requests.totalErrors} errors`} />
            </div>

            {/* Bar chart */}
            <div className="rounded-2xl border border-border/50 bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">Request History</h3>
                  <p className="text-xs text-muted-foreground">Last 30 minutes · <span className="text-primary">■</span> requests <span className="text-red-500 ml-1">■</span> errors</p>
                </div>
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
              <MiniBarChart history={stats.requestHistory} />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                {stats.requestHistory.length > 0 && (
                  <>
                    <span>{new Date(stats.requestHistory[0].minute).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>{new Date(stats.requestHistory[stats.requestHistory.length - 1].minute).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* ── Memory ── */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Memory</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <MemoryStick className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">Heap Usage</span>
                </div>
                <MemoryBar used={stats.memory.heapUsedMB} total={stats.memory.heapTotalMB} label="Heap" />
              </div>
              <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">Process Memory</span>
                </div>
                {[
                  { label: 'RSS (Total)', value: stats.memory.rssMB },
                  { label: 'Heap Used', value: stats.memory.heapUsedMB },
                  { label: 'Heap Total', value: stats.memory.heapTotalMB },
                  { label: 'External', value: stats.memory.externalMB },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono font-medium text-foreground">{value} MB</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Cache Stats ── */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Redis Cache</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <StatCard icon={Zap}        label="Hit Rate"       value={`${stats.cache.hitRate}%`} accent={stats.cache.hitRate >= 50} />
              <StatCard icon={TrendingUp} label="Cache Hits"     value={stats.cache.hits.toLocaleString()} accent />
              <StatCard icon={TrendingDown} label="Cache Misses" value={stats.cache.misses.toLocaleString()} />
              <StatCard icon={Database}   label="Cached Keys"   value={stats.cache.cachedKeys} sub={stats.services.redis !== 'connected' ? 'Redis unavailable' : undefined} />
            </div>
            {stats.cache.total > 0 && (
              <div className="rounded-2xl border border-border/50 bg-card p-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Hit Rate</span>
                  <span className="font-medium text-foreground">{stats.cache.hitRate}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-700"
                    style={{ width: `${stats.cache.hitRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{stats.cache.hits} hits</span>
                  <span>{stats.cache.misses} misses</span>
                </div>
              </div>
            )}
          </section>

          {/* ── Web Vitals ── */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Web Vitals</h2>
            {Object.keys(stats.vitals).length === 0 ? (
              <div className="rounded-2xl border border-border/50 bg-card p-8 text-center">
                <Globe className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No Web Vitals data yet.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Data appears after real users visit the site.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(stats.vitals).map(([name, data]) => {
                  const rating = vitalRating(name, data.avg);
                  const threshold = VITAL_THRESHOLDS[name];
                  const unit = threshold?.unit ?? 'ms';
                  const displayVal = unit === 'ms' ? `${Math.round(data.avg)} ms` : data.avg.toFixed(3);
                  const p75Val    = unit === 'ms' ? `${Math.round(data.p75)} ms` : data.p75.toFixed(3);
                  const goodRatings = data.ratings['good'] ?? 0;
                  const total = Object.values(data.ratings).reduce((a, b) => a + b, 0);
                  const goodPct = total > 0 ? Math.round((goodRatings / total) * 100) : 0;

                  return (
                    <motion.div
                      key={name}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-2xl border border-border/50 bg-card p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground font-mono mb-1">{name}</p>
                          <p className="text-3xl font-bold text-foreground">{displayVal}</p>
                          <p className="text-xs text-muted-foreground mt-1">p75: {p75Val} · {data.count} samples</p>
                        </div>
                        <VitalBadge rating={rating} />
                      </div>
                      <div className="space-y-1.5 text-xs">
                        {Object.entries(data.ratings).map(([r, count]) => (
                          <div key={r} className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r === 'good' ? 'bg-green-500' : r === 'needs-improvement' ? 'bg-amber-500' : 'bg-red-500'}`} />
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${r === 'good' ? 'bg-green-500' : r === 'needs-improvement' ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                              />
                            </div>
                            <span className="text-muted-foreground w-8 text-right">{count}</span>
                          </div>
                        ))}
                      </div>
                      {threshold && (
                        <p className="text-xs text-muted-foreground/60 mt-3 border-t border-border/50 pt-3">
                          Good ≤ {threshold.good}{unit} · Poor &gt; {threshold.poor}{unit}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Footer */}
          <p className="text-xs text-muted-foreground/50 text-center pb-4">
            Stats are in-memory and reset on server restart · Auto-refreshes every 30s
          </p>
        </>
      )}
    </div>
  );
}
