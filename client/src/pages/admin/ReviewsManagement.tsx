/**
 * Admin — Reviews & Testimonials Management
 * View, approve, reject, and delete client project reviews.
 * Backend: /api/v1/reviews (getAllReviewsAdmin, updateReviewStatus, deleteReview, getReviewStatistics)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, CheckCircle, XCircle, Trash2, RefreshCw,
  MessageSquare, TrendingUp, Clock, Filter, Search,
  ThumbsUp, AlertTriangle,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import apiClient from '../../api/apiClient';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Review {
  _id: string;
  rating: number;
  reviewText: string;
  status: 'pending' | 'approved' | 'rejected';
  project?: { _id: string; projectName?: string; projectTitle?: string };
  reviewer?: { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  averageRating: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StarRow({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'h-5 w-5' : 'h-3.5 w-3.5';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={`${cls} ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: Review['status'] }) {
  const map: Record<string, string> = {
    pending:  'bg-amber-500/10 text-amber-500 border-amber-500/20',
    approved: 'bg-green-500/10 text-green-500 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
  };
  return <Badge className={`border text-xs font-medium capitalize ${map[status]}`}>{status}</Badge>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [reviewsRes, statsRes] = await Promise.allSettled([
        apiClient.get('/reviews'),
        apiClient.get('/reviews/statistics'),
      ]);

      if (reviewsRes.status === 'fulfilled') {
        const data = reviewsRes.value.data?.data;
        setReviews(Array.isArray(data) ? data : Array.isArray(data?.reviews) ? data.reviews : []);
      }
      if (statsRes.status === 'fulfilled') {
        const s = statsRes.value.data?.data;
        if (s) setStats(s);
      }
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(id + status);
    try {
      await apiClient.put(`/reviews/${id}/status`, { status });
      setReviews(prev => prev.map(r => r._id === id ? { ...r, status } : r));
      if (stats) {
        const old = reviews.find(r => r._id === id)?.status;
        setStats(prev => prev ? {
          ...prev,
          [status]:   (prev[status] ?? 0) + 1,
          [old ?? '']: Math.max(0, (prev[old as keyof ReviewStats] as number ?? 0) - 1),
        } : prev);
      }
      toast.success(status === 'approved' ? 'Review approved and published' : 'Review rejected');
    } catch {
      toast.error('Failed to update review status');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return;
    setActionLoading(id + 'delete');
    try {
      await apiClient.delete(`/reviews/${id}`);
      setReviews(prev => prev.filter(r => r._id !== id));
      toast.success('Review deleted');
    } catch {
      toast.error('Failed to delete review');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter
  const filtered = reviews.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (ratingFilter !== 'all' && r.rating !== parseInt(ratingFilter)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.reviewText?.toLowerCase().includes(q) && !r.reviewer?.name?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // ── Render ──
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Reviews & Testimonials
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Moderate client reviews before they appear publicly</p>
        </div>
        <Button size="sm" variant="outline" onClick={fetchAll} disabled={loading} className="gap-2 rounded-full self-start sm:self-auto">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: 'Total', value: stats.total,    icon: MessageSquare, color: 'text-foreground' },
            { label: 'Pending',  value: stats.pending,  icon: Clock,         color: 'text-amber-500' },
            { label: 'Approved', value: stats.approved, icon: CheckCircle,   color: 'text-green-500' },
            { label: 'Rejected', value: stats.rejected, icon: XCircle,       color: 'text-red-500' },
            { label: 'Avg Rating', value: stats.averageRating?.toFixed(1) ?? '—', icon: Star, color: 'text-amber-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border/50 bg-card p-4 flex items-center gap-3">
              <Icon className={`h-5 w-5 flex-shrink-0 ${color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold text-foreground">{value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by reviewer or text…" className="pl-9 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="rounded-full text-sm border-border/50 bg-background h-10 px-3">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
        </div>
        <Select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)}
          className="rounded-full text-sm border-border/50 bg-background h-10 px-3">
          <option value="all">All Ratings</option>
          {[5, 4, 3, 2, 1].map(n => (
            <option key={n} value={String(n)}>{n} Star{n > 1 ? 's' : ''}</option>
          ))}
        </Select>
      </div>

      {/* Review List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-border/50 bg-card">
          <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No reviews found</p>
          {(statusFilter !== 'all' || search) && (
            <button onClick={() => { setStatusFilter('all'); setSearch(''); setRatingFilter('all'); }}
              className="text-xs text-primary mt-2 hover:underline">Clear filters</button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map(review => (
              <motion.div
                key={review._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className={`rounded-2xl border bg-card p-5 sm:p-6 transition-colors ${
                  review.status === 'pending' ? 'border-amber-500/20' : 'border-border/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
                    {review.reviewer?.name?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="font-semibold text-foreground">{review.reviewer?.name ?? 'Anonymous'}</span>
                      <StatusBadge status={review.status} />
                      <StarRow rating={review.rating} />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{review.reviewText}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground/70">
                      {review.reviewer?.email && <span>{review.reviewer.email}</span>}
                      {review.project && (
                        <span>Project: {review.project.projectName || review.project.projectTitle || review.project._id}</span>
                      )}
                      <span>{new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {review.status !== 'approved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(review._id, 'approved')}
                        disabled={!!actionLoading}
                        className="gap-1.5 rounded-full border-green-500/30 text-green-500 hover:bg-green-500/10 hover:text-green-500 text-xs"
                      >
                        {actionLoading === review._id + 'approved'
                          ? <RefreshCw className="h-3 w-3 animate-spin" />
                          : <ThumbsUp className="h-3 w-3" />
                        }
                        Approve
                      </Button>
                    )}
                    {review.status !== 'rejected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(review._id, 'rejected')}
                        disabled={!!actionLoading}
                        className="gap-1.5 rounded-full border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-500 text-xs"
                      >
                        {actionLoading === review._id + 'rejected'
                          ? <RefreshCw className="h-3 w-3 animate-spin" />
                          : <XCircle className="h-3 w-3" />
                        }
                        Reject
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteReview(review._id)}
                      disabled={!!actionLoading}
                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                    >
                      {actionLoading === review._id + 'delete'
                        ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />
                      }
                    </Button>
                  </div>
                </div>

                {/* Pending notice */}
                {review.status === 'pending' && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-amber-500 bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                    This review is awaiting approval and is not visible to the public yet.
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-center pb-2">
          Showing {filtered.length} of {reviews.length} reviews
        </p>
      )}
    </div>
  );
}
