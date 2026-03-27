/**
 * User Applied Jobs Page
 * Shows all job applications submitted by the logged-in user.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Calendar, ExternalLink, Loader2, FileText } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { getMyApplications } from '../../api/jobApplications.api';
import { toast } from 'sonner';

const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  reviewing:   'bg-blue-500/10 text-blue-600 border-blue-500/30',
  shortlisted: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  hired:       'bg-green-500/10 text-green-600 border-green-500/30',
  rejected:    'bg-red-500/10 text-red-600 border-red-500/30',
};

export default function UserAppliedJobs() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyApplications()
      .then(res => setApplications(res.data.data?.applications || []))
      .catch(() => toast.error('Failed to load your applications'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Applications</h1>
        <p className="text-muted-foreground mt-1">Track the status of your job applications.</p>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
          <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h3 className="text-xl font-semibold mb-2">No applications yet</h3>
          <p className="text-muted-foreground mb-6">You haven't applied to any jobs yet.</p>
          <Button asChild>
            <Link to="/careers">Browse Open Positions</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app, i) => (
            <motion.div
              key={app._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold">
                          {app.job?.jobTitle || app.desiredRole || 'Position'}
                        </h3>
                        <Badge
                          variant="outline"
                          className={STATUS_STYLES[app.status] || 'bg-muted text-muted-foreground'}
                        >
                          {app.status?.charAt(0).toUpperCase() + app.status?.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {app.job?.department && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {app.job.department}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Applied {new Date(app.createdAt).toLocaleDateString()}
                        </span>
                        {app.experienceLevel && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                            {app.experienceLevel}
                          </span>
                        )}
                      </div>
                      {app.adminNotes && (
                        <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 mt-2">
                          <span className="font-medium text-foreground">Note: </span>
                          {app.adminNotes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {app.resumeUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="w-4 h-4 mr-2" />
                            Resume
                          </a>
                        </Button>
                      )}
                      {app.job?._id && (
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/careers/${app.job._id}`}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Job
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
