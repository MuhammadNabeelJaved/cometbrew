import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  Server,
  RefreshCw,
  HardDrive,
  Activity,
  Clock,
  Download,
  Search,
  ChevronDown,
  ChevronUp,
  Play,
  AlertTriangle,
  Layers,
  Users,
  FolderOpen,
  MessageSquare,
  Bell,
  Briefcase,
  FileJson,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Select, SelectItem } from '../../components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { toast } from 'sonner';
import apiClient from '../../api/apiClient';

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return [d && d + 'd', h && h + 'h', m && m + 'm'].filter(Boolean).join(' ') || '< 1m';
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PIE_COLORS = ['#7c3aed', '#2563eb', '#16a34a', '#d97706', '#dc2626', '#0891b2'];

// ─── Types ───────────────────────────────────────────────────────────────────
interface DbStats {
  db: {
    db: string;
    collections: number;
    objects: number;
    dataSize: number;
    storageSize: number;
    indexSize: number;
    avgObjSize: number;
    indexes: number;
  };
  server: {
    uptime: number;
    connections: { current: number; available: number; totalCreated: number };
    mem: { resident: number; virtual: number };
    opcounters: { insert: number; query: number; update: number; delete: number };
    network: { bytesIn: number; bytesOut: number; numRequests: number };
    host: string;
    version: string;
  };
}

interface CollectionInfo {
  name: string;
  count: number;
  sizeKB: number;
  avgObjSize: number;
  storageKB: number;
  indexSizeKB: number;
  indexCount: number;
}

interface CollectionDetail {
  stats: CollectionInfo;
  indexes: { name: string; key: Record<string, unknown>; unique?: boolean }[];
  sampleDocs: unknown[];
}

interface InsightsData {
  signupsByMonth: { _id: { year: number; month: number }; count: number }[];
  usersByRole: { _id: string; count: number }[];
  projectsByStatus: { _id: string; count: number }[];
  jobAppsByStatus: { _id: string; count: number }[];
  totals: {
    users: number;
    projects: number;
    messages: number;
    conversations: number;
    notifications: number;
    jobApplications: number;
  };
}

interface QueryResult {
  collection: string;
  count: number;
  executionTimeMs: number;
  results: Record<string, unknown>[];
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/10 rounded-lg ${className ?? ''}`} />;
}

// ─── Tab 1: Overview ─────────────────────────────────────────────────────────
function OverviewTab({ stats }: { stats: DbStats | null }) {
  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const { db, server } = stats;
  const connCurrent = server?.connections?.current ?? 0;
  const connAvailable = server?.connections?.available ?? 0;
  const totalConnections = connCurrent + connAvailable;
  const connPct = totalConnections > 0 ? Math.round((connCurrent / totalConnections) * 100) : 0;
  const hasServerStats = !!(server?.connections || server?.opcounters);

  const opcData = [
    { name: 'Insert', value: server?.opcounters?.insert ?? 0, color: '#7c3aed' },
    { name: 'Query', value: server?.opcounters?.query ?? 0, color: '#2563eb' },
    { name: 'Update', value: server?.opcounters?.update ?? 0, color: '#d97706' },
    { name: 'Delete', value: server?.opcounters?.delete ?? 0, color: '#dc2626' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* 4 stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Database Size</p>
                <p className="text-2xl font-bold mt-1">{formatBytes(db.dataSize)}</p>
                <p className="text-xs text-muted-foreground mt-1">Storage: {formatBytes(db.storageSize)}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-xl">
                <HardDrive className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Documents</p>
                <p className="text-2xl font-bold mt-1">{db.objects.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Avg: {formatBytes(db.avgObjSize)}</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <Database className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Collections</p>
                <p className="text-2xl font-bold mt-1">{db.collections}</p>
                <p className="text-xs text-muted-foreground mt-1">DB: {db.db}</p>
              </div>
              <div className="p-2 bg-green-500/10 rounded-xl">
                <Layers className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Indexes</p>
                <p className="text-2xl font-bold mt-1">{db.indexes}</p>
                <p className="text-xs text-muted-foreground mt-1">Index size: {formatBytes(db.indexSize)}</p>
              </div>
              <div className="p-2 bg-amber-500/10 rounded-xl">
                <Activity className="h-5 w-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Server Health */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              Server Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Host</p>
                <p className="font-mono text-xs mt-0.5 truncate">{server?.host ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">MongoDB Version</p>
                <p className="font-mono text-xs mt-0.5">{server?.version ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Uptime</p>
                <p className="font-medium text-xs mt-0.5">{server?.uptime != null ? formatUptime(server.uptime) : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Requests</p>
                <p className="font-medium text-xs mt-0.5">{(server?.network?.numRequests ?? 0).toLocaleString()}</p>
              </div>
            </div>

            {/* Connections progress */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Connections</span>
                <span className="font-medium">{connCurrent} / {totalConnections}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-purple-400 rounded-full transition-all"
                  style={{ width: `${connPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total created: {(server?.connections?.totalCreated ?? 0).toLocaleString()}</p>
            </div>

            {/* Memory */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Resident RAM</p>
                <p className="font-semibold text-sm mt-0.5">{server?.mem?.resident ?? '—'} MB</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Virtual RAM</p>
                <p className="font-semibold text-sm mt-0.5">{server?.mem?.virtual ?? '—'} MB</p>
              </div>
            </div>

            {/* Network */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Network In</p>
                <p className="font-semibold text-sm mt-0.5">{server?.network?.bytesIn != null ? formatBytes(server.network.bytesIn) : '—'}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Network Out</p>
                <p className="font-semibold text-sm mt-0.5">{server?.network?.bytesOut != null ? formatBytes(server.network.bytesOut) : '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operations */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Operations (opcounters)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {opcData.map((op) => (
                <div key={op.name} className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{op.name}</p>
                    <p className="font-bold text-lg mt-0.5">{(op.value ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: op.color + '22' }}>
                    <span className="h-3 w-3 rounded-full block" style={{ background: op.color }} />
                  </div>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={opcData} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: '#1a1040', border: '1px solid #7c3aed33', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#ccc' }}
                  cursor={{ fill: 'rgba(124,58,237,0.08)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {opcData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

// ─── Tab 2: Collections ───────────────────────────────────────────────────────
function CollectionsTab({ collections, loading }: { collections: CollectionInfo[]; loading: boolean }) {
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [detail, setDetail] = useState<CollectionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const filtered = collections.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  async function handleRowClick(name: string) {
    if (expandedRow === name) {
      setExpandedRow(null);
      setDetail(null);
      return;
    }
    setExpandedRow(name);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await apiClient.get(`/database/collections/${name}`);
      setDetail(res.data?.data ?? null);
    } catch {
      toast.error(`Failed to load details for ${name}`);
    } finally {
      setDetailLoading(false);
    }
  }

  function formatSize(kb: number): string {
    if (kb >= 1024) return (kb / 1024).toFixed(1) + ' MB';
    return kb.toFixed(1) + ' KB';
  }

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14" />)}
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search collections..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white/5 border-white/10"
        />
      </div>

      <Card className="bg-white/5 border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Collection</th>
                <th className="text-right px-4 py-3 font-medium">Documents</th>
                <th className="text-right px-4 py-3 font-medium">Size</th>
                <th className="text-right px-4 py-3 font-medium">Avg Doc</th>
                <th className="text-right px-4 py-3 font-medium">Indexes</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((col) => (
                <React.Fragment key={col.name}>
                  <tr
                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => handleRowClick(col.name)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Database className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="font-medium">{col.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{col.count.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{formatSize(col.sizeKB)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{formatBytes(col.avgObjSize)}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="outline" className="border-white/20 text-xs">{col.indexCount}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {expandedRow === col.name ? (
                        <ChevronUp className="h-4 w-4 ml-auto text-primary" />
                      ) : (
                        <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />
                      )}
                    </td>
                  </tr>

                  {expandedRow === col.name && (
                    <tr>
                      <td colSpan={6} className="bg-white/[0.03] border-b border-white/10 px-4 py-4">
                        {detailLoading ? (
                          <div className="space-y-2">
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-20" />
                          </div>
                        ) : detail ? (
                          <div className="space-y-4">
                            {/* Indexes */}
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Indexes</p>
                              <div className="flex flex-wrap gap-2">
                                {detail.indexes.map((idx) => (
                                  <div key={idx.name} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs">
                                    <span className="font-mono font-medium">{idx.name}</span>
                                    {idx.unique && <Badge className="bg-primary/20 text-primary border-0 text-[10px] h-4 px-1">unique</Badge>}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Sample Docs */}
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Sample Documents ({Math.min(detail.sampleDocs.length, 5)})
                              </p>
                              <div className="space-y-2">
                                {detail.sampleDocs.slice(0, 5).map((doc, i) => (
                                  <pre
                                    key={i}
                                    className="bg-black/30 border border-white/10 rounded-lg p-3 text-xs font-mono overflow-x-auto overflow-y-auto max-h-[200px] text-green-300/80"
                                  >
                                    {JSON.stringify(doc, null, 2)}
                                  </pre>
                                ))}
                              </div>
                            </div>

                            <Button variant="outline" size="sm" className="border-white/20" onClick={() => { setExpandedRow(null); setDetail(null); }}>
                              Close
                            </Button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                    No collections found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Tab 3: Insights ──────────────────────────────────────────────────────────
function InsightsTab() {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/database/insights');
        setInsights(res.data?.data ?? null);
      } catch {
        toast.error('Failed to load insights');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-52" />
          <Skeleton className="h-52" />
        </div>
      </motion.div>
    );
  }

  if (!insights) return null;

  const { totals, signupsByMonth, usersByRole, projectsByStatus, jobAppsByStatus } = insights;

  const signupChartData = signupsByMonth.map((item) => ({
    name: `${MONTH_NAMES[item._id.month - 1]} ${item._id.year}`,
    count: item.count,
  }));

  const totalCards = [
    { label: 'Users', value: totals.users, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Projects', value: totals.projects, icon: FolderOpen, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Messages', value: totals.messages, icon: MessageSquare, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Conversations', value: totals.conversations, icon: MessageSquare, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Notifications', value: totals.notifications, icon: Bell, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Job Applications', value: totals.jobApplications, icon: Briefcase, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {totalCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="bg-white/5 border-white/10">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${card.bg}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="text-xl font-bold">{card.value.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Signups chart */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">User Signups by Month</CardTitle>
        </CardHeader>
        <CardContent>
          {signupChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={signupChartData} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1a1040', border: '1px solid #7c3aed33', borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: 'rgba(124,58,237,0.08)' }}
                />
                <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8 text-sm">No signup data available</p>
          )}
        </CardContent>
      </Card>

      {/* Pie charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Users by Role */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Users by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={usersByRole}
                    dataKey="count"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    innerRadius={35}
                  >
                    {usersByRole.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1a1040', border: '1px solid #7c3aed33', borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 min-w-[90px]">
                {usersByRole.map((item, idx) => (
                  <div key={item._id} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <span className="capitalize text-muted-foreground">{item._id || 'Unknown'}</span>
                    <span className="font-semibold ml-auto">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects by Status */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Projects by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={projectsByStatus} layout="vertical" barSize={14}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="_id" type="category" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip
                  contentStyle={{ background: '#1a1040', border: '1px solid #7c3aed33', borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: 'rgba(124,58,237,0.08)' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {projectsByStatus.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Job Apps by Status */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Job Applications by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={jobAppsByStatus} layout="vertical" barSize={14}>
              <XAxis type="number" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="_id" type="category" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip
                contentStyle={{ background: '#1a1040', border: '1px solid #7c3aed33', borderRadius: 8, fontSize: 12 }}
                cursor={{ fill: 'rgba(124,58,237,0.08)' }}
              />
              <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Tab 4: Query Builder ─────────────────────────────────────────────────────
function QueryTab({ collections }: { collections: CollectionInfo[] }) {
  const [collection, setCollection] = useState('');
  const [filter, setFilter] = useState('{}');
  const [projection, setProjection] = useState('{}');
  const [sort, setSort] = useState('{}');
  const [limit, setLimit] = useState(20);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  async function handleExecute() {
    if (!collection) { toast.error('Please select a collection'); return; }
    let parsedFilter: unknown, parsedProjection: unknown, parsedSort: unknown;
    try { parsedFilter = JSON.parse(filter || '{}'); } catch { toast.error('Invalid filter JSON'); return; }
    try { parsedProjection = JSON.parse(projection || '{}'); } catch { toast.error('Invalid projection JSON'); return; }
    try { parsedSort = JSON.parse(sort || '{}'); } catch { toast.error('Invalid sort JSON'); return; }

    setExecuting(true);
    setResult(null);
    setExpandedRows(new Set());
    try {
      const res = await apiClient.post('/database/query', {
        collection,
        filter: parsedFilter,
        projection: parsedProjection,
        sort: parsedSort,
        limit: Math.min(limit, 50),
      });
      setResult(res.data?.data ?? null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Query failed';
      toast.error(msg);
    } finally {
      setExecuting(false);
    }
  }

  function toggleRow(idx: number) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  const columns = result && result.results.length > 0
    ? Object.keys(result.results[0]).slice(0, 8)
    : [];

  function truncate(val: unknown): string {
    const s = typeof val === 'object' ? JSON.stringify(val) : String(val);
    return s.length > 50 ? s.slice(0, 50) + '...' : s;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Play className="h-4 w-4 text-primary" />
            Query Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Collection */}
            <div className="space-y-1.5">
              <Label className="text-xs">Collection</Label>
              <Select
                value={collection}
                onValueChange={setCollection}
                className="bg-white/5 border-white/10"
              >
                <SelectItem value="">-- Select collection --</SelectItem>
                {collections.map((c) => (
                  <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                ))}
              </Select>
            </div>
            {/* Limit */}
            <div className="space-y-1.5">
              <Label className="text-xs">Limit (max 50)</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={limit}
                onChange={(e) => setLimit(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Filter (JSON)</Label>
              <textarea
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                rows={4}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                spellCheck={false}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Projection (JSON, optional)</Label>
              <textarea
                value={projection}
                onChange={(e) => setProjection(e.target.value)}
                rows={4}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                spellCheck={false}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Sort (JSON, optional)</Label>
              <textarea
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                rows={4}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                spellCheck={false}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleExecute} disabled={executing} className="gap-2 bg-primary hover:bg-primary/90">
              {executing ? (
                <><RefreshCw className="h-4 w-4 animate-spin" />Executing...</>
              ) : (
                <><Play className="h-4 w-4" />Execute Query</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result ? (
        <Card className="bg-white/5 border-white/10 overflow-hidden">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm">
              Results: {result.count} document{result.count !== 1 ? 's' : ''}
            </CardTitle>
            <Badge variant="outline" className="border-white/20 text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {result.executionTimeMs}ms
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {result.results.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                <Database className="h-8 w-8 mx-auto mb-3 opacity-30" />
                No documents found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-muted-foreground">
                      <th className="px-3 py-2 text-left w-10">#</th>
                      {columns.map((col) => (
                        <th key={col} className="px-3 py-2 text-left font-medium">{col}</th>
                      ))}
                      <th className="px-3 py-2 text-left">Raw JSON</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((row, i) => (
                      <React.Fragment key={i}>
                        <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                          {columns.map((col) => (
                            <td key={col} className="px-3 py-2 font-mono max-w-[180px] truncate">
                              {truncate(row[col])}
                            </td>
                          ))}
                          <td className="px-3 py-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] px-2"
                              onClick={() => toggleRow(i)}
                            >
                              {expandedRows.has(i) ? 'Hide' : 'View'}
                            </Button>
                          </td>
                        </tr>
                        {expandedRows.has(i) && (
                          <tr className="border-b border-white/10">
                            <td colSpan={columns.length + 2} className="px-3 py-2">
                              <pre className="bg-black/30 border border-white/10 rounded-lg p-3 text-[11px] font-mono text-green-300/80 overflow-x-auto max-h-60">
                                {JSON.stringify(row, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : !executing && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-12 text-center">
            <Database className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground text-sm">Execute a query to see results</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

// ─── Tab 5: Export ────────────────────────────────────────────────────────────
function ExportTab({ collections }: { collections: CollectionInfo[] }) {
  const [downloading, setDownloading] = useState<string | null>(null);

  async function handleExport(name: string) {
    setDownloading(name);
    try {
      const res = await apiClient.get(`/database/export/${name}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}-export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${name} successfully`);
    } catch {
      toast.error(`Failed to export ${name}`);
    } finally {
      setDownloading(null);
    }
  }

  function formatSize(kb: number): string {
    if (kb >= 1024) return (kb / 1024).toFixed(1) + ' MB';
    return kb.toFixed(1) + ' KB';
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Warning */}
      <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-200/80">
          Exports include up to <strong>1,000 documents</strong> per collection. For full exports, use mongodump directly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {collections.map((col) => (
          <Card key={col.name} className="bg-white/5 border-white/10 hover:border-white/20 transition-colors">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileJson className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{col.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {col.count.toLocaleString()} docs · {formatSize(col.sizeKB)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 gap-1.5 flex-shrink-0"
                disabled={downloading === col.name}
                onClick={() => handleExport(col.name)}
              >
                {downloading === col.name ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Export JSON
              </Button>
            </CardContent>
          </Card>
        ))}

        {collections.length === 0 && (
          <div className="col-span-2 py-12 text-center text-muted-foreground text-sm">
            <Database className="h-8 w-8 mx-auto mb-3 opacity-30" />
            No collections available
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DatabaseManager() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DbStats | null>(null);
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.get('/database/stats');
      setStats(res.data?.data ?? null);
    } catch {
      toast.error('Failed to load database stats');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchCollections = useCallback(async () => {
    try {
      const res = await apiClient.get('/database/collections');
      setCollections(res.data?.data ?? []);
    } catch {
      toast.error('Failed to load collections');
    } finally {
      setCollectionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchCollections();
  }, [fetchStats, fetchCollections]);

  async function handleRefresh() {
    setRefreshing(true);
    setStatsLoading(true);
    setCollectionsLoading(true);
    await Promise.allSettled([fetchStats(), fetchCollections()]);
    setRefreshing(false);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
            Database Manager
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Monitor health, execute queries, and manage your MongoDB database
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 border-white/20"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border border-white/10 h-auto p-1 gap-1">
          <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-primary/20">
            <Database className="h-3.5 w-3.5 mr-1.5" />Overview
          </TabsTrigger>
          <TabsTrigger value="collections" className="text-xs data-[state=active]:bg-primary/20">
            <Layers className="h-3.5 w-3.5 mr-1.5" />Collections
          </TabsTrigger>
          <TabsTrigger value="insights" className="text-xs data-[state=active]:bg-primary/20">
            <Activity className="h-3.5 w-3.5 mr-1.5" />Insights
          </TabsTrigger>
          <TabsTrigger value="query" className="text-xs data-[state=active]:bg-primary/20">
            <Play className="h-3.5 w-3.5 mr-1.5" />Query
          </TabsTrigger>
          <TabsTrigger value="export" className="text-xs data-[state=active]:bg-primary/20">
            <Download className="h-3.5 w-3.5 mr-1.5" />Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab stats={statsLoading ? null : stats} />
        </TabsContent>

        <TabsContent value="collections">
          <CollectionsTab collections={collections} loading={collectionsLoading} />
        </TabsContent>

        <TabsContent value="insights">
          <InsightsTab />
        </TabsContent>

        <TabsContent value="query">
          <QueryTab collections={collections} />
        </TabsContent>

        <TabsContent value="export">
          <ExportTab collections={collections} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
